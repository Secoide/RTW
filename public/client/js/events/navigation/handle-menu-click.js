import { carregarPagina } from "../../services/ui/page-loader.js";

export function initMenuClick() {
  aplicarPermissoesSaasMenu();

  document.addEventListener("click", (e) => {
    const el = e.target.closest(".bt_menuP");
    if (!el) return;

    e.preventDefault();

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
}
