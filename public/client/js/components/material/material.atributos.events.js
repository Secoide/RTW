import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { normalizarAtributo, parseAtributos } from "../../utils/material/material.utils.js";
import { adicionarAtributo } from "../../components/forms/material.modal.js";

function configurarSeletorAtributos() {
  const busca = document.getElementById("materialBuscarAtributo");
  const botao = document.getElementById("btnAddAtributo");
  const lista = document.getElementById("materialOpcoesAtributo");
  if (!busca || !botao || !lista) return;
  const seletor = document.getElementById("selectAtributo");
  const normalizarBusca = texto => texto.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  let sugestoes = [];
  let indiceAtivo = -1;

  function selecionar(indice) {
    indiceAtivo = indice;
    const anterior = lista.querySelector('[aria-selected="true"]');
    anterior?.setAttribute("aria-selected", "false");
    const atual = lista.children[indice];
    if (!atual) {
      busca.removeAttribute("aria-activedescendant");
      return;
    }
    atual.setAttribute("aria-selected", "true");
    busca.setAttribute("aria-activedescendant", atual.id);
    atual.scrollIntoView({ block: "nearest" });
  }

  function abrir(destacarPrimeira = false) {
    const termo = normalizarBusca(busca.value);
    const selecionados = new Set(state.atributosSelecionados.map(normalizarAtributo));
    sugestoes = [...seletor.options].filter(opcao => opcao.value &&
      !selecionados.has(normalizarAtributo(opcao.value)) && normalizarBusca(opcao.value).includes(termo));
    lista.replaceChildren(...sugestoes.map((opcao, indice) => {
      const item = document.createElement("div");
      item.id = "material-opcao-atributo-" + indice;
      item.dataset.indice = indice;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");
      item.textContent = opcao.text;
      return item;
    }));
    lista.hidden = !sugestoes.length;
    busca.setAttribute("aria-expanded", String(!lista.hidden));
    selecionar(destacarPrimeira && sugestoes.length ? 0 : -1);
  }

  function fechar() {
    indiceAtivo = -1;
    lista.hidden = true;
    busca.setAttribute("aria-expanded", "false");
    busca.removeAttribute("aria-activedescendant");
  }

  function adicionar(indice = indiceAtivo) {
    if (lista.hidden) abrir();
    const atributo = sugestoes[Math.max(0, indice)]?.value;
    if (!atributo) return;
    busca.value = "";
    fechar();
    adicionarAtributo(atributo);
  }

  busca.onfocus = () => abrir();
  busca.oninput = () => abrir(true);
  busca.onkeydown = event => {
    if (event.isComposing) return;
    if (event.key === "Escape" && !lista.hidden) {
      event.preventDefault();
      event.stopPropagation();
      fechar();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (lista.hidden) abrir();
      if (!sugestoes.length) return;
      const proximo = event.key === "ArrowDown"
        ? (indiceAtivo + 1) % sugestoes.length
        : indiceAtivo > 0 ? indiceAtivo - 1 : sugestoes.length - 1;
      selecionar(proximo);
    } else if (event.key === "Enter") {
      event.preventDefault();
      adicionar();
    }
  };
  lista.onpointerdown = event => {
    if (event.target.closest("[data-indice]")) event.preventDefault();
  };
  lista.onclick = event => {
    const item = event.target.closest("[data-indice]");
    if (item) adicionar(Number(item.dataset.indice));
  };
  busca.parentElement.onfocusout = event => {
    if (!busca.parentElement.contains(event.relatedTarget)) fechar();
  };
  botao.onclick = () => adicionar();
}

export function initMaterialAtributosModal() {
  configurarSeletorAtributos();

  $("#modalMaterial").off(".materialAtributos")
    .on("click.materialAtributos", ".chip-remove", function () {
      const chave = normalizarAtributo(this.closest(".attr-row").querySelector(".input-attr").dataset.attr);
      state.atributosSelecionados = state.atributosSelecionados.filter(item => normalizarAtributo(item) !== chave);
      renderAtributos();
    })
    .on("focusin.materialAtributos", "#valoresAtributos .input-attr", function () {
      const chave = normalizarAtributo(this.dataset.attr);
      const sugestoes = new Set();
      for (const material of state.listaVariacoes) {
        for (const [nome, valor] of Object.entries(parseAtributos(material.atributos))) {
          if (normalizarAtributo(nome) === chave && valor) sugestoes.add(valor);
        }
        if (sugestoes.size >= 20) break;
      }
      $("#materialSugestoesAtributo").empty().append(
        [...sugestoes].slice(0, 20).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"))
          .map(valor => $("<option>").val(valor)[0])
      );
      this.setAttribute("list", "materialSugestoesAtributo");
    }).on("focusout.materialAtributos", "#valoresAtributos .input-attr", function () {
      this.removeAttribute("list");
    });
}
