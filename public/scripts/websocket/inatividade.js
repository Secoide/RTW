
let tempoLimite = 10 * 60 * 1000; // 10 minutos em ms
let timerInatividade;

function usuarioLogado() {
    return !!sessionStorage.getItem("id_usuario");
}

function resetarTimer() {
    if (!usuarioLogado()) return;

    clearTimeout(timerInatividade);
    timerInatividade = setTimeout(() => {
        Swal.fire({
            icon: "info",
            title: "Sessão expirada",
            text: "Você foi desconectado por inatividade",
            confirmButtonText: "Ok"
        }).then(async () => {

            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });

            //localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
        });
    }, tempoLimite);
}


// Eventos que resetam o contador
window.onload = resetarTimer;
document.onmousemove = resetarTimer;
document.onkeypress = resetarTimer;
document.onclick = resetarTimer;
document.onscroll = resetarTimer;
document.ontouchstart = resetarTimer; // toque em dispositivos móveis
