const ESTAGIOS = [
  { chave: "orcamento", titulo: "Orcamento", icone: "fa-file-invoice-dollar" },
  { chave: "engenharia", titulo: "Engenharia", icone: "fa-pen-ruler" },
  { chave: "estoque", titulo: "Estoque", icone: "fa-boxes-stacked" },
  { chave: "compras", titulo: "Compras", icone: "fa-cart-shopping" },
  { chave: "finalizado", titulo: "Finalizado", icone: "fa-circle-check" }
];

export function renderKanbanMateriais(listas, idOS) {
  const $kanban = $("#materialKanbanView");

  if (!idOS) {
    $kanban.html(`
      <div class="material-kanban-empty">
        Selecione uma OS para visualizar o fluxo das listas de materiais.
      </div>
    `);
    return;
  }

  const listaNormalizada = (listas || []).map(normalizarLista);

  const colunas = ESTAGIOS.map(estagio => {
    const listasEstagio = listaNormalizada.filter(lista => lista.status === estagio.chave);
    const cards = listasEstagio.length
      ? listasEstagio.map(lista => renderCardLista(lista, idOS)).join("")
      : `<div class="material-kanban-placeholder">Aguardando lista</div>`;

    return `
      <div class="material-kanban-coluna" data-estagio="${estagio.chave}">
        <div class="material-kanban-coluna-head">
          <span><i class="fa-solid ${estagio.icone}"></i> ${estagio.titulo}</span>
          <b>${listasEstagio.length}</b>
        </div>
        <div class="material-kanban-coluna-body">
          ${cards}
        </div>
      </div>
    `;
  }).join("");

  $kanban.html(`
    <div class="material-kanban-header">
      <div>
        <strong>Fluxo de materiais da OS ${escapeHtml(idOS)}</strong>
        <span>${listaNormalizada.length} lista(s) encontrada(s)</span>
      </div>
      <div class="material-kanban-actions">
        <small>Clique no bloco para abrir a lista completa.</small>
        <button id="btnNovaListaMaterial" class="bt_padrao bt_cad">
          <i class="fa-solid fa-plus"></i> Nova lista
        </button>
      </div>
    </div>
    <div class="material-kanban-board">
      ${colunas}
    </div>
  `);
}

export function aplicarModoMaterial(modo) {
  const isDetalhe = modo === "detalhe";

  $("#listaMaterial")
    .toggleClass("material-detalhe-mode", isDetalhe)
    .toggleClass("material-kanban-mode", !isDetalhe);

  $("#materialKanbanView").prop("hidden", isDetalhe);
  $("#materialDetalheView").prop("hidden", !isDetalhe);
  $(".material-detalhe-action").toggle(isDetalhe);
}

export function calcularResumoMateriais(lista) {
  return calcularResumo(lista || []);
}

export function getTituloEstagio(status) {
  return ESTAGIOS.find(estagio => estagio.chave === status)?.titulo || "Orcamento";
}

function renderCardLista(lista, idOS) {
  const progresso = Math.max(lista.percentualCompra, lista.percentualSeparacao);
  const progressoLabel = lista.percentualCompra >= lista.percentualSeparacao ? "Comprando" : "Separando";
  const statusLabel = getTituloEstagio(lista.status);
  const podeAvancar = lista.status !== "finalizado";
  const podeVoltar = lista.status !== "orcamento";
  const podeAlterar = usuarioPodeAlterarEstagio(lista.status);
  const prazoClass = getPrazoClass(lista);
  const prazoLabel = lista.sem_prazo ? "Sem prazo" : formatarDataCurta(lista.prazo);

  return `
    <article class="material-lista-card ${prazoClass}" data-os="${escapeHtml(idOS)}" data-lista="${lista.id}" data-estagio="${lista.status}">
      <button class="material-lista-open" title="Abrir lista completa">
        <div class="material-lista-card-layout">
          <div class="material-lista-card-top">
            <div class="material-lista-card-nome">
              <strong>${escapeHtml(lista.titulo)}</strong>
              <small>${escapeHtml(lista.descricao || "Lista de materiais")}</small>
            </div>
            <em class="material-lista-card-status">${escapeHtml(statusLabel)}</em>
          </div>

          ${lista.observacao_rapida ? `
            <div class="material-lista-card-nota">
              <i class="fa-solid fa-note-sticky"></i>
              <span>${escapeHtml(lista.observacao_rapida)}</span>
            </div>
          ` : ""}

          <div class="material-lista-card-tags">
            <span class="prioridade-${escapeHtml(lista.prioridade)}">
              <i class="fa-solid fa-flag"></i> ${escapeHtml(formatarPrioridade(lista.prioridade))}
            </span>
            <span>
              <i class="fa-solid fa-user"></i> ${escapeHtml(lista.responsavel_nome || "Sem responsavel")}
            </span>
            <span>
              <i class="fa-solid fa-calendar-days"></i> ${escapeHtml(prazoLabel)}
            </span>
          </div>

          <div class="material-lista-card-contagem">
            <span><b>${lista.itens}</b> itens</span>
            <span><b>${lista.quantidade}</b> qtd.</span>
            <span><b>${lista.comprada}</b> comprado</span>
            <span><b>${lista.separada}</b> separado</span>
            <span><b>${lista.faltante}</b> faltante</span>
          </div>

          <div class="material-lista-card-progresso-head">
            <span>${progressoLabel}</span>
            <small>${lista.dias_no_estagio} dia(s) no estágio</small>
            <b>${progresso.toFixed(0)}%</b>
          </div>

          <div class="material-lista-card-progresso">
            <span style="width:${progresso.toFixed(0)}%"></span>
          </div>
        </div>
      </button>

      <div class="material-lista-card-actions">
        ${podeVoltar ? `
          <button class="material-lista-voltar" data-id="${lista.id}" title="Voltar para o estagio anterior" ${podeAlterar ? "" : "disabled"}>
            <i class="fa-solid fa-backward-step"></i>
          </button>
        ` : ""}
        ${podeAvancar ? `
          <button class="material-lista-avancar" data-id="${lista.id}" title="Confirmar e enviar para o proximo estagio" ${podeAlterar ? "" : "disabled"}>
            <i class="fa-solid fa-forward-step"></i>
          </button>
        ` : ""}
        <button class="material-lista-historico" data-id="${lista.id}" title="Ver historico">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </button>
        ${lista.status === "finalizado" ? `
          <button class="material-lista-conferir" data-id="${lista.id}" title="Conferir materiais no estoque">
            <i class="fa-solid fa-clipboard-check"></i>
          </button>
        ` : ""}
        <button class="material-lista-duplicar" data-id="${lista.id}" title="Duplicar lista">
          <i class="fa-solid fa-copy"></i>
        </button>
        <button class="material-lista-editar" data-id="${lista.id}" title="Editar lista">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="material-lista-excluir" data-id="${lista.id}" title="Excluir lista">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </article>
  `;
}

function normalizarLista(lista) {
  const quantidade = Number(lista.quantidade || 0);
  const comprada = Number(lista.comprada || 0);
  const separada = Number(lista.separada || 0);
  const itens = Number(lista.itens || 0);
  const itensComprados = Number(lista.itens_comprados || 0);
  const itensSeparados = Number(lista.itens_separados || 0);
  const faltante = Math.max(0, quantidade - comprada - separada);

  return {
    ...lista,
    id: Number(lista.id),
    titulo: lista.titulo || `Lista #${lista.id}`,
    status: lista.status || "orcamento",
    observacao_rapida: lista.observacao_rapida || "",
    responsavel_id: lista.responsavel_id || null,
    responsavel_nome: lista.responsavel_nome || "",
    prioridade: lista.prioridade || "normal",
    prazo: lista.prazo || null,
    sem_prazo: Number(lista.sem_prazo || 0) === 1,
    criado_em: lista.criado_em || null,
    atualizado_em: lista.atualizado_em || null,
    status_atualizado_em: lista.status_atualizado_em || null,
    dias_no_estagio: Number(lista.dias_no_estagio || 0),
    itens,
    itens_comprados: itensComprados,
    itens_separados: itensSeparados,
    quantidade,
    comprada,
    separada,
    faltante,
    percentualCompra: itens ? (itensComprados / itens) * 100 : 0,
    percentualSeparacao: itens ? (itensSeparados / itens) * 100 : 0
  };
}

function getPrazoClass(lista) {
  if (lista.sem_prazo || !lista.prazo) return "is-sem-prazo";

  const hoje = normalizarData(new Date());
  const prazo = normalizarData(new Date(lista.prazo));
  if (!prazo) return "is-sem-prazo";

  const inicio = normalizarData(new Date(lista.status_atualizado_em || lista.criado_em || lista.atualizado_em || hoje));
  const diasTotais = Math.max(1, diferencaDias(inicio || hoje, prazo));
  const diasRestantes = diferencaDias(hoje, prazo);
  const diasUsados = Math.max(0, diasTotais - diasRestantes);
  const percentualUsado = Math.min(100, Math.max(0, (diasUsados / diasTotais) * 100));

  if (diasRestantes < 0) return "is-atrasada";
  if (percentualUsado >= 85) return "is-prazo-critico";
  if (percentualUsado >= 65) return "is-atencao";
  if (percentualUsado >= 35) return "is-prazo-andamento";
  return "is-prazo-ok";
}

function normalizarData(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return null;
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function diferencaDias(inicio, fim) {
  const msDia = 24 * 60 * 60 * 1000;
  return Math.ceil((fim.getTime() - inicio.getTime()) / msDia);
}

function formatarPrioridade(valor) {
  const map = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente"
  };

  return map[valor] || "Normal";
}

function formatarDataCurta(valor) {
  if (!valor) return "Sem prazo";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem prazo";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function usuarioPodeAlterarEstagio(status) {
  const nivel = Number(sessionStorage.getItem("nivel_acesso") || localStorage.getItem("nivel_acesso") || 0);
  if ([6, 7, 99].includes(nivel)) return true;

  const nivelPorEstagio = {
    orcamento: 3,
    engenharia: 5,
    estoque: 2,
    compras: 3,
    finalizado: 99
  };

  return nivel === nivelPorEstagio[status];
}

function calcularResumo(lista) {
  const resumo = {
    itens: lista.length,
    quantidade: 0,
    comprada: 0,
    separada: 0,
    faltante: 0,
    percentualCompra: 0,
    percentualSeparacao: 0,
    status: "Sem materiais"
  };

  lista.forEach(item => {
    const quantidade = Number(item.quantidade || 0);
    const comprada = Number(item.quantidade_comprada || 0);
    const separada = Number(item.quantidade_separada || 0);
    const saldoEstoque = Math.max(0, quantidade - comprada);

    resumo.quantidade += quantidade;
    resumo.comprada += comprada;
    resumo.separada += separada;

    if (quantidade > 0 && comprada >= quantidade) {
      resumo.percentualCompra += 1;
    }

    if (quantidade > 0 && (comprada >= quantidade || separada >= saldoEstoque)) {
      resumo.percentualSeparacao += 1;
    }
  });

  resumo.faltante = Math.max(0, resumo.quantidade - resumo.comprada - resumo.separada);
  resumo.percentualCompra = resumo.itens ? (resumo.percentualCompra / resumo.itens) * 100 : 0;
  resumo.percentualSeparacao = resumo.itens ? (resumo.percentualSeparacao / resumo.itens) * 100 : 0;

  if (resumo.quantidade > 0 && resumo.faltante === 0) resumo.status = "Finalizado";
  else if (resumo.comprada > 0) resumo.status = "Em compras";
  else if (resumo.separada > 0) resumo.status = "Em estoque";
  else if (resumo.itens > 0) resumo.status = "Em andamento";

  return resumo;
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
