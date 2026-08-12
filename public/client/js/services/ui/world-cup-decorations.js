// =======================================================
// COPA DO MUNDO 2026
// =======================================================

export function initWorldCupDecorations() {

    const hoje = new Date();

    const inicio = new Date("2026-06-01");
    const fim = new Date("2026-07-21");

    if (hoje < inicio || hoje > fim) {
        return;
    }

    criarEstilos();
    criarBandeiraBrasil();
    criarTaca();
}

// =======================================================
// BANDEIRA BRASIL
// =======================================================

function criarBandeiraBrasil() {
    const flag = document.createElement("img");
    flag.src = "/imagens/worldcup/bandeira.png";
    flag.className = "wc-brasil";
    flag.title = "COPA DO MUNDO 2026";
    document.body.appendChild(flag);
}

// =======================================================
// TAÇA
// =======================================================

function criarTaca() {

    const cup = document.createElement("img");
    cup.src = "/imagens/worldcup/taca.png";
    cup.className = "wc-cup";
    cup.title = "COPA DO MUNDO 2026";
    document.body.appendChild(cup);
}



// =======================================================
// CSS
// =======================================================

function criarEstilos() {

    if (
        document.getElementById(
            "world-cup-style"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "world-cup-style";

    style.innerHTML = `

    .wc-brasil{
        position:fixed;
        top:10px;
        left:10px;
        width:140px;
        z-index:9997;
        filter:
            drop-shadow(0 0 15px black);
    }
    .wc-cup{
        position:fixed;
        left:25px;
        top:145px;
        width:64px;
        opacity:.92;
        z-index:9998;
        filter:
            drop-shadow(0 0 12px gold);
    }
    `;

    document.head.appendChild(style);
}