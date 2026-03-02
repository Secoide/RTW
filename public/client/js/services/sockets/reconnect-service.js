// /public/client/js/services/sockets/reconnect-service.js
import { conectarSocket } from "./socket-service.js";

function getNomeUsuario() {
  return localStorage.getItem("nome_usuario");
}

export function analisarConexao() {
  const nomeUsuario = getNomeUsuario();
  conectarSocket(nomeUsuario);
}


const Toast = Swal.mixin({
  toast: true,
  theme: 'dark',
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});


/* =========================
   EVENTOS DO SOCKET
========================= */


document.addEventListener("ws:connected", () => {

  Swal.close();

  Toast.fire({
    icon: "success",
    title: "Conectado ao servidor",
    customClass: {
      popup: 'swal-toast-custom',
      title: 'toast-title-custom',
      htmlContainer: 'toast-text-custom'
      },
  });

  const nomeUsuario = getNomeUsuario();

  if (!nomeUsuario) {
    $("#overlay_nome, #box_nome_usuario").show(200);
  }
});


document.addEventListener("ws:disconnected", () => {

  Toast.fire({
    icon: "error",
    title: "Desconectado do servidor"
  });

});


document.addEventListener("ws:reconnecting", (event) => {

  const tentativa = event.detail.tentativa;

  Swal.fire({
    title: "🚀 Reestabelecendo conexão com Servidor",
    theme: 'dark',
    customClass: {
      title: 'swal-title-custom',
      htmlContainer: 'swal-text-custom'
      },
    html: `
    <div style="font-size:15px;">
      Estamos tentando reconectar ao servidor.<br>
      <strong>Tentativa ${tentativa}</strong>
    </div>
    <div style="margin-top:10px;font-size:13px;opacity:0.8;">
      A conexão será retomada automaticamente.
    </div>
  `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

});


document.addEventListener("ws:reconnect_failed", () => {

  Swal.fire({
    icon: "error",
    theme: 'dark',
    title: "Falha ao reconectar",
    text: "Recarregue a página ou contate o suporte.",
    confirmButtonText: "Recarregar agora"
  }).then(() => location.reload());

});


/* =========================
   AUTO INIT
========================= */

$(document).ready(() => {
  analisarConexao();
});