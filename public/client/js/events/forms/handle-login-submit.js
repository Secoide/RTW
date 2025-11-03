import { login } from "../../services/api/auth-service.js";
import { salvarSessao } from "../../state/session.js";
import { conectarSocket } from "../../services/sockets/socket-service.js";

export function initLoginForm() {
  const form = document.getElementById("formLogin");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🔑 impede o navegador de usar GET com query string

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const res = await login(username, password); // chama auth-service

      if (res.sucesso) {
        salvarSessao(res.usuario);
        window.location.href = "/carregamento";
      } else {
        alert(res.mensagem || "Usuário ou senha incorretos.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      next(err);
    }
  });
}
