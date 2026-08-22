const STATUS_LABEL = {
  aguardando: "Aguardando",
  aprovado: "Aprovado",
  nao_aprovado: "Não aprovado",
  corrigido: "Corrigido"
};

const TIPO_LABEL = {
  erro: "Erro",
  bug: "Problema",
  problema: "Problema",
  dica: "Dica",
  melhoria: "Melhoria",
  sugestao: "Sugestão"
};

let relatosInicializado = false;
let relatosCache = [];
let relatoEditandoId = null;

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarData(valor) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function apiRelatos(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.sucesso === false) {
    throw new Error(data.mensagem || "Não foi possível processar o relato.");
  }
  return data;
}

async function carregarRelatos() {
  const lista = el("relatosLista");
  const resumo = el("relatosResumo");
  if (!lista) return;

  lista.innerHTML = `<div class="relatos-empty">Carregando relatos...</div>`;

  try {
    const data = await apiRelatos("/api/feedback");
    relatosCache = data.feedbacks || [];
    renderRelatos(relatosCache);
    if (resumo) resumo.textContent = `${relatosCache.length} envio(s)`;
  } catch (err) {
    lista.innerHTML = `<div class="relatos-empty">${escapeHtml(err.message)}</div>`;
    if (resumo) resumo.textContent = "Erro ao carregar";
  }
}

function renderRelatos(relatos) {
  const lista = el("relatosLista");
  if (!lista) return;

  if (!relatos.length) {
    lista.innerHTML = `<div class="relatos-empty">Nenhum relato enviado ainda.</div>`;
    return;
  }

  lista.innerHTML = relatos.map(relato => `
    <article class="relato-item" data-relato-id="${relato.id_feedback}">
      <div class="relato-item-top">
        <div>
          <h3>${escapeHtml(relato.titulo)}</h3>
          <div class="relato-meta">
            <span>${escapeHtml(TIPO_LABEL[relato.tipo] || relato.tipo || "Relato")}</span>
            <span>${escapeHtml(formatarData(relato.criado_em))}</span>
          </div>
        </div>
        <span class="relato-status ${escapeHtml(relato.status)}">${escapeHtml(STATUS_LABEL[relato.status] || relato.status)}</span>
      </div>
      <p>${escapeHtml(relato.detalhes)}</p>
      ${relato.status === "aguardando" ? `
        <div class="relato-acoes">
          <button type="button" class="relatos-btn secundario" data-relato-editar="${relato.id_feedback}">
            <i class="fa-solid fa-pen"></i>
            Editar
          </button>
          <button type="button" class="relatos-btn perigo" data-relato-apagar="${relato.id_feedback}">
            <i class="fa-solid fa-trash"></i>
            Apagar
          </button>
        </div>
      ` : ""}
      ${relato.resposta ? `
        <div class="relato-resposta">
          <strong>Resposta:</strong>
          <p>${escapeHtml(relato.resposta)}</p>
        </div>
      ` : ""}
    </article>
  `).join("");
}

async function enviarRelato(event) {
  event.preventDefault();

  const form = event.target?.closest?.("#formRelatoSistema") || el("formRelatoSistema");
  const botao = el("btnEnviarRelato");
  const payload = {
    tipo: el("relatoTipo")?.value || "problema",
    titulo: el("relatoTitulo")?.value || "",
    detalhes: el("relatoDetalhes")?.value || ""
  };

  botao.disabled = true;

  try {
    const estavaEditando = !!relatoEditandoId;
    await apiRelatos(estavaEditando ? `/api/feedback/${relatoEditandoId}` : "/api/feedback", {
      method: estavaEditando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    limparModoEdicaoRelato();
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: estavaEditando ? "Relato atualizado" : "Relato enviado",
        text: estavaEditando ? "Sua alteração foi salva." : "Seu envio ficou registrado para análise.",
        timer: 2200,
        showConfirmButton: false
      });
    }
    await carregarRelatos();
  } catch (err) {
    if (typeof Swal !== "undefined") {
      Swal.fire({ icon: "error", title: "Não enviado", text: err.message });
    } else {
      alert(err.message);
    }
  } finally {
    botao.disabled = false;
  }
}

function limparModoEdicaoRelato() {
  const form = el("formRelatoSistema");
  relatoEditandoId = null;

  if (typeof form?.reset === "function") {
    form.reset();
  } else {
    el("relatoTipo").value = "problema";
    el("relatoTitulo").value = "";
    el("relatoDetalhes").value = "";
  }

  const botao = el("btnEnviarRelato");
  const cancelar = el("btnCancelarEdicaoRelato");
  if (botao) {
    botao.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar relato`;
  }
  if (cancelar) cancelar.hidden = true;
}

function iniciarEdicaoRelato(idFeedback) {
  const relato = relatosCache.find(item => Number(item.id_feedback) === Number(idFeedback));
  if (!relato || relato.status !== "aguardando") return;

  relatoEditandoId = relato.id_feedback;
  el("relatoTipo").value = relato.tipo || "problema";
  el("relatoTitulo").value = relato.titulo || "";
  el("relatoDetalhes").value = relato.detalhes || "";

  const botao = el("btnEnviarRelato");
  const cancelar = el("btnCancelarEdicaoRelato");
  if (botao) {
    botao.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar alteração`;
  }
  if (cancelar) cancelar.hidden = false;

  el("formRelatoSistema")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function apagarRelato(idFeedback) {
  const relato = relatosCache.find(item => Number(item.id_feedback) === Number(idFeedback));
  if (!relato || relato.status !== "aguardando") return;

  const confirmar = typeof Swal !== "undefined"
    ? await Swal.fire({
        icon: "warning",
        title: "Apagar relato?",
        text: "Só é possível apagar enquanto ele ainda está aguardando análise.",
        showCancelButton: true,
        confirmButtonText: "Apagar",
        cancelButtonText: "Cancelar"
      })
    : { isConfirmed: confirm("Apagar este relato?") };

  if (!confirmar.isConfirmed) return;

  try {
    await apiRelatos(`/api/feedback/${idFeedback}`, { method: "DELETE" });
    if (Number(relatoEditandoId) === Number(idFeedback)) {
      limparModoEdicaoRelato();
    }
    await carregarRelatos();
  } catch (err) {
    if (typeof Swal !== "undefined") {
      Swal.fire({ icon: "error", title: "Não apagado", text: err.message });
    } else {
      alert(err.message);
    }
  }
}

export function initRelatos() {
  const form = el("formRelatoSistema");
  if (!form) return;

  if (!relatosInicializado) {
    relatosInicializado = true;
    document.addEventListener("submit", event => {
      if (event.target?.id === "formRelatoSistema") {
        enviarRelato(event);
      }
    });
    document.addEventListener("click", event => {
      if (event.target?.closest("#btnAtualizarRelatos")) {
        carregarRelatos();
        return;
      }

      const editar = event.target?.closest("[data-relato-editar]");
      if (editar) {
        iniciarEdicaoRelato(editar.dataset.relatoEditar);
        return;
      }

      const apagar = event.target?.closest("[data-relato-apagar]");
      if (apagar) {
        apagarRelato(apagar.dataset.relatoApagar);
        return;
      }

      if (event.target?.closest("#btnCancelarEdicaoRelato")) {
        limparModoEdicaoRelato();
      }
    });
  }

  carregarRelatos();
}
