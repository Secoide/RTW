import { initMenuClick } from "./events/navigation/handle-menu-click.js";
import { initHome } from "./bootstrap/home-init.js";


$(document).ready(function () {
  if ($("#menu").length) {

    initMenuClick();
    initHome();

    $("#conteudo").addClass("visivel");
  }
});


