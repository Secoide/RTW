// /public/client/js/services/sockets/reconnect-service.js
import { conectarSocket, getSocket } from "./socket-service.js";
import { initProgramacao } from "../../bootstrap/programacao-init.js";

let tentativas = 0;
const MAX_TENTATIVAS = 5;
let socket = null;
let desconectandoPorLogout = false;

function atualizarStatus(texto, cor) {
  $("#status").text(texto);
  $(".fa-server").css("color", cor);
}

function getNomeUsuario() {
  return localStorage.getItem("nome_usuario");
}

export function setLogoutFlag() {
  desconectandoPorLogout = true;
}

export function iniciarConexao() {
  const nomeUsuario = getNomeUsuario();
  socket = conectarSocket(nomeUsuario);

  socket.onopen = async () => {
    tentativas = 0;
    atualizarStatus("Conectado", "green");

    if (nomeUsuario) {
      socket.send(JSON.stringify({ acao: "usuario_online", nome: nomeUsuario }));
    } else {
      $("#overlay_nome, #box_nome_usuario").show(200);
    }

    // 🔄 Atualiza a programação após reconectar
    try {
      //await initProgramacao();
      console.log("✅ Programação recarregada após reconexão");
    } catch (err) {
      console.error("❌ Falha ao recarregar programação:", err);
    }
  };

  socket.onclose = () => {
    if (desconectandoPorLogout) {
      sessionStorage.clear();
      window.location.href = "login";
      return;
    }

    tentativas++;
    if (tentativas <= MAX_TENTATIVAS) {
      const msg = `Reconectando... (tentativa ${tentativas}/${MAX_TENTATIVAS})`;
      atualizarStatus(msg, "orange");
      setTimeout(() => iniciarConexao(), 5000);
    } else {
      atualizarStatus(
        "Falha ao reconectar. Recarregue a página ou contate o suporte.",
        "red"
      );
    }
  };
}

// Auto-init quando a página carregar
$(document).ready(() => {
  iniciarConexao();
});
