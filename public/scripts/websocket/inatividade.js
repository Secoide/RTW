
let tempoLimite = 30 * 60 * 1000; // 10 minutos em ms
let timerInatividade;

function resetarTimer() {
    clearTimeout(timerInatividade);
    timerInatividade = setTimeout(() => {
        Swal.fire({
            icon: "info",
            title: "Alguém ai?",
            text: "Você foi desconectado por inatividade!",
            confirmButtonText: "Ok"
        }).then((result) => {
            window.location.href = "login";
        });
    }, tempoLimite);
};

// Eventos que resetam o contador
window.onload = resetarTimer;
document.onmousemove = resetarTimer;
document.onkeypress = resetarTimer;
document.onclick = resetarTimer;
document.onscroll = resetarTimer;
document.ontouchstart = resetarTimer; // toque em dispositivos móveis
