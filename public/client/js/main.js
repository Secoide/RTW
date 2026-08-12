import { initMenuClick } from "./events/navigation/handle-menu-click.js";
import { initHome } from "./bootstrap/home-init.js";
import { carregarUltimaPaginaMenu } from "./services/ui/page-loader.js";


$(document).ready(async function () {
  if ($("#menu").length) {

    initMenuClick();
    await initHome();
    carregarUltimaPaginaMenu();

    $("#conteudo").addClass("visivel");
  }
});


