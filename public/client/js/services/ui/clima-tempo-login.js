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
    setInterval(() => {

        if (Math.random() < 0.35) {
            createGlassDrop();
        }

    }, 800);


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


function createGlassDrop() {


    const form = document.querySelector(".painel_login");
    if(!form) return;
    
    const rect = form.getBoundingClientRect();

    const x = rect.left + Math.random() * rect.width - 10;
    const y = rect.top + 10;

    const size = Math.random()* 6 + 6;
    const drop = document.createElement("div");
    Object.assign(drop.style, {
        position: "fixed",
        top: y + "px",
        left: x + "px",
        width: size + "px",
        height: size * 1.4 + "px",
        borderRadius: "50% 50% 60% 60%",
        background: `
        radial-gradient(
            circle at 35% 30%,
            rgba(69, 74, 83, 0.23),
            rgba(75, 83, 97, 0.23) 55%,
            rgba(82, 90, 105, 0.25)
        )`,
        boxShadow: `
        0 0 2px rgba(68, 81, 100, 0.18),
        inset 0 0 1px rgba(82, 89, 104, 0.11)
        `,
        pointerEvents: "none",
        zIndex: "9999"
    });

    // rastro da gota
    const trail = document.createElement("div");

    Object.assign(trail.style, {
        position: "absolute",
        width: size * 1.4 + "px",
        height: size * 1.1 + "px",
        bottom: "95%",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(66, 70, 82, 0.36)",
        clipPath: "polygon(50% 0%, 80% 100%, 20% 100%)",
        filter: "blur(1px)",
        opacity: "0.6"
    });
    drop.appendChild(trail);

    document.body.appendChild(drop);

    const duration = Math.random() * 6000 + 5000;

    drop.animate([
        { transform: "translate(0px,0px)" },
        { transform: "translate(4px,40vh)" },
        { transform: "translate(-3px,80vh)" },
        { transform: `translate(2px,${window.innerHeight}px)` }
    ], {
        duration: duration,
        easing: "linear"
    });

    setTimeout(() => {
        drop.remove();
    }, duration - 6500);
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

        // camada aleatória
        const layer = Math.floor(Math.random() * 3) + 1;

        star.classList.add("parallax-star");
        star.dataset.layer = layer;

        Object.assign(star.style, {
            position: "absolute",
            width: layer === 3 ? "3px" : "2px",
            height: layer === 3 ? "3px" : "2px",
            background: "white",
            boxShadow: "0 0 6px white",
            left: Math.random() * 100 + "vw",
            top: Math.random() * 100 + "vh",
            opacity: Math.random()
        });

        container.appendChild(star);
    }

    createMoonGradient(); // escurece o fundo
    createMoon(); // 🌙 adiciona a lua
    initParallaxSky();
}


/* =========================================================
   🌙 LUA
========================================================= */
function createMoon() {


    if (document.getElementById("moon-night")) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.id = "moon-night";
    svg.setAttribute("width", "70");
    svg.setAttribute("height", "70");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.addEventListener("click", changeMoonPhase);
    svg.classList.add("parallax-moon");
    Object.assign(svg.style, {
        position: "fixed",
        top: "40px",
        right: "60px",
        pointerEvents: "auto",
        zIndex: "2",
        filter: "drop-shadow(0 0 10px rgba(255,255,200,0.7)) drop-shadow(0 0 20px rgba(255,255,200,0.4))"
    });

    svg.innerHTML = `
        <defs>

            <!-- gradiente da lua -->
            <radialGradient id="moon-grad">
                <stop offset="0%" stop-color="#fffad6"/>
                <stop offset="70%" stop-color="#f6f1c2"/>
                <stop offset="100%" stop-color="#d8cf9e"/>
            </radialGradient>

            <!-- máscara da meia lua -->
            <mask id="moon-mask">
                <rect width="100%" height="100%" fill="white"/>
                <circle cx="65" cy="50" r="40" fill="black"/>
            </mask>

        </defs>

        <!-- lua -->
        <circle
            cx="50"
            cy="50"
            r="40"
            fill="url(#moon-grad)"
            mask="url(#moon-mask)"
        />
    `;

    document.body.appendChild(svg);
}

let moonPhase = 0;

const moonPhases = [
    60,
    80,
    105,
    130,
];
function changeMoonPhase() {

    const maskCircle = document.querySelector("#moon-night mask circle");

    if (!maskCircle) return;

    moonPhase++;

    if (moonPhase >= moonPhases.length) {
        moonPhase = 0;
    }

    const newCX = moonPhases[moonPhase];

    // animação suave da fase da lua
    maskCircle.animate([
        { cx: maskCircle.getAttribute("cx") },
        { cx: newCX }
    ], {
        duration: 600,
        easing: "ease-in-out",
        fill: "forwards"
    });

    // aplica o valor final
    maskCircle.setAttribute("cx", newCX);
}

function initParallaxSky() {

    document.addEventListener("mousemove", (e) => {

        const x = (e.clientX / window.innerWidth - 0.5);
        const y = (e.clientY / window.innerHeight - 0.5);

        const stars = document.querySelectorAll(".parallax-star");

        stars.forEach(star => {

            const layer = Number(star.dataset.layer);

            let speed;

            if (layer === 1) speed = 4;   // distante
            if (layer === 2) speed = 8;   // médio
            if (layer === 3) speed = 14;  // próximo

            star.style.transform =
                `translate(${x * speed}px, ${y * speed}px)`;

        });

        const moon = document.querySelector(".parallax-moon");

        if (moon) {

            const moonSpeed = 1; // lua move bem pouco

            moon.style.transform =
                `translate(${x * moonSpeed}px, ${y * moonSpeed}px)`;
        }

    });
}



function createMoonGradient() {

    if (document.getElementById("moon-gradient")) return;

    const gradient = document.createElement("div");

    gradient.id = "moon-gradient";

    Object.assign(gradient.style, {
        position: "fixed",
        top: "0",
        right: "0",
        width: "1220px",
        height: "1020px",
        background: `
        radial-gradient(
            circle at top right,
            rgba(0,0,0,0.75) 0%,
            rgba(0,0,0,0.55) 25%,
            rgba(0,0,0,0.35) 50%,
            rgba(0,0,0,0.15) 70%,
            transparent 100%
        )
        `,
        pointerEvents: "none",
        zIndex: "1"
    });

    document.body.appendChild(gradient);
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