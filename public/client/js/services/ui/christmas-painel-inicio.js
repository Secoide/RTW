/* =========================================================
   🔊 CONTROLE DE ÁUDIO (AUTOPLAY SAFE)
========================================================= */


let santaAudioUnlocked = false;
let santaAudio = null;
let santaActive = false;
let stopSanta = false;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
        // 🔴 para tudo
        stopSanta = true;

        // remove Noel ativo
        const santa = document.querySelector(".santa-walk-wrapper");
        if (santa) santa.remove();

        // pausa som
        if (santaAudio) {
            santaAudio.pause();
            santaAudio.currentTime = 0;
        }
    } else {
        // 🟢 libera novamente
        stopSanta = false;
        santaActive = false; // 🔑 LIBERA O LOOP
    }
});


function unlockSantaAudio() {
    if (santaAudioUnlocked) return;

    santaAudio = new Audio("/sounds/merry_christmas.mp3");
    santaAudio.volume = 0.03;
    santaAudio.preload = "auto";

    santaAudioUnlocked = true;

    document.removeEventListener("click", unlockSantaAudio);
    document.removeEventListener("keydown", unlockSantaAudio);
    document.removeEventListener("touchstart", unlockSantaAudio);
}

// precisa ouvir MAIS eventos (mobile também)
document.addEventListener("click", unlockSantaAudio, { once: true });
document.addEventListener("keydown", unlockSantaAudio, { once: true });
document.addEventListener("touchstart", unlockSantaAudio, { once: true });


/* =========================================================
   🎅 Papai Noel caindo, pulando e andando
   - Direção baseada no canto mais próximo
   - Queda suave
   - Leve pulinho ao tocar a borda
========================================================= */

export function initSantaDropWalkWrapper() {
    const now = new Date();
    if (now.getMonth() !== 11) return;

    const AUDIO_LEAD_TIME = 1000;
    const CHECK_INTERVAL = 36000;
    const CHANCE =  0.01; // use 0.01 em produção

    setInterval(() => {
        if (document.visibilityState !== "visible") return;

        // 🔒 trava se já existe ou já foi agendado
        if (santaActive) return;

        if (Math.random() < CHANCE) {
            santaActive = true;

            if (santaAudioUnlocked && santaAudio && (Math.random() < 0.1)) {
                santaAudio.currentTime = 0;
                santaAudio.play().catch(() => { });
            }

            setTimeout(() => {
                if (stopSanta) {
                    santaActive = false;
                    return;
                }

                spawnSanta();
            }, AUDIO_LEAD_TIME);
        }
    }, CHECK_INTERVAL);
}



function spawnSanta() {

    if (stopSanta) return;
    santaActive = true;


    const container =
        document.querySelector("#conteudo") || document.body;

    const wrapper = document.createElement("div");
    wrapper.className = "santa-walk-wrapper";

    const santa = document.createElement("img");
    santa.src = "/img/santa_walk.gif";
    santa.className = "santa-walk";

    wrapper.appendChild(santa);
    container.appendChild(wrapper);

    /* ---------- POSIÇÃO X ---------- */
    const vw = window.innerWidth;

    const MARGIN = 180;          // distância mínima dos cantos
    const AVAILABLE_WIDTH = vw - MARGIN * 2;

    let x = MARGIN + Math.random() * AVAILABLE_WIDTH;
    wrapper.style.left = x + "px";

    /* ---------- DEFINE DIREÇÃO PELO CANTO MAIS PRÓXIMO ---------- */
    const direction = x < vw / 2 ? "left" : "right";

    if (direction === "left") {
        santa.style.transform = "scaleX(-1)";
    }
    /* ---------- QUEDA SUAVE ---------- */
    let y = -220;
    let velocity = 0;
    const gravity = 0.35;     // mais suave
    const targetY = -51;      // borda

    wrapper.style.top = y + "px";

    function fall() {
        if (stopSanta) return;
        // desacelera perto do alvo
        if (y > targetY - 20) {
            velocity *= 0.92;
        } else {
            velocity += gravity;
        }

        y += velocity;
        wrapper.style.top = y + "px";

        if (y < targetY) {
            requestAnimationFrame(fall);
        } else {
            wrapper.style.top = targetY + "px";
            bounce();
        }
    }

    /* ---------- PULINHO ---------- */
    function bounce() {
        if (stopSanta) return;
        let bounceVelocity = -3; // força do pulo
        let bounceY = targetY;

        function jump() {
            bounceVelocity += gravity;
            bounceY += bounceVelocity;
            wrapper.style.top = bounceY + "px";

            if (bounceY < targetY + 2) {
                requestAnimationFrame(jump);
            } else {
                wrapper.style.top = targetY + "px";
                walk();
            }
        }

        requestAnimationFrame(jump);
    }

    /* ---------- ANDAR ---------- */
    function walk() {
        if (stopSanta) return;
        const speed = 0.6;
        const limit =
            direction === "right"
                ? window.innerWidth + 80
                : -160;

        function step() {
            x += direction === "right" ? speed : -speed;
            wrapper.style.left = x + "px";

            if (
                (direction === "right" && x < limit) ||
                (direction === "left" && x > limit)
            ) {
                requestAnimationFrame(step);
            } else {
                wrapper.remove();
                if (santaAudio) {
                    santaAudio.pause();
                    santaAudio.currentTime = 0;
                }
                santaActive = false;
            }
        }

        requestAnimationFrame(step);
    }

    requestAnimationFrame(fall);
}
