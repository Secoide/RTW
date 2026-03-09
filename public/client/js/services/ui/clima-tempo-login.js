/* =========================================================
   WEATHER EFFECTS ENGINE
   - Tudo em um único arquivo
   - snow-layer fica exclusivo para o Natal
========================================================= */

export function startWeatherEffects(mode = "auto") {

    const now = new Date();
    const hour = now.getHours();

    if (mode === "auto") {

        const r = Math.random();

        if (r < 0.25) {
            rainEffect();
        } else if (r < 0.40) {
            fogEffect();
        } else if (hour >= 19 || hour <= 5) {
            starsEffect();
        } else {
            sunEffect();
        }

    } else {

        switch (mode) {

            case "rain":
                rainEffect();
                break;

            case "fog":
                fogEffect();
                break;

            case "stars":
                starsEffect();
                break;

            case "sun":
                sunEffect();
                break;

        }

    }

}

/* =========================================================
   🌧️ CHUVA
========================================================= */

let lightningRunning = false;

function rainEffect() {

    const container = createLayer("rain-layer");

    const wind = -8 + Math.random() * 16;
    const rainInterval = 45;

    setInterval(() => {

        const drop = document.createElement("span");

        Object.assign(drop.style, {
            position: "absolute",
            top: "-20px",
            width: "2px",
            height: "18px",
            background: "rgba(167, 220, 255, 0.26)",
            left: Math.random() * 100 + "vw",
            opacity: "0.9",
            transform: `rotate(${wind}deg)`,
            pointerEvents: "none"
        });

        const duration = 700 + Math.random() * 300;

        drop.animate(
            [
                { transform: `translate(0,-20px) rotate(${wind}deg)` },
                { transform: `translate(${wind * 6}px,100vh) rotate(${wind}deg)` }
            ],
            {
                duration,
                easing: "linear"
            }
        );

        container.appendChild(drop);

        /* 💧 respingo no chão */
        setTimeout(() => {

            const rect = drop.getBoundingClientRect();

            const splash = document.createElement("div");

            Object.assign(splash.style, {
                position: "fixed",
                bottom: "0px",
                left: rect.left + "px",
                width: "8px",
                height: "3px",
                background: "rgba(167, 207, 255, 0.42)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: "3"
            });

            document.body.appendChild(splash);

            splash.animate(
                [
                    { transform: "scale(0.5)", opacity: 0.9 },
                    { transform: "scale(2)", opacity: 0 }
                ],
                {
                    duration: 250,
                    easing: "ease-out"
                }
            );

            setTimeout(() => splash.remove(), 250);

        }, duration - 50);

        setTimeout(() => drop.remove(), duration);

    }, rainInterval);

    if (!lightningRunning) {
        lightningRunning = true;
        lightningPremium();
    }

}

/* =========================================================
   ⚡ RELÂMPAGOS
========================================================= */

function lightningPremium() {

    function flash(intensity = 0.5) {

        const lightning = document.createElement("div");

        Object.assign(lightning.style, {
            position: "fixed",
            inset: "0",
            background: "white",
            opacity: intensity,
            pointerEvents: "none",
            zIndex: "3",
            mixBlendMode: "screen"
        });

        document.body.appendChild(lightning);

        setTimeout(() => lightning.remove(), 80);

    }

    setInterval(() => {

        const r = Math.random();

        if (r < 0.11) {

            // ⚡ raio visível
            if (Math.random() < 0.6) {
                spawnLightningBolt();
                setTimeout(() => flash(0.45), 20);
            } else {
                flash(0.45);
            }

            /* ⚡ clarão duplo */
            if (Math.random() < 0.35) {
                setTimeout(() => flash(0.35), 120);
            }

            /* ⚡ clarão triplo raro */
            if (Math.random() < 0.15) {
                setTimeout(() => flash(0.25), 220);
            }

        }

    }, 3000 + Math.random() * 4000);

}


function spawnLightningBolt() {

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.setAttribute("width", "200");
    svg.setAttribute("height", "400");

    Object.assign(svg.style, {
        position: "fixed",
        top: "0",
        left: Math.random() * window.innerWidth + "px",
        pointerEvents: "none",
        zIndex: "4"
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const bolt = `
        M100 0
        L80 120
        L120 120
        L90 260
        L140 260
        L60 400
    `;

    path.setAttribute("d", bolt);

    path.setAttribute("stroke", "#fcf7dd");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("fill", "none");
    path.style.filter = `
drop-shadow(0 0 6px #fcf2c4)
drop-shadow(0 0 12px #fff1a0)
drop-shadow(0 0 20px #fffbdf)
`;
    svg.appendChild(path);

    document.body.appendChild(svg);

    svg.animate(
        [
            { opacity: 1 },
            { opacity: 0 }
        ],
        {
            duration: 180,
            easing: "ease-out"
        }
    );

    setTimeout(() => svg.remove(), 200);

}

/* =========================================================
   🌫️ NEBLINA
========================================================= */

function fogEffect() {

    const fog = createLayer("fog-layer");

    Object.assign(fog.style, {
        backdropFilter: "blur(5px)",
        background: "rgba(200,200,200,0.15)"
    });

}

/* =========================================================
   ✨ ESTRELAS
========================================================= */

function starsEffect() {

    const container = createLayer("stars-layer");

    for (let i = 0; i < 80; i++) {

        const star = document.createElement("span");

        Object.assign(star.style, {
            position: "absolute",
            width: "2px",
            height: "2px",
            background: "white",
            boxShadow: "0 0 6px white",
            left: Math.random() * 100 + "vw",
            top: Math.random() * 100 + "vh",
            opacity: Math.random()
        });

        container.appendChild(star);

    }

}

/* =========================================================
   ☀️ SOL
========================================================= */

function sunEffect() {

    const glow = document.createElement("div");

    Object.assign(glow.style, {
        position: "fixed",
        top: "-200px",
        right: "-200px",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle,#ffd966,transparent 70%)",
        pointerEvents: "none",
        zIndex: "1"
    });

    document.body.appendChild(glow);

}

/* =========================================================
   🧱 CRIAR CAMADA
========================================================= */

function createLayer(id) {

    let layer = document.getElementById(id);

    if (layer) return layer;

    layer = document.createElement("div");

    layer.id = id;

    Object.assign(layer.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: "1"
    });

    document.body.appendChild(layer);

    return layer;

}