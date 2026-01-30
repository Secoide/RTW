let aberta = false;
let detalheAberto = false;
let ferramentaSelecionada = null;


const MAX_POR_LINHA = 5;
const RAIO_ARCO = 240;     // antes ~70
const ALTURA_BASE = -200; // antes ~-95
const ESPACO_LINHA = 165;

export function initMaleta() {
    const maleta = document.getElementById("maleta");
    const tooltip = document.getElementById("tooltipFerramentas");

    if (!maleta || !tooltip || typeof gsap === "undefined") return;

    const ferramentas = document.querySelectorAll("[data-tool]");

    maleta.addEventListener("click", () => {
        aberta ? fechar() : abrir();
        aberta = !aberta;
    });
    document
        .getElementById("painelFerramenta")
        .addEventListener("click", (e) => {
            e.stopPropagation();
        });
    document.addEventListener("click", (e) => {
        const clicouNaMaleta = e.target.closest('#maleta');

        if (!detalheAberto) return;
        const clicouNaFerramenta =
            e.target.closest('[id^="tool-"]');
            
        const clicouNoPainel =
            e.target.closest('#painelFerramenta');

        if (!clicouNaFerramenta && !clicouNoPainel && !clicouNaMaleta) {
            fecharDetalheFerramenta();
        }
    });


    function abrir() {
        if (detalheAberto) {
            fecharDetalheFerramenta();
        }
        // 🔧 abre a tampa (2D correto para SVG)
        gsap.to("#tampa", {
            y: 5,
            duration: 0.4,
            ease: "power2.out"
        });
        gsap.to("#alca_2", {
            y: 5,
            duration: 0.4,
            ease: "power2.out"
        });

        const lista = Array.from(ferramentas);

        const linhas = [];
        for (let i = 0; i < lista.length; i += MAX_POR_LINHA) {
            linhas.push(lista.slice(i, i + MAX_POR_LINHA));
        }

        linhas.forEach((linha, linhaIndex) => {

            const total = linha.length;
            const anguloInicial = -Math.PI / 2.8;
            const anguloFinal = Math.PI / 2.8;

            linha.forEach((tool, i) => {
                const t = total === 1 ? 0.5 : i / (total - 1);
                const angulo = anguloInicial + t * (anguloFinal - anguloInicial);

                // 🔥 ARCO HORIZONTAL CORRETO
                const x = Math.sin(angulo) * RAIO_ARCO;
                const y = -Math.cos(angulo) * RAIO_ARCO;

                gsap.to(tool, {
                    x,
                    y: ALTURA_BASE + y - linhaIndex * ESPACO_LINHA,
                    duration: 0.6,
                    delay: i * 0.05 + linhaIndex * 0.1,
                    ease: "power3.out"
                });
            });
        });
    }

    function abrirDetalheFerramenta(tool) {
        detalheAberto = true;
        ferramentaSelecionada = tool;

        ferramentas.forEach(t => {
            t.classList.add("desfocada");
            t.classList.remove("selecionada");
        });

        tool.classList.remove("desfocada");
        tool.classList.add("selecionada");

        gsap.to(ferramentas, { scale: 1, duration: 0.2 });

        gsap.to(tool, {
            scale: 1.4,
            duration: 0.3,
            ease: "power3.out"
        });

        mostrarInfoFerramenta(tool);
    }



    function mostrarInfoFerramenta(tool) {
        const painel = document.getElementById("painelFerramenta");

        document.getElementById("painelNome").textContent = tool.dataset.nome;
        document.getElementById("painelEntrega").textContent = tool.dataset.entrega;
        document.getElementById("painelVistoria").textContent = tool.dataset.vistoria;

        painel.classList.add("ativo");

        posicionarPainelSVG(tool, painel);
    }


    function fecharDetalheFerramenta() {
        detalheAberto = false;
        ferramentaSelecionada = null;

        ferramentas.forEach(t => {
            t.classList.remove("desfocada", "selecionada");
        });

        gsap.to(ferramentas, {
            scale: 1,
            duration: 0.25,
            ease: "power2.out"
        });

        document
            .getElementById("painelFerramenta")
            .classList.remove("ativo");
    }


    function fechar() {
        detalheAberto = false;
        ferramentaSelecionada = null;

        gsap.to("#tampa", {
            y: 0,
            duration: 0.4,
            ease: "power2.out"
        });
        gsap.to("#alca_2", {
            y: 0,
            duration: 0.4,
            ease: "power2.out"
        });
        gsap.to(ferramentas, {
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.inOut"
        });

        ferramentas.forEach(t => {
            t.classList.remove("desfocada", "selecionada");
        });

        document
            .getElementById("painelFerramenta")
            .classList.remove("ativo");
    }

    function posicionarTooltipSVG(tool, tooltip) {
        const svg = tool.ownerSVGElement;

        // centro da ferramenta no sistema do SVG
        const bbox = tool.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y;

        // cria ponto SVG
        const point = svg.createSVGPoint();
        point.x = cx;
        point.y = cy;

        // converte para coordenadas da tela
        const screenPoint = point.matrixTransform(tool.getScreenCTM());

        tooltip.style.left = screenPoint.x + "px";
        tooltip.style.top = screenPoint.y + "px";
    }


    function posicionarPainelSVG(tool, painel) {
        const svg = tool.ownerSVGElement;
        const bbox = tool.getBBox();

        const cx = bbox.x + bbox.width;
        const cy = bbox.y + bbox.height / 2;

        const point = svg.createSVGPoint();
        point.x = cx;
        point.y = cy;

        const screenPoint = point.matrixTransform(tool.getScreenCTM());

        painel.style.left = screenPoint.x + "px";
        painel.style.top = screenPoint.y + "px";
    }


    ferramentas.forEach(tool => {
        const nome = tool.dataset.nome;
        const ativo = tool.dataset.ativo !== "false";

        if (!ativo) tool.classList.add("inativo");

        tool.addEventListener("click", (e) => {
            e.stopPropagation(); // 🔥 ISSO RESOLVE

            abrirDetalheFerramenta(tool);
        });

        tool.addEventListener("mouseenter", () => {
            if (detalheAberto) return;
            const nome = tool.dataset.nome;
            const ativo = tool.dataset.ativo !== "false";

            tooltip.textContent = ativo
                ? nome
                : `${nome} (não entregue)`;

            tooltip.style.opacity = "1";
            tooltip.style.transform = "translate(-50%, -110%)";

            posicionarTooltipSVG(tool, tooltip);
        });

        tool.addEventListener("mouseleave", () => {
            tooltip.style.opacity = "0";
        });

    });
}
