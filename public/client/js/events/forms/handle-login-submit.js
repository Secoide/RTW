import { login } from "../../services/api/auth-service.js";
import { salvarSessao } from "../../state/session.js";

const LOGIN_LEMBRADO_KEY = "connectpear_login_lembrado";
const ULTIMA_PAGINA_MENU_KEY = "connectpear_ultima_pagina_menu";
const MENSAGEM_SEM_EMPRESA = "Seu usuário ainda não está associado a uma empresa.";

export function initLoginForm() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  const form = document.getElementById("formLogin");
  if (!form) return;

  initLoginHelpers();
  initAssociationNotice();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAssociationNotice();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      Toast.fire({
        icon: "warning",
        theme: "dark",
        title: "Preencha todos os campos."
      });
      return;
    }

    try {
      const res = await login(username, password);

      if (res.sucesso) {
        salvarLoginLembrado(username);
        salvarSessao(res.usuario);
        limparUltimaPaginaAposLogin();
        window.location.href = "/carregamento";
        return;
      }

      if (isErroSemEmpresa(res.mensagem)) {
        mostrarAssociationNotice();
        return;
      }

      Toast.fire({
        icon: "warning",
        theme: "dark",
        title: res.mensagem || "Usuario/e-mail ou senha incorretos."
      });
    } catch (err) {
      console.error("Erro no login:", err);
      Toast.fire({
        icon: "error",
        theme: "dark",
        title: "Erro de comunicacao com o servidor."
      });
    }
  });

  $(".esquecisenha").on("click", solicitarRecuperacaoSenha);

  $(".semconta").on("click", function (e) {
    e.preventDefault();

    Swal.fire({
      icon: "info",
      theme: "dark",
      title: "Acesso a conta",
      html: `
        <p>Entre em contato com o administrador da sua empresa.</p>
        <p>Informe seu nome, usuario e empresa vinculada.</p>
      `,
      confirmButtonText: "OK"
    });
  });
}

function isErroSemEmpresa(mensagem = "") {
  return String(mensagem).includes(MENSAGEM_SEM_EMPRESA);
}

function limparUltimaPaginaAposLogin() {
  try {
    localStorage.removeItem(ULTIMA_PAGINA_MENU_KEY);
  } catch {
    // Se o navegador bloquear o localStorage, o login continua normalmente.
  }
}

function initAssociationNotice() {
  document.getElementById("loginAssociationOk")?.addEventListener("click", esconderAssociationNotice);
}

function mostrarAssociationNotice() {
  const notice = document.getElementById("loginAssociationNotice");
  if (!notice) return;

  notice.hidden = false;
  notice.classList.add("show");
}

function esconderAssociationNotice() {
  const notice = document.getElementById("loginAssociationNotice");
  if (!notice) return;

  notice.classList.remove("show");
  notice.hidden = true;
}

function initLoginHelpers() {
  preencherLoginLembrado();
  initPasswordToggle();
  initCapsLockWarning();
  atualizarStatusServidor();
}

function preencherLoginLembrado() {
  const username = document.getElementById("username");
  const checkbox = document.getElementById("lembrarLogin");
  if (!username || !checkbox) return;

  const loginLembrado = localStorage.getItem(LOGIN_LEMBRADO_KEY);
  if (loginLembrado) {
    username.value = loginLembrado;
    checkbox.checked = true;
  }

  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) {
      localStorage.removeItem(LOGIN_LEMBRADO_KEY);
    }
  });
}

function salvarLoginLembrado(username) {
  const checkbox = document.getElementById("lembrarLogin");
  if (!checkbox) return;

  if (checkbox.checked) {
    localStorage.setItem(LOGIN_LEMBRADO_KEY, username);
    return;
  }

  localStorage.removeItem(LOGIN_LEMBRADO_KEY);
}

function initPasswordToggle() {
  const password = document.getElementById("password");
  const button = document.getElementById("togglePassword");
  if (!password || !button) return;

  button.addEventListener("click", () => {
    const visivel = password.type === "text";
    password.type = visivel ? "password" : "text";
    button.title = visivel ? "Mostrar senha" : "Ocultar senha";
    button.setAttribute("aria-label", button.title);
    button.innerHTML = `<i class="fa-solid ${visivel ? "fa-eye" : "fa-eye-slash"}"></i>`;
    password.focus();
  });
}

function initCapsLockWarning() {
  const password = document.getElementById("password");
  const aviso = document.getElementById("capsLockAviso");
  if (!password || !aviso) return;

  const atualizar = (event) => {
    const ativo = event.getModifierState && event.getModifierState("CapsLock");
    aviso.classList.toggle("show", !!ativo);
  };

  password.addEventListener("keydown", atualizar);
  password.addEventListener("keyup", atualizar);
  password.addEventListener("blur", () => aviso.classList.remove("show"));
}

async function atualizarStatusServidor() {
  await Promise.all([
    atualizarIndicadorStatus("loginServerStatus", "/health", "Servidor ativo", "Servidor indisponivel"),
    atualizarIndicadorStatus("loginDatabaseStatus", "/health/db", "Banco conectado", "Banco desconectado")
  ]);
}

async function atualizarIndicadorStatus(elementId, endpoint, textoOk, textoErro) {
  const status = document.getElementById(elementId);
  if (!status) return;

  const dot = status.querySelector(".status-dot");
  const texto = status.querySelector("span:last-child");

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(textoErro);

    dot.className = "status-dot online";
    texto.textContent = textoOk;
  } catch (err) {
    dot.className = "status-dot offline";
    texto.textContent = textoErro;
  }
}

async function solicitarRecuperacaoSenha(e) {
  e.preventDefault();

  const idUser = document.getElementById("username").value.trim();
  const result = await Swal.fire({
    title: "Recuperar acesso",
    theme: "dark",
    html: `
      <div class="recuperacao-login">
        <p>Informe o e-mail cadastrado. Se os dados estiverem corretos, enviaremos um link seguro para redefinir sua senha.</p>
        <div class="recuperacao-passos">
          <span>1. Conferimos o usuario ou e-mail informado no campo de login.</span>
          <span>2. Enviamos o link para o e-mail cadastrado.</span>
          <span>3. O link expira em 10 minutos por seguranca.</span>
        </div>
      </div>
    `,
    input: "email",
    inputPlaceholder: "seuemail@provedor.com",
    showCancelButton: true,
    confirmButtonText: "Enviar link",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value) return "Digite um e-mail.";
      const regex = /\S+@\S+\.\S+/;
      if (!regex.test(value)) return "Digite um e-mail valido.";
      return undefined;
    }
  });

  if (!result.value) return;

  Swal.fire({
    title: "Enviando link...",
    text: "Aguarde um instante.",
    theme: "dark",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const response = await fetch("/api/auth/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idColab: idUser, email: result.value })
    });

    if (!response.ok) throw new Error("Falha ao solicitar recuperacao.");

    Swal.fire({
      icon: "success",
      theme: "dark",
      title: "Solicitacao enviada",
      html: `
        <p style="font-size:14px;">
          Se o usuario e o e-mail estiverem cadastrados, voce recebera um link para redefinir a senha.
        </p>
        <p style="font-size:13px; color:#aaa;">
          Verifique tambem a caixa de spam. O link e valido por <b>10 minutos</b>.
        </p>
      `
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Nao foi possivel enviar",
      text: "Tente novamente em alguns minutos ou contate o administrador da empresa."
    });
  }
}
