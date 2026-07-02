const state = {
  empresas: [],
  recursos: [],
  empresaAtual: null,
  recursosEmpresa: [],
  usuariosEmpresa: []
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
    await Promise.all([carregarRecursos(), carregarEmpresas()]);
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
  state.recursos = await api("/api/owner/recursos");
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
    observacao: byId("ownerEmpresaObs").value
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
  byId("ownerRecursosLista").innerHTML = state.recursos.map(recurso => `
    <label class="owner-resource">
      <input type="checkbox" value="${escapeHtml(recurso.chave)}" ${selecionados.has(recurso.chave) ? "checked" : ""}>
      <span>${escapeHtml(recurso.nome)} <small>(${escapeHtml(recurso.tipo)})</small></span>
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

init();
