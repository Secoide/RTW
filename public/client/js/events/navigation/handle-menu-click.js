import { carregarPagina } from "../../services/ui/page-loader.js";

export function initMenuClick() {
  aplicarPermissoesSaasMenu();

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

  const contexto = getSaasContexto();
  if (!contexto.modo_saas || contexto.acesso_total) return true;

  return Array.isArray(contexto.recursos) && contexto.recursos.includes(chave);
}

function aplicarPermissoesSaasMenu() {
  const contexto = getSaasContexto();
  if (!contexto.modo_saas || contexto.acesso_total) return;

  document.querySelectorAll(".bt_menuP[data-feature]").forEach(item => {
    const chave = item.dataset.feature;
    if (chave === "menu.ferramentas") return;

    if (!podeUsarRecurso(chave)) {
      item.style.display = "none";
    }
  });

  document.querySelectorAll(".menu-parent[data-submenu]").forEach(parent => {
    const submenu = document.querySelector(`.menu-submenu[data-submenu-content="${parent.dataset.submenu}"]`);
    if (!submenu) return;

    const possuiRecursoLiberado = [...submenu.querySelectorAll(".bt_menuP[data-feature]")]
      .some(item => podeUsarRecurso(item.dataset.feature));

    if (!possuiRecursoLiberado) {
      parent.style.display = "none";
      submenu.style.display = "none";
    }
  });
}
