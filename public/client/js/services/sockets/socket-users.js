// /public/client/js/services/sockets/socket-users.js
import { reduzirNome } from "../../utils/formatters/strings-format.js";
import { get_carregarPerfilUsuario } from "../../events/click/handle-abrir-info-colab.js";

let ultimaListaUsuarios = [];
let usuariosAtuais = [];
let mensagensChat = [];
let chatNaoLidas = 0;
let chatInicializado = false;
let colaboradoresChat = [];
const emoticonsChat = ["😀", "😁", "😂", "😅", "😉", "😊", "😎", "🤔", "😬", "👍", "👏", "🙏", "🚀", "✅", "⚠️", "❤️"];

export function enviarUsuarioOnline(socket, nome) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ acao: "usuario_online", nome }));
  }
}

export function enviarLogout(socket) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ acao: "logout" }));
  }
}

export function atualizarUsuariosOnline({ usuarios }) {
  ultimaListaUsuarios = (usuarios || [])
    .filter(usuarioDeveAparecerOnline)
    .map((u) => reduzirNome(u));
}

export function atualizarListaOnline(lista) {
  const container = document.getElementById("online-list");
  const badge = document.getElementById("online-count");
  if (!container && !badge) return;

  const usuariosVisiveis = (lista || []).filter(usuarioDeveAparecerOnline);
  const novos = usuariosVisiveis.filter(u => !usuariosAtuais.includes(u));

  if (container) {
    container.innerHTML = "";

    usuariosVisiveis.forEach(nome => {
      const div = document.createElement("div");
      div.className = "online-user";
      div.dataset.nome = nome;
      div.textContent = "● " + nome;
      //div.title = "Clique para mencionar no chat";
      container.appendChild(div);
    });
  }

  if (badge) badge.textContent = usuariosVisiveis.length;

  if (novos.length > 0) {
    mostrarPopupEntrada(novos[0]);
  }

  usuariosAtuais = usuariosVisiveis;
}

function mostrarPopupEntrada(nome) {
  if (painelEstaAberto()) return;

  const popup = document.getElementById("online-popup");
  if (!popup || nome === localStorage.getItem("nome_usuario")) return;

  popup.textContent = `● ${nome} entrou no sistema`;
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 5000);
}

function painelEstaAberto() {
  const panel = document.getElementById("online-panel");
  return panel?.classList.contains("active");
}

function getMeuNome() {
  return sessionStorage.getItem("nome_usuario")
    || localStorage.getItem("nome_usuario")
    || "Usuario";
}

function usuarioDeveAparecerOnline(nome) {
  const usuario = reduzirNome(nome || "");
  const meuNome = reduzirNome(getMeuNome());

  return usuario !== "Administrador"
    && usuario !== meuNome;
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function usuarioFoiMencionado(texto) {
  const meuNome = reduzirNome(getMeuNome());
  const primeiroNome = meuNome.split(" ")[0];
  const textoNormalizado = normalizarTexto(texto);
  const nomeNormalizado = normalizarTexto(meuNome);
  const primeiroNomeNormalizado = normalizarTexto(primeiroNome);

  return textoNormalizado.includes(`@${nomeNormalizado}`)
    || textoNormalizado.includes(`@${primeiroNomeNormalizado}`);
}

function notificarMencaoChat(data) {
  const popup = document.getElementById("online-popup");
  if (!popup) return;

  popup.textContent = `${reduzirNome(data.usuario || "Usuario")} mencionou voce no chat`;
  popup.classList.add("show", "mention");

  setTimeout(() => {
    popup.classList.remove("show", "mention");
  }, 7000);
}

async function carregarColaboradoresChat() {
  if (colaboradoresChat.length > 0) return colaboradoresChat;

  try {
    const res = await fetch("/api/colaboradores/cbx", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) return [];

    colaboradoresChat = await res.json();
    return colaboradoresChat;
  } catch (err) {
    console.warn("Nao foi possivel carregar atalhos de colaboradores.", err);
    return [];
  }
}

function encontrarColaboradoresMencionados(texto) {
  const textoNormalizado = normalizarTexto(texto);

  return colaboradoresChat.filter((colab) => {
    const nome = colab.nome || "";
    const nomeNormalizado = normalizarTexto(nome);

    return textoNormalizado.includes(`#${nomeNormalizado}`);
  });
}

async function abrirInfoColaborador(id) {
  try {
    await get_carregarPerfilUsuario(id);
  } catch (err) {
    console.warn("Nao foi possivel abrir o perfil do colaborador.", err);
  }
}

function criarBotaoAcao(texto, classe, onClick) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener("click", onClick);
  return botao;
}

function criarLinksRapidosColaborador(colaboradores) {
  if (!colaboradores.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "chat-quick-links";

  colaboradores.slice(0, 3).forEach((colab) => {
    const row = document.createElement("div");
    row.className = "chat-quick-link";

    const nome = document.createElement("span");
    nome.textContent = reduzirNome(colab.nome || "Colaborador");

    row.appendChild(nome);
    row.appendChild(criarBotaoAcao("Info", "chat-info-btn", () => abrirInfoColaborador(colab.id)));
    wrap.appendChild(row);
  });

  return wrap;
}

function chatEstaVisivel() {
  const panel = document.getElementById("online-panel");
  const chat = document.getElementById("online-chat");
  return panel?.classList.contains("active") && chat?.classList.contains("active");
}

function atualizarBadgeChat() {
  const badge = document.getElementById("online-chat-unread");
  if (!badge) return;

  badge.textContent = chatNaoLidas;
  badge.style.display = chatNaoLidas > 0 ? "inline-block" : "none";
}

function limparEstadoChatOnline() {
  ultimaListaUsuarios = [];
  usuariosAtuais = [];
  mensagensChat = [];
  chatNaoLidas = 0;

  const lista = document.getElementById("online-list");
  const count = document.getElementById("online-count");
  const popup = document.getElementById("online-popup");

  if (lista) lista.innerHTML = "";
  if (count) count.textContent = "0";
  if (popup) popup.classList.remove("show", "mention");

  atualizarBadgeChat();
  renderChat();
}

function renderChat() {
  const container = document.getElementById("online-chat-messages");
  if (!container) return;

  container.innerHTML = "";

  if (mensagensChat.length === 0) {
    const empty = document.createElement("div");
    empty.className = "online-chat-empty";
    empty.textContent = "Todas as mensagens são temporárias, se reiniciar página as conversas somem.";
    container.appendChild(empty);
    return;
  }

  const meuNome = reduzirNome(getMeuNome());

  mensagensChat.forEach((msg) => {
    const item = document.createElement("div");
    item.className = "online-chat-msg";

    if (reduzirNome(msg.usuario || "") === meuNome) {
      item.classList.add("mine");
    }

    const meta = document.createElement("div");
    meta.className = "online-chat-meta";

    const usuario = document.createElement("span");
    usuario.textContent = reduzirNome(msg.usuario || "Usuario");

    const hora = document.createElement("span");
    hora.textContent = msg.hora || "";

    const texto = document.createElement("div");
    texto.textContent = msg.texto || "";

    meta.appendChild(usuario);
    meta.appendChild(hora);
    item.appendChild(meta);
    item.appendChild(texto);

    const linksRapidos = criarLinksRapidosColaborador(
      encontrarColaboradoresMencionados(msg.texto || "")
    );

    if (linksRapidos) {
      item.appendChild(linksRapidos);
    }

    container.appendChild(item);
  });

  container.scrollTop = container.scrollHeight;
}

function abrirAbaOnline(tipo) {
  document.querySelectorAll(".online-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.onlineTab === tipo);
  });

  document.querySelectorAll(".online-tab-panel").forEach(panel => {
    const ativo = tipo === "users"
      ? panel.id === "online-list"
      : panel.id === "online-chat";

    panel.classList.toggle("active", ativo);
  });

  if (tipo === "chat") {
    chatNaoLidas = 0;
    atualizarBadgeChat();
    renderChat();
    document.getElementById("online-chat-input")?.focus();
  }
}

function obterConsultaReferencia(valor) {
  const match = String(valor || "").match(/([@#])([^\s@#]*)$/);
  return match
    ? { tipo: match[1], texto: match[2] }
    : null;
}

function inserirReferenciaNoInput(input, tipo, nome) {
  const valor = input.value;
  input.value = valor.replace(/([@#])([^\s@#]*)$/, `${tipo}${nome} `);
  input.focus();
  renderSugestoesChat(null);
}

function inserirTextoNoInput(input, textoInserido) {
  const inicio = input.selectionStart ?? input.value.length;
  const fim = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, inicio)}${textoInserido}${input.value.slice(fim)}`;
  input.selectionStart = inicio + textoInserido.length;
  input.selectionEnd = inicio + textoInserido.length;
  input.focus();
  renderSugestoesChat(obterConsultaReferencia(input.value));
}

function fecharEmoticonsChat() {
  const painel = document.getElementById("online-chat-emojis");
  if (painel) painel.style.display = "none";
}

function renderEmoticonsChat() {
  const painel = document.getElementById("online-chat-emojis");
  const input = document.getElementById("online-chat-input");
  if (!painel || !input) return;

  painel.innerHTML = "";

  emoticonsChat.forEach((emoji) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = emoji;
    botao.title = `Inserir ${emoji}`;
    botao.addEventListener("click", () => inserirTextoNoInput(input, emoji));
    painel.appendChild(botao);
  });
}

function alternarEmoticonsChat() {
  const painel = document.getElementById("online-chat-emojis");
  if (!painel) return;

  painel.style.display = painel.style.display === "grid" ? "none" : "grid";
}

function renderSugestoesChat(consulta) {
  const container = document.getElementById("online-chat-suggestions");
  const input = document.getElementById("online-chat-input");
  if (!container || !input) return;

  const consultaNormalizada = normalizarTexto(consulta?.texto);

  if (consulta === null || consultaNormalizada.length === 0) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const encontrados = consulta.tipo === "#"
    ? colaboradoresChat
      .filter(colab => normalizarTexto(colab.nome).includes(consultaNormalizada))
      .map(colab => ({
        id: colab.id,
        nome: colab.nome,
        texto: colab.nome
      }))
      .slice(0, 5)
    : usuariosAtuais
      .filter(nome => normalizarTexto(nome).includes(consultaNormalizada))
      .map(nome => ({
        nome,
        texto: reduzirNome(nome)
      }))
      .slice(0, 5);

  container.innerHTML = "";

  if (encontrados.length === 0) {
    container.style.display = "none";
    return;
  }

  encontrados.forEach((colab) => {
    const row = document.createElement("div");
    row.className = "chat-suggestion";

    const nome = document.createElement("span");
    nome.className = "chat-suggestion-name";
    nome.textContent = consulta.tipo === "#"
      ? colab.nome
      : reduzirNome(colab.nome);

    row.appendChild(nome);
    row.appendChild(criarBotaoAcao(consulta.tipo, "mention", () => inserirReferenciaNoInput(input, consulta.tipo, colab.texto)));
    container.appendChild(row);
  });

  container.style.display = "block";
}

function enviarMensagemChat(texto) {
  const socket = window.rtwSocket;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Sem conexao com servidor. Tente novamente.");
    return false;
  }

  socket.send(JSON.stringify({
    acao: "mensagem_chat",
    usuario: getMeuNome(),
    texto
  }));

  return true;
}

export function receberMensagemChat(data) {
  const mensagemMinha = reduzirNome(data.usuario || "") === reduzirNome(getMeuNome());

  mensagensChat.push({
    usuario: data.usuario,
    texto: data.texto,
    hora: data.hora
  });

  if (mensagensChat.length > 80) {
    mensagensChat = mensagensChat.slice(-80);
  }

  if (!chatEstaVisivel()) {
    chatNaoLidas += 1;
    atualizarBadgeChat();
  }

  if (!mensagemMinha && usuarioFoiMencionado(data.texto)) {
    notificarMencaoChat(data);
  }

  renderChat();
}

function initMiniChatOnline() {
  if (chatInicializado) return;
  chatInicializado = true;

  carregarColaboradoresChat().then(() => renderChat());
  renderEmoticonsChat();

  document.addEventListener("click", (event) => {
    if (event.target.closest("#online-chat-emoji")) {
      alternarEmoticonsChat();
      return;
    }

    if (!event.target.closest("#online-chat-emojis")) {
      fecharEmoticonsChat();
    }

    const tab = event.target.closest(".online-tab");
    if (tab) {
      abrirAbaOnline(tab.dataset.onlineTab);
      return;
    }

    const user = event.target.closest(".online-user");
    return; //DESATIVADO por enquanto
    if (user) {
      abrirAbaOnline("chat");
      const input = document.getElementById("online-chat-input");
      if (input) {
        input.value = `@${user.dataset.nome} `;
        input.focus();
      }
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "online-chat-form") return;
    event.preventDefault();

    const input = document.getElementById("online-chat-input");
    const texto = input?.value.trim();

    if (!texto) return;

    if (enviarMensagemChat(texto)) {
      input.value = "";
      renderSugestoesChat(null);
      fecharEmoticonsChat();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "online-chat-input") return;
    renderSugestoesChat(obterConsultaReferencia(event.target.value));
  });

  renderChat();
  atualizarBadgeChat();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMiniChatOnline);
} else {
  initMiniChatOnline();
}

document.addEventListener("chat-online:limpar", limparEstadoChatOnline);
