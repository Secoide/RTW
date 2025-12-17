


export function initChristmasIcons() {
    const now = new Date();
    const month = now.getMonth(); // 11 = dezembro
    const day = now.getDate();
    if (month !== 11 || day > 26) return;

    initSnow();
    initSantaHatsWrap();
}

function initSnow() {
    const container = document.getElementById("snow-layer");
    if (!container) return;

    let snowRunning = true;

    // 👁️ controle de visibilidade
    document.addEventListener("visibilitychange", () => {
        snowRunning = document.visibilityState === "visible";
    });

    const specialIcons = ["🎁", "⭐", "🔔", "🌟", "🎀", "✨", "🎅🏼"];

    const snowInterval = setInterval(() => {
        if (!snowRunning) return;

        const flake = document.createElement("span");
        flake.classList.add("snowflake");

        const isSpecial = Math.random() < 0.02;
        flake.innerText = isSpecial
            ? specialIcons[Math.floor(Math.random() * specialIcons.length)]
            : "❄️";

        flake.style.left = Math.random() * 100 + "vw";
        flake.style.top = "-10px";
        flake.style.fontSize = (10 + Math.random() * 6) + "px";
        flake.style.animationDuration = (6 + Math.random() * 4) + "s";

        container.appendChild(flake);

        setTimeout(() => flake.remove(), 12000);
    }, 900);
}

function initSantaHatsWrap() {

    const painel = document.querySelector(".painel_login");
    if (!painel) return;

    // evita duplicar
    if (document.querySelector(".toca-natal-frente")) return;

    const parent = painel.parentElement;
    parent.style.position = "relative";
    painel.style.position = "relative";

    /* 🎅 TOCA DE FUNDO (FORA DO PAINEL) */
    const tocaFundo = document.createElement("img");
    tocaFundo.src = "/img/toca_natal_fundos.png";
    tocaFundo.alt = "Toca de Natal Fundo";
    tocaFundo.className = "toca-natal-fundo";

    Object.assign(tocaFundo.style, {
        position: "absolute",
        top: "calc(50% - 258px)",
        left: "calc(50% - 215px)",
        width: "190px",
        transform: "rotate(-22deg)",
        zIndex: "1",
        pointerEvents: "none"
    });

    /* 🎅 TOCA DE FRENTE (DENTRO DO PAINEL) */
    const tocaFrente = document.createElement("img");
    tocaFrente.src = "/img/toca_natal_frente.png";
    tocaFrente.alt = "Toca de Natal Frente";
    tocaFrente.className = "toca-natal-frente";

    Object.assign(tocaFrente.style, {
        position: "absolute",
        top: "-60px",
        left: "-75px",
        width: "200px",
        transform: "rotate(-14deg)",
        zIndex: "20",
        pointerEvents: "none",
        filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.35))"
    });

    // 🔑 adiciona a de fundo ANTES do painel
    parent.insertBefore(tocaFundo, painel);

    // adiciona a da frente DENTRO do painel
    painel.appendChild(tocaFrente);
}


export function initNewYearFireworks() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    const isNewYear =
        (month === 11 && day >= 31) ||
        (month === 0 && day <= 10);

    if (!isNewYear) return;

    /* 🔒 CONTROLE DE EXECUÇÃO */
    let fireworksRunning = true;

    /* 👁️ CONTROLE DE VISIBILIDADE DA ABA */
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") {
            fireworksRunning = false;
        } else {
            fireworksRunning = true;
            loop(); // 🔁 reinicia limpo ao voltar
        }
    });

    const coloramarelo = ["#ffffff", "#f5d76e", "#ffd700"];
    const colorvermelho = ["#ffd6d6ff", "#f56e6eff", "#ff0000ff"];
    const colorverde = ["#e4ffd7ff", "#a6ff7dff", "#73ff00ff"];
    const colors = [coloramarelo, colorvermelho, coloramarelo, coloramarelo, coloramarelo, coloramarelo, coloramarelo, coloramarelo, coloramarelo, coloramarelo, colorverde];

    function launchNormalFirework() {
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 10;
        const peakY = 150 + Math.random() * 200;
        const duration = 900;

        const rocket = document.createElement("div");
        rocket.style.position = "fixed";
        rocket.innerText = "|";
        rocket.style.fontSize = "12px";
        rocket.style.fontWeight = "800";
        rocket.style.color = '#c2c0aea6';
        rocket.style.left = startX + "px";
        rocket.style.top = startY + "px";
        rocket.style.zIndex = "9999";
        rocket.style.pointerEvents = "none";

        document.body.appendChild(rocket);

        let startTime = null;

        function animateRocket(time) {
            if (!fireworksRunning) {
                rocket.remove();
                return;
            }
            if (!startTime) startTime = time;

            const progress = Math.min((time - startTime) / duration, 1);
            const currentY = startY + (peakY - startY) * progress;

            rocket.style.transform =
                `translateY(${currentY - startY}px)`;

            if (progress < 1) {
                requestAnimationFrame(animateRocket);
            } else {
                rocket.remove();

                const isCascade = Math.random() < 0.2;
                explode(startX, peakY, isCascade);
            }
        }

        requestAnimationFrame(animateRocket);
    }


    function launchPeacockFirework() {
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 10;
        const peakY = 140 + Math.random() * 180;

        const tilt = (Math.random() - 0.5) * 160;
        const duration = 1400; // subida mais lenta

        const rocket = document.createElement("div");
        rocket.style.position = "fixed";
        rocket.innerText = "⚪";
        rocket.style.fontSize = "5px";
        rocket.style.zIndex = "9999";
        rocket.style.pointerEvents = "none";
        rocket.style.left = startX + "px";
        rocket.style.top = startY + "px";

        document.body.appendChild(rocket);

        const startTime = performance.now();

        let finished = false;

        function animateRocket(time) {
            if (!fireworksRunning) {
                rocket.remove();
                return;
            }
            if (!startTime) startTime = time;

            const progress = Math.min((time - startTime) / duration, 1);

            const currentX = startX + tilt * progress;
            const currentY = startY + (peakY - startY) * progress;

            rocket.style.transform =
                `translate(${currentX - startX}px, ${currentY - startY}px)`;

            // ✨ FAÍSCAS DO RABO (somente enquanto sobe)
            if (!finished && Math.random() < 0.5) {
                const spark = document.createElement("span");
                spark.innerText = "✨";
                spark.style.position = "fixed";
                spark.style.left = currentX + "px";
                spark.style.top = currentY + "px";
                spark.style.fontSize = "7px";
                spark.style.opacity = "0.8";
                spark.style.color = "#ffd700";
                spark.style.zIndex = "9998";
                spark.style.pointerEvents = "none";
                spark.style.transition = "opacity 700ms linear";

                document.body.appendChild(spark);
                requestAnimationFrame(() => spark.style.opacity = "0");
                setTimeout(() => spark.remove(), 800);
            }

            if (progress < 1) {
                requestAnimationFrame(animateRocket);
            } else if (!finished) {
                finished = true;

                // ❌ remove foguete SEMPRE
                rocket.remove();

                // 🔥 decide se explode ou não
                if (Math.random() < 0.2) {
                    const x = Math.random();
                    if (x < 0.01) {
                        explodeArcoIris(currentX, currentY);
                    } else if (x < 0.2) {
                        explodePeacockDoubleRing(currentX, currentY);
                    } else if (x < 0.8) {
                        explodePeacock(currentX, currentY);
                    }
                }
                // else: não explode, termina limpo
            }
        }


        requestAnimationFrame(animateRocket);
    }

    function launchArcoiresFirework() {
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 10;
        const peakY = 140 + Math.random() * 180;

        const tilt = (Math.random() - 0.5) * 160;
        const duration = 1400; // subida mais lenta

        const rocket = document.createElement("div");
        rocket.style.position = "fixed";
        rocket.innerText = "⚪";
        rocket.style.fontSize = "5px";
        rocket.style.zIndex = "9999";
        rocket.style.pointerEvents = "none";
        rocket.style.left = startX + "px";
        rocket.style.top = startY + "px";

        document.body.appendChild(rocket);

        const startTime = performance.now();

        let finished = false;

        function animateRocket(time) {
            if (!fireworksRunning) {
                rocket.remove();
                return;
            }
            if (!startTime) startTime = time;

            const progress = Math.min((time - startTime) / duration, 1);

            const currentX = startX + tilt * progress;
            const currentY = startY + (peakY - startY) * progress;

            rocket.style.transform =
                `translate(${currentX - startX}px, ${currentY - startY}px)`;

            const coresIcon = ['⚪','🟡','🟠','🔴','🟢','🔵','⚫','🟣','🟤'];
            
            // ✨ FAÍSCAS DO RABO (somente enquanto sobe)
            if (!finished && Math.random() < 0.7) {
                const spark = document.createElement("span");
                spark.innerText = coresIcon[Math.floor(Math.random() * coresIcon.length)];
                spark.style.position = "fixed";
                spark.style.left = currentX + "px";
                spark.style.top = currentY + "px";
                spark.style.fontSize = "4px";
                spark.style.opacity = "0.7";
                spark.style.color = "#ffd700";
                spark.style.zIndex = "9998";
                spark.style.pointerEvents = "none";
                spark.style.transition = "opacity 700ms linear";

                document.body.appendChild(spark);
                requestAnimationFrame(() => spark.style.opacity = "0");
                setTimeout(() => spark.remove(), 800);
            }

            if (progress < 1) {
                requestAnimationFrame(animateRocket);
            } else if (!finished) {
                finished = true;

                // ❌ remove foguete SEMPRE
                rocket.remove();
                explodeArcoIris(currentX, currentY);
            }
        }


        requestAnimationFrame(animateRocket);
    }

    function explode(x, y, cascade = false) {
        const particles = cascade ? 20 : 10;

        // 1️⃣ escolhe um grupo de cores aleatório
        const grupoAleatorio = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 / particles) * i;
            const spark = document.createElement("span");

            // 2️⃣ escolhe uma cor aleatória dentro do grupo
            const corAleatoria = grupoAleatorio[Math.floor(Math.random() * grupoAleatorio.length)];


            spark.innerText = cascade ? "✨" : "✦";
            spark.style.position = "fixed";
            spark.style.left = x + "px";
            spark.style.top = y + "px";
            spark.style.fontSize = "11px";
            // 3️⃣ aplica a cor
            spark.style.color = corAleatoria;
            spark.style.zIndex = "9999";
            spark.style.pointerEvents = "none";

            document.body.appendChild(spark);

            if (!cascade) {
                const dist = 40 + Math.random() * 30;
                spark.style.transition = "transform 1000ms ease-out, opacity 700ms";

                requestAnimationFrame(() => {
                    spark.style.transform =
                        `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
                    spark.style.opacity = "0";
                });

                setTimeout(() => spark.remove(), 800);
            } else {
                const spread = 40 + Math.random() * 30;
                const fall = 260 + Math.random() * 120;
                const duration = 2500 + Math.random() * 2000;

                const limitedAngle =
                    angle * 0.6 + Math.PI * 0.7;

                spark.style.transition =
                    `transform ${duration}ms ease-in, opacity ${duration}ms linear`;

                requestAnimationFrame(() => {
                    spark.style.transform =
                        `translate(${Math.cos(limitedAngle) * spread}px, ${Math.sin(limitedAngle) * spread * 0.3 + fall}px)`;
                    spark.style.opacity = "0";
                });

                setTimeout(() => spark.remove(), duration + 200);
            }
        }
    }

    function explodePeacock(x, y) {
        /* clarão reduzido */
        const flash = document.createElement("div");
        flash.style.position = "fixed";
        flash.style.left = x - 30 + "px";
        flash.style.top = y - 30 + "px";
        flash.style.width = "60px";
        flash.style.height = "60px";
        flash.style.borderRadius = "50%";
        flash.style.background =
            "radial-gradient(circle, rgba(255, 255, 255, 0.37), rgba(255,255,255,0))";
        flash.style.zIndex = "9999";
        flash.style.pointerEvents = "none";
        flash.style.opacity = "1";
        flash.style.transition = "opacity 300ms ease-out";

        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = "0";
            setTimeout(() => flash.remove(), 300);
        }, 100);

        /* partículas em explosão circular REAL */
        const particles = 60;

        for (let i = 0; i < particles; i++) {
            const angle = Math.random() * Math.PI * 3;
            const radius = 90 + Math.random() * 50;
            const fallDistance = 160 + Math.random() * 120;

            const spark = document.createElement("div");
            spark.style.position = "fixed";
            spark.style.left = x + "px";
            spark.style.top = y + "px";
            spark.style.width = "3px";
            spark.style.height = "3px";
            spark.style.borderRadius = "50%";
            spark.style.background = "#ffd700";
            spark.style.opacity = "1";
            spark.style.zIndex = "9999";
            spark.style.pointerEvents = "none";

            document.body.appendChild(spark);

            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius;

            /* FASE 1 — abre o círculo */
            spark.animate(
                [
                    { transform: "translate(0, 0)", opacity: 1 },
                    { transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }
                ],
                {
                    duration: 2000,
                    easing: "ease-out",
                    fill: "forwards"
                }
            );

            /* FASE 2 — apenas sumir (fade out) */
            setTimeout(() => {
                spark.animate(
                    [
                        { opacity: 1 },
                        { opacity: 0 }
                    ],
                    {
                        duration: 1800,
                        easing: "ease-in",
                        fill: "forwards"
                    });
            }, 300);


            setTimeout(() => spark.remove(), 1800);
        }


    }
    function explodePeacockDoubleRing(x, y) {
        /* 💥 EXPLOSÃO CIRCULAR — ANÉIS EXATOS */
        const rings = [
            { radius: 75, color: "#e6f2ff", size: 4, particles: 24 }, // anel interno
            { radius: 120, color: "#53ddffff", size: 3, particles: 32 } // anel externo
        ];

        rings.forEach(ring => {
            for (let i = 0; i < ring.particles; i++) {

                // ângulo uniforme (divisão exata do círculo)
                const angle = (Math.PI * 2 / ring.particles) * i;

                const spark = document.createElement("div");
                spark.style.position = "fixed";
                spark.style.left = x + "px";
                spark.style.top = y + "px";
                spark.style.width = ring.size + "px";
                spark.style.height = ring.size + "px";
                spark.style.borderRadius = "50%";
                spark.style.background = ring.color;
                spark.style.opacity = "1";
                spark.style.zIndex = "9999";
                spark.style.pointerEvents = "none";

                document.body.appendChild(spark);

                const dx = Math.cos(angle) * ring.radius + Math.random() * 10;
                const dy = Math.sin(angle) * ring.radius + Math.random() * 10;

                /* FASE 1 — abertura circular perfeita */
                spark.animate(
                    [
                        { transform: "translate(0, 0)", opacity: 1 },
                        { transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }
                    ],
                    {
                        duration: 1200,
                        easing: "ease-out",
                        fill: "forwards"
                    }
                );

                /* FASE 2 — apenas fade out (sem mover) */
                setTimeout(() => {
                    spark.animate(
                        [
                            { opacity: 1 },
                            { opacity: 0 }
                        ],
                        {
                            duration: 1200,
                            easing: "ease-in",
                            fill: "forwards"
                        }
                    );
                }, 300);

                setTimeout(() => spark.remove(), 1300);
            }
        });
    }

    function explodeArcoIris(x, y) {

        const arcoBase = {
            startAngle: Math.PI,
            endAngle: Math.PI * 2,
            particles: 40,
            size: 3
        };

        const layers = [
            { color: "#ff0000", radius: 132 },
            { color: "#ff7f00", radius: 125 },
            { color: "#ffff00", radius: 118 },
            { color: "#00ff00", radius: 111 },
            { color: "#0000ff", radius: 104 },
            { color: "#4b0082", radius: 97 },
            { color: "#9400d3", radius: 90 }
        ];

        const arcLength = arcoBase.endAngle - arcoBase.startAngle;

        layers.forEach(layer => {
            for (let i = 0; i < arcoBase.particles; i++) {

                const angle =
                    arcoBase.startAngle +
                    (arcLength / (arcoBase.particles - 1)) * i;

                const spark = document.createElement("div");
                spark.style.position = "fixed";
                spark.style.left = x + "px";
                spark.style.top = y + "px";
                spark.style.width = arcoBase.size + "px";
                spark.style.height = arcoBase.size + "px";
                spark.style.borderRadius = "50%";
                spark.style.background = layer.color;
                spark.style.zIndex = "9999";
                spark.style.pointerEvents = "none";

                // 🌈 Glow
                spark.style.filter = "blur(0.7px)";
                spark.style.boxShadow = `
                0 0 6px ${layer.color},
                0 0 14px ${layer.color},
                0 0 24px ${layer.color}
            `;

                document.body.appendChild(spark);

                const r1 = layer.radius;
                const r2 = layer.radius + 18;
                const r3 = layer.radius + 36;

                const x1 = Math.cos(angle) * r1;
                const y1 = Math.sin(angle) * r1;

                const x2 = Math.cos(angle) * r2;
                const y2 = Math.sin(angle) * r2;

                const x3 = Math.cos(angle) * r3;
                const y3 = Math.sin(angle) * r3;

                // ☄️ RABO PROGRESSIVO (keyframes reais)
                spark.animate(
                    [
                        { transform: "translate(0, 0)", opacity: 1 },
                        { transform: `translate(${x1}px, ${y1}px)`, opacity: 1 },
                        { transform: `translate(${x2}px, ${y2}px)`, opacity: 0.6 },
                        { transform: `translate(${x3}px, ${y3}px)`, opacity: 0 }
                    ],
                    {
                        duration: 1600,
                        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                        fill: "forwards"
                    }
                );

                setTimeout(() => spark.remove(), 2050);
            }
        });
    }

    function loop() {
        if (!fireworksRunning) return;
        const r = Math.random();
        if (r < 0.01){
            //launchArcoiresFirework();
        }else if (r < 0.2) {
            launchPeacockFirework();
            if (Math.random() < 0.03) {
                setTimeout(() => {
                    launchPeacockFirework();
                }, 300);
                setTimeout(() => {
                    launchPeacockFirework();
                    launchPeacockFirework();
                }, 400);
            } else if (Math.random() < 0.2) {
                setTimeout(() => {
                    launchPeacockFirework();
                }, 200);
            }
        } else {
            launchNormalFirework();
        }

        setTimeout(loop, 500 + Math.random() * 2200);
    }

    loop();
}



