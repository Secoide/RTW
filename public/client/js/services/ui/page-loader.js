import { initProgramacao } from "../../bootstrap/programacao-init.js";
import { inciarRH } from "../../bootstrap/rh-init.js";
import { initGestao } from "../../bootstrap/gestao-init.js";
import { initFerias } from "../../bootstrap/ferias-init.js";
import { initHome } from "../../bootstrap/home-init.js";
import { initMaterial } from "../../bootstrap/material-init.js";
import { initMateriais } from "../../bootstrap/materiais-init.js";
import { initEstoque } from "../../bootstrap/estoque-init.js";
import { initGuia } from "../../bootstrap/guia-init.js";
import { initFerramentas } from "../../bootstrap/ferramentas-init.js";
import { initSpda } from "../../bootstrap/spda-init.js";
import { initRelatos } from "../../bootstrap/relatos-init.js";
import { initPrototipoAtributosMaterial, limparPrototipoAtributosMaterial } from "../../bootstrap/prototipo-atributos-material-init.js";

const STORAGE_ULTIMA_PAGINA_MENU = "connectpear_ultima_pagina_menu";
const PAGINA_INICIO = "/client/pages/inicio.html";


// Funções de carregamento de páginas
export function carregarPagina(pagina, opcoes = {}) {
  const conteudo = document.getElementById('conteudo');
  limparPrototipoAtributosMaterial();
  conteudo.classList.remove('visivel');

  setTimeout(() => {
    fetch(pagina)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ao carregar ${pagina}: ${res.status}`);
        return res.text();
      })
      .then(html => {
        conteudo.innerHTML = html;
        conteudo.classList.add('visivel');
        ativarMenuPorPagina(pagina);
        if (opcoes.salvarHistorico !== false) {
          salvarUltimaPaginaMenu(pagina);
        }

        if (pagina.includes('programacaoOS')) {
          initProgramacao();
        }
        if (pagina.includes('rh')) {
          inciarRH();
        }
        if (pagina.includes('gestao')) {
          initGestao();
        }
        if (pagina.includes('ferias')) {
          initFerias();
        }
        if (pagina.includes('inicio')) {
          initHome();
        }
        if (pagina.includes('lista_material')) {
          initMaterial();
        }
        if (pagina.includes('materiais')) {
          initMateriais();
        }
        if (pagina.includes('estoque')) {
          initEstoque();
        }
        if (pagina.includes('ferramentas')) {
          initFerramentas();
        }
        if (pagina.includes('spda')) {
          initSpda();
        }
        if (pagina.includes('relatos')) {
          initRelatos();
        }
        if (pagina.includes('guia')) {
          initGuia();
        }
        if (pagina.includes('prototipo-atributos-material')) {
          initPrototipoAtributosMaterial();
        }
      })
      .catch(err => {
        conteudo.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
        console.error(err);
      });
  }, 300);
}

window.abrirPrototipoAtributosMaterial = function () {
  carregarPagina("/client/pages/prototipo-atributos-material.html");
};

export function carregarUltimaPaginaMenu() {
  const pagina = obterUltimaPaginaMenu();
  if (!pagina || pagina === PAGINA_INICIO) {
    ativarMenuPorPagina(PAGINA_INICIO);
    return false;
  }

  const item = encontrarItemMenuPorPagina(pagina);
  if (!item || item.offsetParent === null) {
    localStorage.removeItem(STORAGE_ULTIMA_PAGINA_MENU);
    ativarMenuPorPagina(PAGINA_INICIO);
    return false;
  }

  carregarPagina(pagina, { salvarHistorico: false });
  return true;
}

export function obterUltimaPaginaMenu() {
  try {
    return localStorage.getItem(STORAGE_ULTIMA_PAGINA_MENU) || PAGINA_INICIO;
  } catch {
    return PAGINA_INICIO;
  }
}

function salvarUltimaPaginaMenu(pagina) {
  if (!pagina || typeof pagina !== "string") return;
  try {
    localStorage.setItem(STORAGE_ULTIMA_PAGINA_MENU, pagina);
  } catch {
    // Navegadores com armazenamento bloqueado apenas deixam de lembrar a pagina.
  }
}

function ativarMenuPorPagina(pagina) {
  const item = encontrarItemMenuPorPagina(pagina);
  if (!item) return;

  document.querySelectorAll(".bt_menuP").forEach(menu => menu.classList.remove("ativo"));
  document.querySelectorAll(".menu-submenu").forEach(submenu => submenu.classList.remove("aberto"));
  document.querySelectorAll(".menu-parent").forEach(parent => parent.classList.remove("aberto"));

  item.classList.add("ativo");
  const submenu = item.closest(".menu-submenu");
  if (submenu) {
    submenu.classList.add("aberto");
    document.querySelector(`.menu-parent[data-submenu="${submenu.dataset.submenuContent}"]`)?.classList.add("aberto");
  }
}

function encontrarItemMenuPorPagina(pagina) {
  if (!pagina || typeof pagina !== "string") return null;
  return document.querySelector(`.bt_menuP[data-pagina="${cssEscape(pagina)}"]`);
}

function cssEscape(valor) {
  if (window.CSS?.escape) return window.CSS.escape(valor);
  return String(valor).replace(/["\\]/g, "\\$&");
}

export function carregarScriptsDinamicamente(scripts, callback) {
  let carregados = 0;

  scripts.forEach(src => {
    if (document.querySelector(`script[src="${src}"]`)) {
      carregados++;
      if (carregados === scripts.length && typeof callback === "function") callback();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => {
      carregados++;
      if (carregados === scripts.length && typeof callback === "function") callback();
    };
    script.onerror = () => {
      console.error(`Erro ao carregar o script: ${src}`);
    };
    document.body.appendChild(script);
  });
}
