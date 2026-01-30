/* =========================================================
   🔊 CONTROLE DE ÁUDIO (AUTOPLAY SAFE)
========================================================= */
const SANTA_TEST_MODE = false; //modo TESTE


const BASE_CHANCE = SANTA_TEST_MODE ? 0.4 : 0.010;
const MAX_CHANCE = SANTA_TEST_MODE ? 1.0 : 0.1;
const CHECK_INTERVAL = SANTA_TEST_MODE ? 5000 : 300000; // 5s ou 5min
const ACTIVE_STEP_TIME = SANTA_TEST_MODE ? 5000 : 300000; // 5s ou 5min
const AUDIO_LEAD_TIME = 1000;

const ACTIVE_TIME_KEY = "santa-active-time";


let santaAudioUnlocked = false;
let santaAudio = null;
let santaActive = false;
let stopSanta = false;

let santaChance = BASE_CHANCE;
let activeTime = Number(localStorage.getItem(ACTIVE_TIME_KEY)) || 0;
let lastActiveTick = Date.now();

window.aparecerPapaiNoel = () => {
    // 🛑 evita duplicar
    if (santaActive) {
        return "🎅 Papai Noel já está ativo!";
    }

    // 🔓 ignora regras de dia / mês / localStorage
    stopSanta = false;
    santaActive = true;

    // 🎧 áudio
    if (santaAudioUnlocked && santaAudio) {
        santaAudio.currentTime = 0;
        santaAudio.play().catch(() => {});
    }

    // ⏱️ DEBUG de tempo e chance (informativo)
    const steps = Math.floor(activeTime / ACTIVE_STEP_TIME);
    const chanceAtual = Math.min(
        BASE_CHANCE + steps * BASE_CHANCE,
        MAX_CHANCE
    );

    console.log(
        '\n🎅 oh oh oh!\n' +
        `⏱️ Tempo acumulado: ${formatTime(activeTime)}\n` +
        `🔥 Chance teórica: ${(chanceAtual * 100).toFixed(2)}%`
    );

    // 🎅 SPAWN FORÇADO
    spawnSanta();
    console.log('Papail Noel ja apareceu antes? ');
    return (santaAlreadyAppearedToday() ? 'Sim' : 'Não');
};

window.resetarPapaiNoel = () => {
    const key = todayKey();

    localStorage.setItem(key, "false");

    if (santaAudio) {
        santaAudio.pause();
        santaAudio.currentTime = 0;
    }

    santaAudioUnlocked = false;
    santaAudio = null;

    document.querySelectorAll(
        '.santa, .papai-noel, .santa-container, .santa-wrapper'
    ).forEach(el => el.remove());

    santaActive = false;
    stopSanta = false;

    // ⏱️ reset progressão
    activeTime = 0;
    santaChance = BASE_CHANCE;
    localStorage.removeItem(ACTIVE_TIME_KEY);

    return "🎄 Papai Noel resetado completamente!";
};

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')}`;
}

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
function todayKey() {
    const d = new Date();
    return `santa-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function santaAlreadyAppearedToday() {
    return localStorage.getItem(todayKey()) === "true";
}

function markSantaAsAppearedToday() {
    localStorage.setItem(todayKey(), "true");
}

setInterval(() => {
    const now = Date.now();

    if (document.visibilityState === "visible") {
        const delta = now - lastActiveTick;
        activeTime += delta;

        // 💾 salva no localStorage
        localStorage.setItem(ACTIVE_TIME_KEY, activeTime.toString());
    }

    lastActiveTick = now;
}, 1000);


export function initSantaDropWalkWrapper() {
    const now = new Date();
    if (now.getMonth() !== 11) return;

    santaChance = BASE_CHANCE;

    setInterval(() => {
        if (document.visibilityState !== "visible") return;
        if (santaActive) return;
        if (santaAlreadyAppearedToday()) return;

        // 📈 chance progressiva baseada em tempo ativo real
        const steps = Math.floor(activeTime / ACTIVE_STEP_TIME);
        santaChance = Math.min(
            BASE_CHANCE + steps * BASE_CHANCE,
            MAX_CHANCE
        );

        if (Math.random() < santaChance) {
            santaActive = true;
            activeTime = 0;
            santaChance = BASE_CHANCE;

            markSantaAsAppearedToday();

            if (santaAudioUnlocked && santaAudio && Math.random() < 0.5) {
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
