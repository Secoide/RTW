const state = {
  empresas: [],
  recursos: [],
  empresaAtual: null,
  recursosEmpresa: [],
  usuariosEmpresa: [],
  feedbacks: []
};

const byId = id => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.mensagem || "Erro no painel do dono.");
    err.data = data;
    throw err;
  }
  return data;
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  byId("ownerLoginForm").addEventListener("submit", loginOwner);
  byId("btnOwnerLogout").addEventListener("click", logoutOwner);
  byId("btnNovaEmpresa").addEventListener("click", limparFormEmpresa);
  byId("ownerEmpresaForm").addEventListener("submit", salvarEmpresa);
  byId("btnExcluirEmpresa").addEventListener("click", excluirEmpresa);
  byId("btnSalvarRecursos").addEventListener("click", salvarRecursos);
  byId("btnSyncRecursos").addEventListener("click", sincronizarRecursos);
  byId("ownerUsuarioForm").addEventListener("submit", vincularUsuario);
  byId("ownerBuscaEmpresa").addEventListener("input", renderEmpresas);
  byId("ownerBuscaUsuario").addEventListener("input", renderUsuarios);
  byId("btnAtualizarFeedbacks")?.addEventListener("click", carregarFeedbacks);
  byId("ownerFeedbackStatusFiltro")?.addEventListener("change", renderFeedbacks);
  byId("ownerFeedbackBusca")?.addEventListener("input", renderFeedbacks);
  byId("ownerFeedbacksLista")?.addEventListener("click", handleFeedbackClick);

  const status = await api("/api/owner/status").catch(() => ({ autenticado: false }));
  if (status.autenticado) abrirPainel();
}

async function loginOwner(event) {
  event.preventDefault();

  try {
    await api("/api/owner/login", {
      method: "POST",
      body: JSON.stringify({ senha: byId("ownerSenha").value })
    });
    abrirPainel();
  } catch (err) {
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Acesso negado",
      text: err.message
    });
  }
}

async function abrirPainel() {
  byId("ownerLogin").hidden = true;
  byId("ownerPanel").hidden = false;
  try {
    await Promise.all([carregarRecursos(), carregarEmpresas(), carregarFeedbacks()]);
  } catch (err) {
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Painel não carregou",
      text: `${err.message} Verifique se as tabelas SaaS foram criadas no MySQL.`
    });
  }
}

async function logoutOwner() {
  await api("/api/owner/logout", { method: "POST" });
  location.reload();
}

async function carregarRecursos() {
  state.recursos = (await api("/api/owner/recursos")).filter(recurso => recurso.chave !== "menu.relatos");
  const recursosObrigatorios = ["menu.prototipo_atributos", "menu.spda"];
  if (recursosObrigatorios.some(chave => !state.recursos.some(recurso => recurso.chave === chave))) {
    state.recursos = (await api("/api/owner/recursos/sincronizar", { method: "POST" }))
      .filter(recurso => recurso.chave !== "menu.relatos");
  }
  renderRecursos();
}

async function sincronizarRecursos() {
  state.recursos = await api("/api/owner/recursos/sincronizar", { method: "POST" });
  renderRecursos();
}

async function carregarEmpresas() {
  state.empresas = await api("/api/owner/empresas");
  renderEmpresas();
}

function renderEmpresas() {
  const termo = byId("ownerBuscaEmpresa").value.toLowerCase();
  const empresas = state.empresas.filter(empresa => {
    return `${empresa.nome} ${empresa.codigo} ${empresa.plano}`.toLowerCase().includes(termo);
  });

  byId("ownerEmpresasLista").innerHTML = empresas.map(empresa => `
    <button type="button" class="owner-company-item ${state.empresaAtual?.id_empresa_saas === empresa.id_empresa_saas ? "active" : ""}" data-id="${empresa.id_empresa_saas}">
      <strong>${escapeHtml(empresa.nome)}</strong>
      <small>${escapeHtml(empresa.codigo)} | ${escapeHtml(empresa.plano)} | ${escapeHtml(empresa.status)}</small>
    </button>
  `).join("");

  byId("ownerEmpresasLista").querySelectorAll("[data-id]").forEach(button => {
    button.addEventListener("click", () => carregarEmpresa(button.dataset.id));
  });
}

async function carregarEmpresa(id) {
  const data = await api(`/api/owner/empresas/${id}`);
  state.empresaAtual = data.empresa;
  state.recursosEmpresa = data.recursos || [];
  state.usuariosEmpresa = data.usuarios || [];
  preencherFormEmpresa();
  renderEmpresas();
  renderRecursos();
  renderUsuarios();
}

function limparFormEmpresa() {
  state.empresaAtual = null;
  state.recursosEmpresa = [];
  state.usuariosEmpresa = [];
  byId("ownerEmpresaForm").reset();
  byId("ownerEmpresaId").value = "";
  byId("ownerEmpresaPlano").value = "Personalizado";
  byId("ownerEmpresaStatus").value = "ativo";
  renderEmpresas();
  renderRecursos();
  renderUsuarios();
}

function preencherFormEmpresa() {
  const empresa = state.empresaAtual;
  byId("ownerEmpresaId").value = empresa.id_empresa_saas;
  byId("ownerEmpresaCodigo").value = empresa.codigo || "";
  byId("ownerEmpresaNome").value = empresa.nome || "";
  byId("ownerEmpresaCnpj").value = empresa.cnpj || "";
  byId("ownerEmpresaPlano").value = empresa.plano || "Personalizado";
  byId("ownerEmpresaStatus").value = empresa.status || "ativo";
  byId("ownerEmpresaInicio").value = String(empresa.data_inicio || "").slice(0, 10);
  byId("ownerEmpresaVencimento").value = String(empresa.data_vencimento || "").slice(0, 10);
  byId("ownerEmpresaObs").value = empresa.observacao || "";
  byId("ownerEmpresaAvisoPopup").value = empresa.aviso_popup_texto || "";
}

async function salvarEmpresa(event) {
  event.preventDefault();

  const id = byId("ownerEmpresaId").value;
  const payload = {
    codigo: byId("ownerEmpresaCodigo").value,
    nome: byId("ownerEmpresaNome").value,
    cnpj: byId("ownerEmpresaCnpj").value,
    plano: byId("ownerEmpresaPlano").value,
    status: byId("ownerEmpresaStatus").value,
    data_inicio: byId("ownerEmpresaInicio").value,
    data_vencimento: byId("ownerEmpresaVencimento").value,
    observacao: byId("ownerEmpresaObs").value,
    aviso_popup_texto: byId("ownerEmpresaAvisoPopup").value
  };

  try {
    const empresa = await api(id ? `/api/owner/empresas/${id}` : "/api/owner/empresas", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    state.empresaAtual = empresa;
    await carregarEmpresas();
    await carregarEmpresa(empresa.id_empresa_saas);
  } catch (err) {
    Swal.fire({ icon: "error", theme: "dark", title: "Empresa não salva", text: err.message });
  }
}

async function excluirEmpresa() {
  const id = byId("ownerEmpresaId").value;
  if (!id) return;

  const confirmacao = await Swal.fire({
    icon: "warning",
    theme: "dark",
    title: "Excluir empresa?",
    text: "Esta ação remove vínculos de usuários e acessos contratados.",
    showCancelButton: true,
    confirmButtonText: "Excluir",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacao.isConfirmed) return;

  await api(`/api/owner/empresas/${id}`, { method: "DELETE" });
  limparFormEmpresa();
  await carregarEmpresas();
}

function renderRecursos() {
  const selecionados = new Set(state.recursosEmpresa);
  const recursosNovos = ["menu.catalogo_materiais", "menu.materiais", "menu.estoque", "menu.prototipo_atributos", "menu.spda"];
  byId("ownerRecursosLista").innerHTML = state.recursos.map(recurso => `
    <label class="owner-resource ${recursosNovos.includes(recurso.chave) ? "owner-resource-novo" : ""}">
      <input type="checkbox" value="${escapeHtml(recurso.chave)}" ${selecionados.has(recurso.chave) ? "checked" : ""}>
      <span>
        ${escapeHtml(recurso.nome)}
        <small>(${escapeHtml(recurso.tipo)})</small>
        ${recursosNovos.includes(recurso.chave) ? `<em>Novo menu</em>` : ""}
      </span>
    </label>
  `).join("");
}

async function salvarRecursos() {
  const id = byId("ownerEmpresaId").value;
  if (!id) {
    Swal.fire({ icon: "warning", theme: "dark", title: "Salve ou selecione uma empresa primeiro." });
    return;
  }

  const recursos = [...byId("ownerRecursosLista").querySelectorAll("input:checked")].map(input => input.value);
  const result = await api(`/api/owner/empresas/${id}/recursos`, {
    method: "PUT",
    body: JSON.stringify({ recursos })
  });
  state.recursosEmpresa = result.recursos || [];
  renderRecursos();
}

function renderUsuarios() {
  const termo = byId("ownerBuscaUsuario").value.toLowerCase().trim();
  const usuarios = state.usuariosEmpresa.filter(usuario => {
    return `${usuario.id_usuario} ${usuario.nome || ""} ${usuario.mail || ""}`.toLowerCase().includes(termo);
  });

  byId("ownerUsuariosLista").innerHTML = usuarios.length
    ? usuarios.map(usuario => `
      <div class="owner-user">
        <span>${escapeHtml(usuario.id_usuario)} - ${escapeHtml(usuario.nome || "Usuário não encontrado")} ${usuario.mail ? `(${escapeHtml(usuario.mail)})` : ""}</span>
        <button type="button" data-user="${usuario.id_usuario}" class="danger"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join("")
    : `<div class="owner-user">${termo ? "Nenhum usuário encontrado." : "Nenhum usuário vinculado."}</div>`;

  byId("ownerUsuariosLista").querySelectorAll("[data-user]").forEach(button => {
    button.addEventListener("click", () => removerUsuario(button.dataset.user));
  });
}

async function vincularUsuario(event) {
  event.preventDefault();
  const idEmpresa = byId("ownerEmpresaId").value;
  const idUsuario = byId("ownerUsuarioId").value;
  if (!idEmpresa || !idUsuario) return;

  const result = await api(`/api/owner/empresas/${idEmpresa}/usuarios`, {
    method: "POST",
    body: JSON.stringify({ id_usuario: idUsuario })
  });
  state.usuariosEmpresa = result.usuarios || [];
  byId("ownerUsuarioId").value = "";
  renderUsuarios();
}

async function removerUsuario(idUsuario) {
  const idEmpresa = byId("ownerEmpresaId").value;
  const result = await api(`/api/owner/empresas/${idEmpresa}/usuarios/${idUsuario}`, { method: "DELETE" });
  state.usuariosEmpresa = result.usuarios || [];
  renderUsuarios();
}

async function carregarFeedbacks() {
  state.feedbacks = (await api("/api/owner/feedbacks")).feedbacks || [];
  renderFeedbacks();
}

function labelStatusFeedback(status) {
  return {
    aguardando: "Aguardando",
    aprovado: "Aprovado",
    nao_aprovado: "Não aprovado",
    corrigido: "Corrigido"
  }[status] || status || "Aguardando";
}

function labelTipoFeedback(tipo) {
  return {
    erro: "Erro",
    bug: "Problema",
    problema: "Problema",
    dica: "Dica",
    melhoria: "Melhoria",
    sugestao: "Sugestão"
  }[tipo] || tipo || "Relato";
}

function formatarDataFeedback(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderFeedbacks() {
  const lista = byId("ownerFeedbacksLista");
  if (!lista) return;

  const status = byId("ownerFeedbackStatusFiltro")?.value || "";
  const termo = (byId("ownerFeedbackBusca")?.value || "").toLowerCase().trim();
  const feedbacks = state.feedbacks.filter(item => {
    const passaStatus = !status || item.status === status;
    const passaTermo = !termo || `${item.id_feedback} ${item.titulo} ${item.detalhes} ${item.usuario_nome || ""} ${item.empresa_nome || ""}`.toLowerCase().includes(termo);
    return passaStatus && passaTermo;
  });

  lista.innerHTML = feedbacks.length
    ? feedbacks.map(item => `
      <article class="owner-feedback" data-feedback-id="${item.id_feedback}">
        <div class="owner-feedback-top">
          <div>
            <strong>#${item.id_feedback} ${escapeHtml(item.titulo)}</strong>
            <small>${escapeHtml(labelTipoFeedback(item.tipo))} | ${escapeHtml(item.usuario_nome || `Usuário ${item.id_usuario}`)} | ${escapeHtml(item.empresa_nome || "Sem empresa")} | ${escapeHtml(formatarDataFeedback(item.criado_em))}</small>
          </div>
          <span class="owner-feedback-status ${escapeHtml(item.status)}">${escapeHtml(labelStatusFeedback(item.status))}</span>
        </div>
        <p>${escapeHtml(item.detalhes)}</p>
        <div class="owner-feedback-edit">
          <select data-feedback-status>
            <option value="aguardando" ${item.status === "aguardando" ? "selected" : ""}>Aguardando</option>
            <option value="aprovado" ${item.status === "aprovado" ? "selected" : ""}>Aprovado</option>
            <option value="nao_aprovado" ${item.status === "nao_aprovado" ? "selected" : ""}>Não aprovado</option>
            <option value="corrigido" ${item.status === "corrigido" ? "selected" : ""}>Corrigido</option>
          </select>
          <textarea data-feedback-resposta rows="2" placeholder="Resposta para o usuário...">${escapeHtml(item.resposta || "")}</textarea>
          <button type="button" data-feedback-salvar>
            <i class="fa-solid fa-floppy-disk"></i>
            Salvar
          </button>
          <button type="button" class="danger" data-feedback-excluir title="Excluir relato">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="owner-user">Nenhum relato encontrado.</div>`;
}

async function handleFeedbackClick(event) {
  const botaoExcluir = event.target.closest("[data-feedback-excluir]");
  if (botaoExcluir) {
    await excluirFeedback(botaoExcluir);
    return;
  }

  const botao = event.target.closest("[data-feedback-salvar]");
  if (!botao) return;

  const card = botao.closest("[data-feedback-id]");
  const id = card?.dataset.feedbackId;
  if (!id) return;

  botao.disabled = true;
  try {
    const result = await api(`/api/owner/feedbacks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        status: card.querySelector("[data-feedback-status]").value,
        resposta: card.querySelector("[data-feedback-resposta]").value
      })
    });

    state.feedbacks = state.feedbacks.map(item => Number(item.id_feedback) === Number(id)
      ? { ...item, ...result.feedback }
      : item
    );
    renderFeedbacks();
  } catch (err) {
    Swal.fire({ icon: "error", theme: "dark", title: "Relato não atualizado", text: err.message });
  } finally {
    botao.disabled = false;
  }
}

async function excluirFeedback(botao) {
  const card = botao.closest("[data-feedback-id]");
  const id = card?.dataset.feedbackId;
  if (!id) return;

  const titulo = card.querySelector(".owner-feedback-top strong")?.textContent || `Relato #${id}`;
  const confirmacao = await Swal.fire({
    icon: "warning",
    theme: "dark",
    title: "Excluir relato?",
    text: `${titulo} será removido do painel do dono e do histórico do usuário.`,
    showCancelButton: true,
    confirmButtonText: "Excluir",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacao.isConfirmed) return;

  botao.disabled = true;
  try {
    await api(`/api/owner/feedbacks/${id}`, { method: "DELETE" });
    state.feedbacks = state.feedbacks.filter(item => Number(item.id_feedback) !== Number(id));
    renderFeedbacks();
  } catch (err) {
    Swal.fire({ icon: "error", theme: "dark", title: "Relato não excluído", text: err.message });
  } finally {
    botao.disabled = false;
  }
}

init();
