import { renderColaboradoresDisponiveis, renderOSComColaboradores, renderColoboradorEmOS, atualizarStatusDia } from "../../utils/dom/programacao-render.js";
import { formatDate } from "../../utils/formatters/date-format.js";

import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";

export async function carregarColaboradoresDisp(painel, renderizarColabEmOS) {
  try {
    const dia = painel.getAttribute("data-dia");
    if (!dia) throw new Error("Painel sem data-dia");

    const url = `/api/colaboradores/disponiveis?dataDia=${dia}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar colaboradores disponíveis");

    const colaboradores = await res.json();

    // 👇 pega o container dentro do painel atual
    const container = painel.querySelector(".p_colabsDisp");
    renderColaboradoresDisponiveis(colaboradores, container);
    if (renderizarColabEmOS) { renderColoboradorEmOS(); };
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro em carregarColaboradoresDisp:", err);
    return [];
  }
}


export async function carregarOSComColaboradores(painel) {
  try {
    const dia = painel.closest(".painelDia")?.getAttribute("data-dia");
    if (!dia) throw new Error("Painel sem data-dia");

    const url = `/api/colaboradores/emOS?dataDia=${dia}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

    const OrdemServico = await res.json();

    // 👇 container dentro do painel
    const container = painel.querySelector(".painel_dasOS");
    renderOSComColaboradores(OrdemServico, container);
    renderColoboradorEmOS();
    atualizarStatusDia(painel.closest(".painelDia"));
    atualizarPainel($(painel));
    return OrdemServico;
  } catch (err) {
    console.error("❌ Erro em carregarOSComColaboradores:", err);
    return [];
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


