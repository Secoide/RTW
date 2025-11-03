import { aplicarPermissoesMenu_porRoles } from "../state/role.js";
import { initAbrirInfoColabClick } from "../events/click/handle-abrir-info-colab.js";
import "../events/click/handle-atestados.js";
import { initColaboradoresContextMenu } from "../events/contextmenu/handle-colaboradores-contextmenu.js";
import { conectarSocket } from "../services/sockets/socket-service.js";

export function initHome() {

  const socket = conectarSocket();
  initColaboradoresContextMenu(socket);

  // carregar menu
  fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu").innerHTML = html;
      aplicarPermissoesMenu_porRoles();
    })
    .catch(err => console.error("Erro ao carregar menu:", err));

  // carregar perfil
  fetch("menuPerfil.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menuperfil").innerHTML = html;
      document.getElementById("bt_perfilhome").innerText = sessionStorage.getItem("nome_usuario");
      initAbrirInfoColabClick();
    });


}
