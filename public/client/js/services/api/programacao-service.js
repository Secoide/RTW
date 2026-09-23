import { renderColaboradoresDisponiveis, renderOSComColaboradores, renderColoboradorEmOS, atualizarStatusDia, atualizarIconeAnotacoes } from "../../utils/dom/programacao-render.js";

import { atualizarPainel, resetarPaginacaoOSProgramacao } from "../../utils/dom/atualizar-painel.js";
import { tentarMostrarColaboradorFantasma } from "../ui/EasterEgg/colaborador-fantasma.js";

const LIMITE_OS_PROGRAMACAO = 10;

export async function carregarColaboradoresDisp(painel, renderizarColabEmOS) {
  try {
    const dia = painel.getAttribute("data-dia");
    if (!dia) throw new Error("Painel sem data-dia");

    const url = `/api/colaboradores/disponiveis?dataDia=${dia}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar colaboradores disponíveis");

    const colaboradores = await res.json();
    if (painel.getAttribute("data-dia") !== dia) return [];

    // 👇 pega o container dentro do painel atual
    const container = painel.querySelector(".p_colabsDisp");
    renderColaboradoresDisponiveis(colaboradores, container);
    tentarMostrarColaboradorFantasma(container);
    if (renderizarColabEmOS) { renderColoboradorEmOS(); };
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro em carregarColaboradoresDisp:", err);
    return [];
  }
}


function montarUrlOSProgramacao(dia, { limit = LIMITE_OS_PROGRAMACAO, offset = 0, busca = "" } = {}) {
  const params = new URLSearchParams({
    dataDia: dia,
    limit: String(limit),
    offset: String(offset)
  });

  if (busca) params.set("busca", busca);
  return `/api/colaboradores/emOS?${params.toString()}`;
}

function normalizarRespostaOS(resposta) {
  if (Array.isArray(resposta)) {
    return {
      dados: resposta,
      total: resposta.length,
      quantidade: new Set(resposta.map(item => item.id_OSs).filter(Boolean)).size,
      offset: 0,
      limit: resposta.length || LIMITE_OS_PROGRAMACAO,
      busca: ""
    };
  }

  const dados = Array.isArray(resposta?.dados) ? resposta.dados : [];
  return {
    dados,
    total: Number(resposta?.total || 0),
    quantidade: Number(resposta?.quantidade || new Set(dados.map(item => item.id_OSs).filter(Boolean)).size),
    offset: Number(resposta?.offset || 0),
    limit: Number(resposta?.limit || LIMITE_OS_PROGRAMACAO),
    busca: resposta?.busca || ""
  };
}

export async function carregarOSComColaboradores(painel, opcoes = {}) {
  try {
    const dia = painel.closest(".painelDia")?.getAttribute("data-dia");
    if (!dia) throw new Error("Painel sem data-dia");

    const painelDia = painel.closest(".painelDia");
    const append = opcoes.append === true;
    const busca = String(opcoes.busca ?? $(painelDia).data("buscaOsServidor") ?? "").trim();
    const offset = append
      ? Number($(painelDia).data("osCarregadasServidor") || 0)
      : Number(opcoes.offset || 0);

    const url = montarUrlOSProgramacao(dia, {
      limit: Number(opcoes.limit || LIMITE_OS_PROGRAMACAO),
      offset,
      busca
    });
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

    const resposta = normalizarRespostaOS(await res.json());
    if (painelDia?.getAttribute("data-dia") !== dia) return [];

    // 👇 container dentro do painel
    const container = painel.querySelector(".painel_dasOS");
    renderOSComColaboradores(resposta.dados, container, { append });
    renderColoboradorEmOS(painelDia);

    const totalCarregado = $(container)
      .find(".painel_OS .p_infoOS[data-os]")
      .map((_, el) => $(el).data("os"))
      .get()
      .filter((id, index, lista) => lista.indexOf(id) === index)
      .length;

    $(painelDia)
      .data("paginacaoServidor", true)
      .data("totalOsServidor", resposta.total)
      .data("osCarregadasServidor", totalCarregado)
      .data("buscaOsServidor", busca);

    if (!append) resetarPaginacaoOSProgramacao(painelDia);

    await atualizarStatusDia(painelDia);
    atualizarIconeAnotacoes(painelDia);
    atualizarPainel($(painel));
    return resposta;
  } catch (err) {
    console.error("❌ Erro em carregarOSComColaboradores:", err);
    return { dados: [], total: 0, quantidade: 0 };
  }
}


export async function transferirColaboradores(colabs, novaData) {
  return postJson("/transferir-colaboradores", { colabs, novaData });
}


// Helpers de fetch
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar: ${url}`);
  return res.json();
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro ao enviar: ${url}`);
  return res.json();
}


