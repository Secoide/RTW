// /public/client/js/services/sockets/socket-users.js
import { reduzirNome } from "../../utils/formatters/strings-format.js";
import { get_carregarPerfilUsuario } from "../../events/click/handle-abrir-info-colab.js";

let ultimaListaUsuarios = [];
let usuariosAtuais = [];
let mensagensChat = [];
let chatNaoLidas = 0;
let chatInicializado = false;
let colaboradoresChat = [];
let modoChatAtual = "global";
let destinatarioPrivadoChat = "";
let chatPrivadoNaoLidas = new Map();
const CHAT_STORAGE_KEY = "chat_online_historico_v1";
const PREFERENCIAS_STORAGE_PREFIX = "preferencias_usuario";
const REACOES_CHAT = ["👍", "✅", "👀"];
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
  const saiu = usuariosAtuais.length > 0
    ? usuariosAtuais.filter(u => !usuariosVisiveis.includes(u))
    : [];

  if (container) renderListaUsuariosOnline(usuariosVisiveis);

  if (badge) badge.textContent = usuariosVisiveis.length;

  if (novos.length > 0) {
    mostrarPopupEntrada(novos[0]);
  }

  if (saiu.length > 0) {
    saiu.forEach(nome => chatPrivadoNaoLidas.delete(reduzirNome(nome)));
    mostrarPopupSaida(saiu[0]);
  }

  usuariosAtuais = usuariosVisiveis;
}

function renderListaUsuariosOnline(usuariosVisiveis = usuariosAtuais) {
  const container = document.getElementById("online-list");
  if (!container) return;

  container.innerHTML = "";

  usuariosVisiveis.forEach(nome => {
    const nomeReduzido = reduzirNome(nome);
    const naoLidas = chatPrivadoNaoLidas.get(nomeReduzido) || 0;
    const div = document.createElement("div");
    div.className = "online-user";
    div.dataset.nome = nome;
    div.title = "Clique para abrir conversa privada";

    if (naoLidas > 0) {
      div.classList.add("has-private-unread");
    }

    const status = document.createElement("span");
    status.className = "online-user-status";
    status.textContent = "●";

    const nomeEl = document.createElement("span");
    nomeEl.className = "online-user-name";
    nomeEl.textContent = nome;

    div.appendChild(status);
    div.appendChild(nomeEl);

    if (naoLidas > 0) {
      const badge = document.createElement("span");
      badge.className = "online-user-private-badge";
      badge.textContent = naoLidas > 9 ? "9+" : String(naoLidas);
      div.appendChild(badge);
    }

    container.appendChild(div);
  });
}

function mostrarPopupEntrada(nome) {
  if (painelEstaAberto()) return;

  const popup = document.getElementById("online-popup");
  if (!popup || nome === localStorage.getItem("nome_usuario")) return;

  popup.textContent = `● ${nome} entrou no sistema`;
  popup.classList.remove("mention", "exit", "message");
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 5000);
}

function mostrarPopupSaida(nome) {
  if (painelEstaAberto()) return;

  const popup = document.getElementById("online-popup");
  if (!popup || nome === localStorage.getItem("nome_usuario")) return;

  popup.textContent = `${nome} saiu do sistema`;
  popup.classList.remove("mention", "exit", "message");
  popup.classList.add("show", "exit");

  setTimeout(() => {
    popup.classList.remove("show", "exit");
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
  popup.classList.remove("mention", "exit", "message");
  popup.classList.add("show", "mention");

  setTimeout(() => {
    popup.classList.remove("show", "mention");
  }, 7000);
}

function notificarMensagemMinimizada(data) {
  if (painelEstaAberto()) return;

  const popup = document.getElementById("online-popup");
  if (!popup) return;

  const nome = reduzirNome(data.usuario || "Usuario");
  const textoTipo = (data.tipo || "global") === "privado"
    ? "te mandou uma mensagem privada"
    : "mandou uma mensagem no grupo";

  popup.textContent = `${nome} ${textoTipo}`;
  popup.classList.remove("mention", "exit", "message");
  popup.classList.add("show", "message");

  setTimeout(() => {
    popup.classList.remove("show", "message");
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
  const badgeMinimizado = document.getElementById("online-message-count");
  const deveMostrarMinimizado = chatNaoLidas > 0 && !painelEstaAberto();

  if (badge) {
    badge.textContent = chatNaoLidas;
    badge.style.display = chatNaoLidas > 0 ? "inline-block" : "none";
  }

  if (badgeMinimizado) {
    badgeMinimizado.textContent = chatNaoLidas > 9 ? "9+" : String(chatNaoLidas);
    badgeMinimizado.style.display = deveMostrarMinimizado ? "inline-flex" : "none";
  }
}

function getPreferenciasUsuarioKey() {
  const usuario = sessionStorage.getItem("id_usuario")
    || sessionStorage.getItem("nome_usuario")
    || localStorage.getItem("nome_usuario")
    || "local";

  return `${PREFERENCIAS_STORAGE_PREFIX}_${usuario}`;
}

function getDiasHistoricoChat() {
  try {
    const preferencias = JSON.parse(localStorage.getItem(getPreferenciasUsuarioKey()) || "{}");
    const dias = Number(preferencias.historicoChatDias ?? 10);
    return [0, 5, 10, 15, 30].includes(dias) ? dias : 10;
  } catch {
    return 10;
  }
}

function chatGlobalSilenciado() {
  try {
    const preferencias = JSON.parse(localStorage.getItem(getPreferenciasUsuarioKey()) || "{}");
    return Boolean(preferencias.silenciarChatGlobal);
  } catch {
    return false;
  }
}

function normalizarMensagemPersistida(msg) {
  const criadoEm = Number(msg.criadoEm || Date.now());
  const usuario = msg.usuario || "Usuario";
  const texto = msg.texto || "";

  return {
    tipo: msg.tipo || "global",
    destinatario: msg.destinatario || "",
    usuario,
    texto,
    hora: msg.hora || "",
    criadoEm,
    reacao: REACOES_CHAT.includes(msg.reacao) ? msg.reacao : "",
    localId: msg.localId || `${criadoEm}_${normalizarTexto(usuario).slice(0, 18)}_${normalizarTexto(texto).slice(0, 18)}`
  };
}

function filtrarMensagensValidas(lista) {
  const diasHistorico = getDiasHistoricoChat();

  if (diasHistorico <= 0) return [];

  const limite = Date.now() - (diasHistorico * 24 * 60 * 60 * 1000);

  return (lista || [])
    .map(normalizarMensagemPersistida)
    .filter(msg => msg.texto && msg.criadoEm >= limite)
    .slice(-120);
}

function carregarHistoricoChatLocal() {
  try {
    if (getDiasHistoricoChat() <= 0) {
      mensagensChat = [];
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }

    const bruto = localStorage.getItem(CHAT_STORAGE_KEY);
    mensagensChat = filtrarMensagensValidas(bruto ? JSON.parse(bruto) : []);
    salvarHistoricoChatLocal();
  } catch (err) {
    mensagensChat = [];
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }
}

function salvarHistoricoChatLocal() {
  try {
    if (getDiasHistoricoChat() <= 0) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }

    mensagensChat = filtrarMensagensValidas(mensagensChat);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(mensagensChat));
  } catch (err) {
    console.warn("Nao foi possivel salvar o historico local do chat.", err);
  }
}

function alternarReacaoMensagem(localId, reacao) {
  if (!localId || !REACOES_CHAT.includes(reacao)) return;

  const mensagem = mensagensChat.find(msg => msg.localId === localId);
  if (!mensagem) return;

  mensagem.reacao = mensagem.reacao === reacao ? "" : reacao;
  salvarHistoricoChatLocal();
  renderChat();
}

function atualizarModoChat(modo, destinatario = "") {
  modoChatAtual = modo === "privado" ? "privado" : "global";

  if (destinatario) {
    destinatarioPrivadoChat = destinatario;
    chatPrivadoNaoLidas.delete(reduzirNome(destinatario));
    renderListaUsuariosOnline();
  }

  document.querySelectorAll(".online-chat-mode").forEach((botao) => {
    const ativo = botao.dataset.chatMode === modoChatAtual;
    botao.classList.toggle("active", ativo);

    if (botao.dataset.chatMode === "private") {
      botao.textContent = destinatarioPrivadoChat
        ? `Privado: ${reduzirNome(destinatarioPrivadoChat)}`
        : "Privado";
    }
  });

  const input = document.getElementById("online-chat-input");
  if (input) {
    input.placeholder = modoChatAtual === "privado"
      ? (destinatarioPrivadoChat ? `Mensagem privada para ${reduzirNome(destinatarioPrivadoChat)}...` : "Clique em um usuário online para conversa privada...")
      : "Mensagem rápida...";
  }

  if (painelEstaAberto()) {
    chatNaoLidas = 0;
    atualizarBadgeChat();
  }

  renderChat();
}

function limparEstadoChatOnline() {
  ultimaListaUsuarios = [];
  usuariosAtuais = [];
  mensagensChat = [];
  chatNaoLidas = 0;
  modoChatAtual = "global";
  destinatarioPrivadoChat = "";
  chatPrivadoNaoLidas = new Map();
  localStorage.removeItem(CHAT_STORAGE_KEY);

  const lista = document.getElementById("online-list");
  const count = document.getElementById("online-count");
  const popup = document.getElementById("online-popup");

  if (lista) lista.innerHTML = "";
  if (count) count.textContent = "0";
  if (popup) popup.classList.remove("show", "mention");

  atualizarBadgeChat();
  atualizarModoChat("global");
}

function renderChat() {
  const container = document.getElementById("online-chat-messages");
  if (!container) return;

  container.innerHTML = "";

  const meuNome = reduzirNome(getMeuNome());
  const conversa = mensagensChat.filter((msg) => {
    const tipo = msg.tipo || "global";

    if (tipo === "global") {
      return modoChatAtual === "global";
    }

    const remetente = reduzirNome(msg.usuario || "");
    const destino = reduzirNome(msg.destinatario || "");
    const privado = reduzirNome(destinatarioPrivadoChat);

    return modoChatAtual === "privado"
      && privado
      && ((remetente === meuNome && destino === privado) || (remetente === privado && destino === meuNome));
  });

  if (conversa.length === 0) {
    const empty = document.createElement("div");
    empty.className = "online-chat-empty";
    const diasHistorico = getDiasHistoricoChat();
    empty.textContent = modoChatAtual === "privado" && destinatarioPrivadoChat
      ? `Nenhuma mensagem privada com ${reduzirNome(destinatarioPrivadoChat)} nesta sessao.`
      : diasHistorico > 0
        ? `Mensagens ficam salvas neste navegador por ate ${diasHistorico} dias.`
        : "Historico do chat desativado neste navegador.";
    container.appendChild(empty);
    return;
  }

  conversa.forEach((msg) => {
    const item = document.createElement("div");
    item.className = "online-chat-msg";

    if (reduzirNome(msg.usuario || "") === meuNome) {
      item.classList.add("mine");
    }

    if ((msg.tipo || "global") === "privado") {
      item.classList.add("private");
    }

    const meta = document.createElement("div");
    meta.className = "online-chat-meta";

    const usuario = document.createElement("span");
    usuario.textContent = (msg.tipo || "global") === "privado"
      ? `${reduzirNome(msg.usuario || "Usuario")} -> ${reduzirNome(msg.destinatario || "Usuario")}`
      : reduzirNome(msg.usuario || "Usuario");

    const hora = document.createElement("span");
    hora.textContent = msg.hora || "";

    const texto = document.createElement("div");
    texto.textContent = msg.texto || "";

    meta.appendChild(usuario);
    meta.appendChild(hora);
    item.appendChild(meta);
    item.appendChild(texto);

    const reacoes = document.createElement("div");
    reacoes.className = "online-chat-reactions";

    REACOES_CHAT.forEach((reacao) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "online-chat-reaction";
      botao.dataset.reacao = reacao;
      botao.dataset.localId = msg.localId || "";
      botao.textContent = reacao;
      botao.title = `Reagir com ${reacao}`;

      if (msg.reacao === reacao) {
        botao.classList.add("active");
      }

      reacoes.appendChild(botao);
    });

    item.appendChild(reacoes);

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

  document.getElementById("online-chat")?.classList.add("active");
  document.getElementById("online-list")?.classList.add("active");

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

  if (consulta === null) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const encontrados = consulta.tipo === "#"
    ? colaboradoresChat
      .filter(colab => !consultaNormalizada || normalizarTexto(colab.nome).includes(consultaNormalizada))
      .map(colab => ({
        id: colab.id,
        nome: colab.nome,
        texto: colab.nome
      }))
      .slice(0, 5)
    : usuariosAtuais
      .filter(nome => !consultaNormalizada || normalizarTexto(nome).includes(consultaNormalizada))
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

  if (modoChatAtual === "privado" && !destinatarioPrivadoChat) {
    alert("Clique em um usuario online antes de enviar uma mensagem privada.");
    return false;
  }

  socket.send(JSON.stringify({
    acao: "mensagem_chat",
    tipo: modoChatAtual === "privado" ? "privado" : "global",
    destinatario: modoChatAtual === "privado" ? destinatarioPrivadoChat : "",
    usuario: getMeuNome(),
    texto
  }));

  return true;
}

export function receberMensagemChat(data) {
  const mensagemMinha = reduzirNome(data.usuario || "") === reduzirNome(getMeuNome());
  const mensagemGlobal = (data.tipo || "global") === "global";
  const globalSilenciado = mensagemGlobal && chatGlobalSilenciado();
  const meuNome = reduzirNome(getMeuNome());
  const remetente = reduzirNome(data.usuario || "");
  const destino = reduzirNome(data.destinatario || "");
  const privadoAtual = reduzirNome(destinatarioPrivadoChat);
  const mensagemVisivelAgora = (data.tipo || "global") === "global"
    ? modoChatAtual === "global"
    : modoChatAtual === "privado"
      && privadoAtual
      && ((remetente === meuNome && destino === privadoAtual) || (remetente === privadoAtual && destino === meuNome));

  mensagensChat.push(normalizarMensagemPersistida({
    tipo: data.tipo || "global",
    destinatario: data.destinatario || "",
    usuario: data.usuario,
    texto: data.texto,
    hora: data.hora,
    criadoEm: Date.now()
  }));

  if (mensagensChat.length > 80) {
    mensagensChat = mensagensChat.slice(-80);
  }

  salvarHistoricoChatLocal();

  if (!mensagemMinha && !globalSilenciado && (!chatEstaVisivel() || !mensagemVisivelAgora)) {
    chatNaoLidas += 1;
    atualizarBadgeChat();
  }

  if (!mensagemMinha && !globalSilenciado && !painelEstaAberto()) {
    notificarMensagemMinimizada(data);
  }

  if ((data.tipo || "global") === "privado" && !mensagemMinha && destino === meuNome && !mensagemVisivelAgora) {
    chatPrivadoNaoLidas.set(remetente, (chatPrivadoNaoLidas.get(remetente) || 0) + 1);
    renderListaUsuariosOnline();
  }

  if (!mensagemMinha && usuarioFoiMencionado(data.texto)) {
    notificarMencaoChat(data);
  }

  renderChat();
}

export function receberErroChat(data) {
  alert(data.mensagem || "Nao foi possivel enviar a mensagem.");
}

function initMiniChatOnline() {
  if (chatInicializado) return;
  chatInicializado = true;

  carregarHistoricoChatLocal();
  carregarColaboradoresChat().then(() => renderChat());
  renderEmoticonsChat();

  document.addEventListener("click", (event) => {
    if (event.target.closest("#online-chat-emoji")) {
      alternarEmoticonsChat();
      return;
    }

    const reacao = event.target.closest(".online-chat-reaction");
    if (reacao) {
      alternarReacaoMensagem(reacao.dataset.localId, reacao.dataset.reacao);
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

    const chatMode = event.target.closest(".online-chat-mode");
    if (chatMode) {
      atualizarModoChat(chatMode.dataset.chatMode === "private" ? "privado" : "global");
      return;
    }

    const user = event.target.closest(".online-user");
    if (user) {
      abrirAbaOnline("chat");
      atualizarModoChat("privado", user.dataset.nome);
      const input = document.getElementById("online-chat-input");
      if (input) {
        input.value = "";
        input.focus();
      }
      return;
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
document.addEventListener("chat-online:limpar-historico", () => {
  mensagensChat = [];
  localStorage.removeItem(CHAT_STORAGE_KEY);
  renderChat();
});
document.addEventListener("chat-online:visibilidade-alterada", atualizarBadgeChat);
document.addEventListener("preferencias-usuario:alteradas", () => {
  mensagensChat = filtrarMensagensValidas(mensagensChat);
  salvarHistoricoChatLocal();
  renderChat();
});
