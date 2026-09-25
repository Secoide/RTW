import { carregarPagina } from "../../services/ui/page-loader.js";

const RECURSOS_PUBLICOS_MENU = new Set(['menu.inicio', 'menu.versao', 'menu.guia']);

function usuarioAdministrador() {
  return Number(sessionStorage.getItem('id_usuario')) === 999
    || Number(sessionStorage.getItem('nivel_acesso')) === 99
    || Number(localStorage.getItem('nivel_acesso')) === 99;
}

export function initMenuClick() {
  aplicarPermissoesSaasMenu();

  const menuContainer = document.getElementById('menu');
  if (menuContainer && !menuContainer.dataset.saasObserverBound) {
    const observer = new MutationObserver(() => aplicarPermissoesSaasMenu());
    observer.observe(menuContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden', 'style']
    });
    menuContainer.dataset.saasObserverBound = 'true';
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest(".bt_menuP");
    if (!el) return;

    e.preventDefault();

    if (el.classList.contains("menu-parent")) {
      const nomeSubmenu = el.dataset.submenu;
      const submenu = document.querySelector(`.menu-submenu[data-submenu-content="${nomeSubmenu}"]`);
      const aberto = submenu?.classList.toggle("aberto");
      el.classList.toggle("aberto", Boolean(aberto));
      return;
    }

    if (!podeUsarRecurso(el.dataset.feature)) {
      Swal?.fire?.({
        icon: "info",
        theme: "dark",
        title: "Recurso não contratado",
        text: "Este menu não faz parte do pacote contratado pela empresa."
      });
      return;
    }

    document.querySelectorAll(".bt_menuP").forEach(a => a.classList.remove("ativo"));
    el.classList.add("ativo");
    el.closest(".menu-submenu")?.classList.add("aberto");
    document.querySelector(`.menu-parent[data-submenu="${el.closest(".menu-submenu")?.dataset.submenuContent}"]`)?.classList.add("aberto");

    const pagina = el.getAttribute("data-pagina");
    if (pagina) carregarPagina(pagina);
  });
}

function getSaasContexto() {
  try {
    return JSON.parse(sessionStorage.getItem("saas_contexto") || "{}");
  } catch {
    return {};
  }
}

function podeUsarRecurso(chave) {
  if (!chave) return true;
  if (usuarioAdministrador()) return true;
  if (RECURSOS_PUBLICOS_MENU.has(chave)) return true;

  const contexto = getSaasContexto();
  if (!contexto.modo_saas || contexto.acesso_total) return true;

  return Array.isArray(contexto.recursos) && contexto.recursos.includes(chave);
}

function aplicarPermissoesSaasMenu() {
  const contexto = getSaasContexto();

  document.querySelectorAll(".bt_menuP[data-feature]").forEach(item => {
    const chave = item.dataset.feature;
    const bloqueadoSaas = contexto.modo_saas
      && !contexto.acesso_total
      && chave !== "menu.ferramentas"
      && !podeUsarRecurso(chave);

    const display = bloqueadoSaas ? "none" : "";
    if (item.style.display !== display) item.style.display = display;
  });

  document.querySelectorAll(".menu-parent[data-submenu]").forEach(parent => {
    const submenu = document.querySelector(`.menu-submenu[data-submenu-content="${parent.dataset.submenu}"]`);
    if (!submenu) return;

    const possuiTelaDisponivel = [...submenu.querySelectorAll(".bt_menuP[data-feature]")]
      .some(item => {
        const escondidoPorPermissao = item.classList.contains('role-hidden')
          || item.getAttribute('aria-hidden') === 'true';
        const escondidoPorSaas = item.style.display === 'none';
        return !escondidoPorPermissao && !escondidoPorSaas && podeUsarRecurso(item.dataset.feature);
      });

    const display = possuiTelaDisponivel ? "" : "none";
    const ariaHidden = String(!possuiTelaDisponivel);
    if (parent.style.display !== display) parent.style.display = display;
    if (submenu.style.display !== display) submenu.style.display = display;
    if (parent.getAttribute('aria-hidden') !== ariaHidden) parent.setAttribute('aria-hidden', ariaHidden);
  });
}
