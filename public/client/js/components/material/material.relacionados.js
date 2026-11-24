import { materialState as state } from "../../state/material.state.js";
import { parseAtributos } from "../../utils/material/material.utils.js";
import { escapeHtml } from "../../utils/material.utils.js";
import { aplicarImagemPadraoNasMiniaturas, miniaturaMaterial } from "../../utils/dom/material-miniatura.js";

let relacionados = [];
let sessao = 0;
const buscarElemento = id => document.getElementById(id);
const normalizar = valor => String(valor ?? "").trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function referencia(item) {
  return {
    nome: item.nome, codigo: item.codigo ?? null, fabricante: item.fabricante ?? null,
    unidade: item.unidade || "un", atributos: parseAtributos(item.atributos)
  };
}

function assinatura(item) {
  return JSON.stringify([
    normalizar(item.nome), normalizar(item.codigo), normalizar(item.fabricante), item.unidade || "un",
    Object.entries(item.atributos || {}).map(([chave, valor]) => [normalizar(chave), String(valor).trim()])
      .sort(([a], [b]) => a.localeCompare(b))
  ]);
}

function dadosCatalogo(id) {
  return state.listaVariacoes.find(item => Number(item.id) === id);
}

function descrever(item) {
  const atributos = Object.values(parseAtributos(item?.atributos)).join(", ");
  return [item?.fabricante, item?.codigo, item?.unidade, atributos].filter(Boolean).join(" · ");
}

function renderizar() {
  const lista = buscarElemento("materialRelacionadosSelecionados");
  const status = buscarElemento("materialRelacionadosStatus");
  if (!lista || !status) return;
  const busca = buscarElemento("materialBuscaRelacionado");
  busca.disabled = relacionados === null;
  lista.innerHTML = (relacionados || []).map((link, indice) => {
    const item = dadosCatalogo(link.id) || link.referencia;
    const nome = item?.nome || "Material " + link.id;
    const detalhes = [link.id ? "ID " + link.id : "Sem correspondência no catálogo", descrever(item)].filter(Boolean).join(" · ");
    return `<div class="material-relacionado-item" data-relacionado-indice="${indice}">
      ${miniaturaMaterial(item)}
      <div><strong>${escapeHtml(nome)}</strong><small>${escapeHtml(detalhes)}</small></div>
      <label>Quantidade <input type="number" min="0.000001" max="9999999999.999999" step="0.000001"
        placeholder="Opcional" value="${escapeHtml(link.quantidade ?? "")}"></label>
      <button type="button" class="material-relacionado-remover" aria-label="Remover ${escapeHtml(nome)}">×</button>
    </div>`;
  }).join("");
  aplicarImagemPadraoNasMiniaturas(lista);
  status.textContent = relacionados === null ? "Carregando vínculos…" : "";
  renderizarSugestoes();
}

function renderizarSugestoes() {
  const lista = buscarElemento("materialSugestoesRelacionados");
  const termo = normalizar(buscarElemento("materialBuscaRelacionado")?.value);
  const palavras = termo ? termo.split(/\s+/) : [];
  if (!lista) return;
  const ignorar = new Set((relacionados || []).map(link => link.id));
  ignorar.add(Number(buscarElemento("idMaterial")?.value));
  const resultados = termo ? state.listaVariacoes.filter(item => {
    if (ignorar.has(Number(item.id))) return false;
    const indice = normalizar([item.id, item.nome, item.codigo, item.fabricante, item.atributos].join(" "));
    return palavras.every(palavra => indice.includes(palavra));
  }).slice(0, 8) : [];
  lista.innerHTML = resultados.map(item => `<button type="button" data-relacionar-id="${Number(item.id)}">
    ${miniaturaMaterial(item)}
    <span><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(descrever(item))}</small></span><span aria-hidden="true">+</span>
  </button>`).join("");
  aplicarImagemPadraoNasMiniaturas(lista);
  if (termo && !resultados.length) lista.textContent = "Nenhum material encontrado.";
}

export function limparRelacionadosMaterial() {
  sessao++;
  relacionados = [];
  const busca = buscarElemento("materialBuscaRelacionado");
  if (busca) busca.value = "";
  renderizar();
}

export async function carregarRelacionadosMaterial(id) {
  limparRelacionadosMaterial();
  if (!id) return;
  const atual = sessao;
  relacionados = null;
  renderizar();
  try {
    const links = await $.get("/api/materiais/variacao/" + encodeURIComponent(id) + "/relacionados");
    if (atual !== sessao) return;
    relacionados = links;
    renderizar();
  } catch {
    if (atual !== sessao) return;
    buscarElemento("materialRelacionadosStatus").textContent = "Não foi possível carregar os vínculos. Reabra o cadastro para tentar novamente.";
  }
}

export function obterRelacionadosMaterial(exportar = false) {
  if (relacionados === null) {
    if (exportar) throw new Error("Carregue os materiais relacionados antes de exportar.");
    return undefined;
  }
  const linhas = buscarElemento("materialRelacionadosSelecionados").querySelectorAll("input");
  const ids = new Set();
  return relacionados.map((link, indice) => {
    const campo = linhas[indice];
    if (!campo.validity.valid) {
      campo.focus();
      throw new Error("Informe uma quantidade válida para o material relacionado.");
    }
    if (!link.id && !exportar) throw new Error("Substitua ou remova os materiais sem correspondência antes de salvar.");
    if (!exportar && ids.has(link.id)) throw new Error("Remova os materiais relacionados repetidos antes de salvar.");
    ids.add(link.id);
    const dados = { id: exportar ? link.id ?? link.idOriginal : link.id, quantidade: campo.value === "" ? null : campo.valueAsNumber };
    const item = dadosCatalogo(link.id);
    if (exportar && !item && !link.referencia) throw new Error("Aguarde o catálogo carregar para exportar os vínculos.");
    return exportar ? { ...dados, referencia: item ? referencia(item) : link.referencia } : dados;
  });
}

export function importarRelacionadosMaterial(links) {
  relacionados = links.map(link => {
    const ref = link.referencia;
    const candidatos = ref ? state.listaVariacoes.filter(item => assinatura(referencia(item)) === assinatura(ref)) : [];
    const encontrado = candidatos.find(item => Number(item.id) === link.id) || (candidatos.length === 1 ? candidatos[0] : null);
    return { id: encontrado ? Number(encontrado.id) : null, idOriginal: link.id, quantidade: link.quantidade ?? null, referencia: ref };
  });
  renderizar();
}

export function initMaterialRelacionados() {
  const busca = buscarElemento("materialBuscaRelacionado");
  if (!busca) return;
  busca.oninput = renderizarSugestoes;
  buscarElemento("materialSugestoesRelacionados").onclick = event => {
    const botao = event.target.closest("[data-relacionar-id]");
    if (!botao || !relacionados) return;
    relacionados.push({ id: Number(botao.dataset.relacionarId), quantidade: null });
    busca.value = "";
    renderizar();
    busca.focus();
  };
  const lista = buscarElemento("materialRelacionadosSelecionados");
  lista.oninput = event => {
    const campo = event.target;
    const linha = campo.closest("[data-relacionado-indice]");
    if (linha) relacionados[Number(linha.dataset.relacionadoIndice)].quantidade = campo.value === "" ? null : campo.valueAsNumber;
  };
  lista.onclick = event => {
    const botao = event.target.closest(".material-relacionado-remover");
    if (!botao) return;
    relacionados.splice(Number(botao.closest("[data-relacionado-indice]").dataset.relacionadoIndice), 1);
    renderizar();
    busca.focus();
  };
}
