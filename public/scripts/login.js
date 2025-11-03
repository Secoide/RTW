import { conectarSocket, getSocket } from "../services/sockets/socket-service.js";


let meuNome = '';
document.addEventListener("DOMContentLoaded", () => {
    meuNome = sessionStorage.getItem("nome_usuario");
    conectarSocket(meuNome); // reusa o mesmo socket global
});


function salvarSessao(usuario) {
    localStorage.setItem("nome_usuario", usuario.nome);
    sessionStorage.setItem("id_usuario", usuario.id);
    sessionStorage.setItem("nome_usuario", usuario.nome);
    sessionStorage.setItem("nivel_acesso", usuario.nivel);
    meuNome = usuario.nome;
}

function notificarUsuarioOnline() {
    const socket = getSocket(); // ✅ obtém o mesmo socket global
    if (!socket) return console.warn("⚠️ Socket não inicializado ainda.");

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            acao: 'usuario_online',
            nome: meuNome
        }));
    } else {
        socket.addEventListener('open', () => notificarUsuarioOnline(), { once: true });
    }
}

function tratarErroLogin(mensagem = 'Erro ao logar. Tente novamente.') {
    alert(mensagem);
}

function redirecionarAposLogin() {
    window.location.href = '/client/pages/inicio';
}

function validarCampos() {
    const usuario = $('#username').val().trim();
    const senha = $('#password').val().trim();
    if (!usuario || !senha) {
        alert('Preencha todos os campos.');
        return false;
    }
    return true;
}

function enviarLogin(formData) {
    $.ajax({
        url: '/login',
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function (res) {
            if (res.sucesso) {
                $('#formLogin')[0].reset();
                salvarSessao(res.usuario);
                notificarUsuarioOnline();
                redirecionarAposLogin();
            } else {
                tratarErroLogin(res.mensagem);
            }
        },
        error: () => tratarErroLogin()
    });
}

$(document).ready(() => {
    $('#formLogin').on('submit', function (e) {
        e.preventDefault();
        if (!validarCampos()) return;
        const formData = {
            username: $('#username').val(),
            password: $('#password').val()
        };
        enviarLogin(formData);
    });
});
