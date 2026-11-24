import { carregarVariacoes } from "../../services/api/material.api.js";
import { resetModalMaterial, atualizarModoModalMaterial } from "../forms/material.modal.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { normalizarAtributo } from "../../utils/material/material.utils.js";
import { materialState as state } from "../../state/material.state.js";
import { obterRelacionadosMaterial, importarRelacionadosMaterial } from "./material.relacionados.js";

const tipoCatalogo = "application/vnd.connectpear.catalogo-materiais+json";
const endpoint = "/api/materiais/catalogo";
const formatoIndividual = "connectpear-material";
const camposIndividuais = {
  nome: "#nomeMaterial",
  categoria: "#categoriaMaterial",
  codigo: "#codigo",
  fabricante: "#fabricante",
  unidade: "#unidadeMaterial"
};

async function requisitar(acao, options) {
  const fetchApi = window.apiFetch || window.fetch.bind(window);
  const response = await fetchApi(endpoint + "/" + acao, options);
  if (!response.ok) {
    const resposta = await response.json().catch(() => ({}));
    throw new Error(resposta.erro || "Não foi possível " + acao + " os materiais.");
  }
  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error("O servidor retornou uma resposta inesperada.");
  }
  return response;
}

function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nomeArquivoMaterial(material) {
  const trecho = (valor, limite) => valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-").slice(0, limite).replace(/^[.-]+|[.-]+$/g, "");
  const partes = [
    trecho(material.nome, 52),
    trecho(material.fabricante, 30),
    trecho(material.codigo, 34)
  ].filter(Boolean);
  let nome = ["material", ...partes].join("--");
  for (const { atributo, valor } of material.atributos) {
    const conteudo = trecho(valor, 28);
    if (!conteudo) continue;
    const rotulo = trecho(atributo, 22);
    const detalhe = rotulo ? rotulo + "-" + conteudo : conteudo;
    if (nome.length + detalhe.length + 2 <= 175) nome += "--" + detalhe;
  }
  return nome + ".json";
}

function lerUrlImagem(valor) {
  if (typeof valor !== "string" || !valor) return null;
  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function initMaterialTransferencia() {
  const modal = document.getElementById("modalMaterial");
  if (!modal) return;
  const exportar = modal.querySelector("#btnExportarMaterial");
  const importar = modal.querySelector("#btnImportarMaterial");
  const entrada = modal.querySelector("#arquivoImportarMaterial");
  const aviso = modal.querySelector("#materialAvisoCadastro");
  const foto = modal.querySelector("#imagemmaterial");
  const imagemImportada = modal.querySelector("#imagemMaterialImportada");

  exportar.onclick = () => {
    const material = Object.fromEntries(Object.entries(camposIndividuais).map(([campo, seletor]) =>
      [campo, modal.querySelector(seletor).value]
    ));
    if (!material.nome.trim()) {
      aviso.textContent = "Informe o nome do material para exportar.";
      modal.querySelector("#nomeMaterial").focus();
      return;
    }
    material.usoGenerico = modal.querySelector("#materialUsoGenerico").checked;
    try {
      material.relacionados = obterRelacionadosMaterial(true);
    } catch (erro) {
      aviso.textContent = erro.message;
      return;
    }
    const idFoto = modal.querySelector("#imagemMaterialOrigemId").value || modal.querySelector("#idMaterial").value;
    const fotoCatalogo = state.listaVariacoes.find(item => String(item.id) === idFoto)?.imagem;
    const imagem = lerUrlImagem(foto.getAttribute("src")) || lerUrlImagem(imagemImportada.value) || lerUrlImagem(fotoCatalogo);
    if (imagem) {
      for (const parametro of ["v", "t"]) {
        if (/^\d+$/.test(imagem.searchParams.get(parametro))) imagem.searchParams.delete(parametro);
      }
    }
    material.imagem = imagem?.href ?? null;
    material.atributos = [...modal.querySelectorAll("#valoresAtributos .input-attr")].map(campo => ({
      atributo: campo.dataset.attr, valor: campo.value
    }));
    const arquivo = JSON.stringify({ formato: formatoIndividual, versao: 1, material }, null, 2);
    baixarArquivo(new Blob([arquivo], { type: "application/json;charset=utf-8" }), nomeArquivoMaterial(material));
  };

  importar.onclick = () => entrada.click();
  entrada.onchange = async () => {
    const arquivo = entrada.files[0];
    entrada.value = "";
    if (!arquivo) return;
    if ($(modal.querySelector("#btnSalvarMaterial")).data("loading")) {
      aviso.textContent = "Aguarde o cadastro terminar de salvar antes de importar.";
      return;
    }
    const botoesSalvar = [...modal.querySelectorAll("#btnSalvarMaterial, #btnSalvarMaterialFoto")];
    const estados = botoesSalvar.map(botao => botao.disabled);
    botoesSalvar.forEach(botao => { botao.disabled = true; });
    importar.disabled = true;
    try {
      const material = lerMaterialIndividual(await arquivo.text());
      if (material.relacionados?.length && !state.listaVariacoes.length) await carregarVariacoes();
      if (!modal.isConnected || modal.classList.contains("hidden")) return;

      resetModalMaterial();
      const unidade = modal.querySelector("#unidadeMaterial");
      if (material.unidade && ![...unidade.options].some(opcao => opcao.value === material.unidade)) {
        const opcao = new Option(material.unidade, material.unidade);
        opcao.dataset.unidadeImportada = "1";
        unidade.add(opcao);
      }
      for (const [campo, seletor] of Object.entries(camposIndividuais)) {
        modal.querySelector(seletor).value = material[campo] || (campo === "unidade" ? "un" : "");
      }
      modal.querySelector("#materialUsoGenerico").checked = material.usoGenerico;
      if (material.imagem) {
        imagemImportada.value = material.imagem;
        $(foto).off("error.materialImportada").one("error.materialImportada", () => {
          foto.src = "/imagens/imagemmaterial.webp";
        });
        foto.src = material.imagem;
      }
      const atributos = Object.fromEntries(material.atributos.map(({ atributo, valor }) => [atributo, valor]));
      state.atributosSelecionados = Object.keys(atributos);
      renderAtributos(atributos);
      importarRelacionadosMaterial(material.relacionados || []);
      atualizarModoModalMaterial("base", "Importado para revisão");
      modal.querySelector("#nomeMaterial").focus();
    } catch (erro) {
      if (!modal.classList.contains("hidden")) aviso.textContent = erro.message;
    } finally {
      importar.disabled = false;
      botoesSalvar.forEach((botao, indice) => { botao.disabled = estados[indice]; });
    }
  };
}

function lerMaterialIndividual(conteudo) {
  let arquivo;
  try {
    arquivo = JSON.parse(conteudo.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  if (arquivo?.formato === "connectpear-catalogo-materiais") {
    throw new Error("Use Importar catálogo no cabeçalho da tela Materiais para abrir este arquivo.");
  }
  if (arquivo?.formato !== formatoIndividual || arquivo.versao !== 1) {
    throw new Error("Selecione um arquivo gerado pelo botão Exportar material.");
  }
  const material = arquivo.material;
  if (!material || !Object.keys(camposIndividuais).every(campo => typeof material[campo] === "string") ||
      !material.nome.trim() || typeof material.usoGenerico !== "boolean" || !Array.isArray(material.atributos)) {
    throw new Error("O arquivo contém campos inválidos.");
  }
  const chaves = new Set();
  if (material.imagem != null && material.imagem !== "" && !lerUrlImagem(material.imagem)) {
    throw new Error("O arquivo contém um endereço de imagem inválido.");
  }
  if (material.relacionados !== undefined && (!Array.isArray(material.relacionados) ||
      !material.relacionados.every(item => item && (item.id === null || (Number.isSafeInteger(item.id) && item.id > 0)) &&
        (item.quantidade == null || (typeof item.quantidade === "number" && item.quantidade >= 0.000001 && item.quantidade < 1e10)) &&
        (item.referencia === undefined || (item.referencia && typeof item.referencia.nome === "string" &&
          item.referencia.atributos && typeof item.referencia.atributos === "object" && !Array.isArray(item.referencia.atributos)))))) {
    throw new Error("O arquivo contém materiais relacionados inválidos.");
  }
  for (const atributo of material.atributos) {
    const chave = typeof atributo?.atributo === "string" && normalizarAtributo(atributo.atributo);
    if (!chave || chaves.has(chave) || typeof atributo.valor !== "string") {
      throw new Error("O arquivo contém atributos inválidos ou repetidos.");
    }
    chaves.add(chave);
  }
  return material;
}

export function initCatalogoMaterialTransferencia() {
  const exportar = document.getElementById("btnExportarMateriais");
  const importar = document.getElementById("btnImportarMateriais");
  const entrada = document.getElementById("arquivoImportarMateriais");
  if (!exportar || !importar || !entrada) return;

  const bloquear = valor => {
    exportar.disabled = valor;
    importar.disabled = valor;
  };
  const relatarErro = erro => window.Swal.fire({ icon: "error", title: "Transferência de materiais", text: erro.message });
  exportar.onclick = async () => {
    bloquear(true);
    try {
      const resposta = await requisitar("exportar");
      baixarArquivo(await resposta.blob(), "catalogo-materiais.json");
    } catch (erro) {
      relatarErro(erro);
    } finally {
      bloquear(false);
    }
  };
  importar.onclick = () => entrada.click();
  entrada.onchange = async () => {
    const arquivo = entrada.files[0];
    entrada.value = "";
    if (!arquivo) return;
    bloquear(true);
    try {
      const resposta = await requisitar("importar", {
        method: "POST", headers: { "Content-Type": tipoCatalogo + "; charset=UTF-8" }, body: arquivo
      });
      const resultado = await resposta.json();
      window.Swal.fire({
        icon: "success",
        title: "Importação concluída",
        text: `Materiais criados: ${resultado.materiaisCriados} · Variações adicionadas: ${resultado.variacoesCriadas} · Já existentes: ${resultado.variacoesExistentes}`
      });
      await Promise.allSettled([carregarVariacoes(), window.carregarCatalogoMateriais?.()]);
      if ($("#modalMaterial").is(":visible")) $("#buscarCadastroMaterial").trigger("input");
    } catch (erro) {
      relatarErro(erro);
    } finally {
      bloquear(false);
    }
  };
}
