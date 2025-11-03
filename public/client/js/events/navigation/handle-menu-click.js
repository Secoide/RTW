import { carregarPagina } from "../../services/ui/page-loader.js";

export function initMenuClick() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest(".bt_menuP");
    if (!el) return;

    e.preventDefault();
    document.querySelectorAll(".bt_menuP").forEach(a => a.classList.remove("ativo"));
    el.classList.add("ativo");

    const pagina = el.getAttribute("data-pagina");
    if (pagina) carregarPagina(pagina);
  });
}
