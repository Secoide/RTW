import { login } from "../../services/api/auth-service.js";
import { salvarSessao } from "../../state/session.js";

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🔑 impede o navegador de usar GET com query string

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      Toast.fire({
        icon: "warning",
        theme: 'dark',
        title: "Preencha todos os campos."
      });
      return;
    }

    try {
      const res = await login(username, password); // chama auth-service

      if (res.sucesso) {
        salvarSessao(res.usuario);
        window.location.href = "/carregamento";
      } else {
        Toast.fire({
          icon: "warning",
          theme: 'dark',
          title: res.mensagem || "Usuário ou senha incorretos."
        });
      }
    } catch (err) {
      console.error("Erro no login:", err);
      Toast.fire({
        icon: "error",
        title: "Erro de comunicação com o servidor."
      });
    }
  });

  $(".esquecisenha").on("click", function (e) {
    e.preventDefault();

    const idUser = document.getElementById("username").value.trim();
    Swal.fire({
      title: "Recuperar senha",
      html: `
            <p style="font-size:14px; margin-bottom:10px;">
                Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.
            </p>
            <p style="font-size:13px; color:#999; margin-bottom:5px;">
                Digite seu e-mail cadastrado:
            </p>
        `,
      input: "email",
      inputPlaceholder: "seuemail@provedor.com",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Digite um e-mail.";
        const regex = /\S+@\S+\.\S+/;
        if (!regex.test(value)) return "Digite um e-mail válido.";
      }
    }).then(result => {
      if (!result.value) return;

      Swal.fire({
        title: "Enviando...",
        text: "Aguarde um instante.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      $.ajax({
        url: "/api/auth/recuperar-senha",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ idColab: idUser, email: result.value }),
        success: () => {
          Swal.fire({
            icon: "success",
            title: "E-mail enviado!",
            html: `
                        <p style="font-size:14px;">
                            Se o e-mail informado estiver cadastrado, você receberá um link para redefinição de senha.
                        </p>
                        <p style="font-size:13px; color:#888;">
                            O link é válido por <b>10 minutos</b>.
                        </p>
                    `
          });
        },
        error: () => {
          Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível enviar o e-mail. Tente novamente mais tarde."
          });
        }
      });
    });
  });

  $(".semconta").on("click", function (e) {
    e.preventDefault();

    Swal.fire({
      icon: "info",
      title: "Atenção",
      html: `
            <p>Entre em contato com o setor de <b>RH</b>.</p>
            <p>E-mail: <b>rh@rtwengenharia.com.br</b></p>
        `,
      confirmButtonText: "OK"
    });
  });

}
