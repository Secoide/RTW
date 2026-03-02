export async function carregarAniversariantes() {
    try {
        const resp = await fetch("/api/colaboradores/aniversariantes");

        if (!resp.ok) {
            console.warn("Falha ao obter colaboradores:", await resp.text());
            return;
        }

        const colaboradores = await resp.json();

        const hoje = new Date();
        const mesAtual = hoje.getMonth() + 1;

        const listaMes = document.getElementById("lista-aniversarios");
        const listaProximos = document.getElementById("lista-proximos");

        if (!listaMes || !listaProximos) {
            console.warn("Elementos do painel não encontrados no DOM.");
            return;
        }

        listaMes.innerHTML = "";
        listaProximos.innerHTML = "";

        const aniversariantesMes = colaboradores.filter(c => {
            const data = tratarData(c.nascimento);
            if (!data) return false;

            return Number(data.split("-")[1]) === mesAtual;
        });
        // Transformar lista em objetos com diff
        const aniversariantesMesProcessado = aniversariantesMes.map(c => {
            const data = tratarData(c.nascimento);
            const [yyyy, mm, dd] = data.split("-");

            const hoje = new Date();
            const aniversario = new Date(hoje.getFullYear(), mm - 1, dd);

            // diferença em dias
            const diffDias = Math.ceil((aniversario - hoje) / 86400000);

            return { ...c, diffDias };
        });
        aniversariantesMesProcessado.sort((a, b) => {
            // 1) HOJE primeiro
            if (a.diffDias === 0 && b.diffDias !== 0) return -1;
            if (b.diffDias === 0 && a.diffDias !== 0) return 1;

            // 2) FUTURO depois
            if (a.diffDias > 0 && b.diffDias < 0) return -1;
            if (b.diffDias > 0 && a.diffDias < 0) return 1;

            // 3) FUTUROS entre si (ordena do menor para o maior)
            if (a.diffDias > 0 && b.diffDias > 0) return a.diffDias - b.diffDias;

            // 4) PASSADOS entre si (ordena do que passou há menos tempo para o que passou há mais tempo)
            if (a.diffDias < 0 && b.diffDias < 0) return b.diffDias - a.diffDias;

            return 0;
        });
        aniversariantesMesProcessado.forEach(c => {
            listaMes.innerHTML += montarCard(c);
        });

        // próximos 40 dias
        const proximos = colaboradores
            .map((c) => {
                const data = tratarData(c.nascimento);
                if (!data) return null;

                const [yyyy, mm, dd] = data.split("-");

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                // cria aniversário SEM timezone (usando UTC)
                let aniversario = new Date(Date.UTC(
                    hoje.getFullYear(),
                    Number(mm) - 1,
                    Number(dd)
                ));

                // se já passou este ano, empurra para o ano seguinte
                if (aniversario.getTime() < hoje.getTime()) {
                    aniversario = new Date(Date.UTC(
                        hoje.getFullYear() + 1,
                        Number(mm) - 1,
                        Number(dd)
                    ));
                }

                const diff = Math.round((aniversario - hoje) / 86400000);

                return {
                    ...c,
                    diff,
                    mes: Number(mm),
                    dataFormatada: `${dd}/${mm}`
                };
            })
            .filter((c) =>
                c !== null &&
                c.diff > 0 &&
                c.diff <= 40 &&   // dentro dos próximos 30 dias reais
                c.mes !== mesAtual // mantém lógica de não mostrar mês atual
            )
            .sort((a, b) => a.diff - b.diff);




        proximos.forEach(c => {
            listaProximos.innerHTML += montarCardProximo(c);
        });
        setTimeout(() => {
            document.querySelectorAll(".card-aniver[data-hoje='true']").forEach(card => {
                aplicarConfeteNoCard(card);
            });
        }, 100);
        ajustarAlturaPainel(aniversariantesMes.length, proximos.length);
    } catch (e) {
        console.error("Erro geral:", e);
    }
}

function tratarData(d) {
    if (!d) return null;
    if (typeof d === "string") {
        if (d.includes("T")) return d.split("T")[0];
        return d;
    }
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return null;
}

function montarCard(colab) {
    const data = tratarData(colab.nascimento);
    const [yyyy, mm, dd] = data.split("-");

    const hoje = new Date();
    const aniversario = new Date(hoje.getFullYear(), mm - 1, dd);

    let diffDias = Math.ceil((aniversario - hoje) / 86400000);

    let textoExtra = "";

    // Hoje
    if (diffDias === 0) {
        textoExtra = `<span style="color:#ffd700; font-weight:bold;"> — hoje 🎉</span>`;
    }
    // Futuro no mês
    else if (diffDias > 0) {
        textoExtra = `<span style="color:#aaa;"> — em ${diffDias} dias</span>`;
    }
    // Já passou mas ainda é do mês
    else if (diffDias < 0 && aniversario.getMonth() === hoje.getMonth()) {
        textoExtra = `<span style="color:#777;"> — ja passou!</span>`;
    }

    // Animação para aniversariante do dia
    const isHoje = diffDias === 0;
    const classeHoje = isHoje ? "card-hoje" : "";


    const cardHTML = `
    <div class="card-aniver ${classeHoje}" data-hoje="${isHoje}">
        <img class="tb_fotoColab"
            src="${colab.fotoperfil}?v=${colab.versao_foto}"
            onerror="this.src='/imagens/user-default.webp'">

        <div>
            <div class="nome">${colab.nome}</div>
            <div class="data">${dd}/${mm} ${textoExtra}</div>
        </div>
    </div>
`;

    return cardHTML;
}


function montarCardProximo(colab) {
    return `
        <div class="card-aniver">
           <img class="tb_fotoColab"
                src="${colab.fotoperfil}?v=${colab.versao_foto}"
                onerror="this.src='/imagens/user-default.webp'">
            <div>
                <div class="nome">${colab.nome}</div>
                <div class="data">${colab.dataFormatada} <span style="color:#aaa;"> — em ${colab.diff} dias</span></div>
            </div>
        </div>
    `;
}


function ajustarAlturaPainel(qtdMes, qtdProximos) {
    const listaMes = document.getElementById("lista-aniversarios");
    const listaProx = document.getElementById("lista-proximos");

    // Caso especial: nenhum aniversariante no mês
    if (qtdMes === 0) {
        listaMes.style.flex = "2";
        listaProx.style.flex = "8";
        return;
    }

    // Padrão: 70% + 30%
    listaMes.style.flex = "7";
    listaProx.style.flex = "3";
}

function aplicarConfeteNoCard(cardElement) {
    const container = document.createElement("div");
    container.className = "confetti-container";

    const cores = ["#ffd700", "#ff4d4d", "#4da6ff", "#66ff66", "#ff66cc"];

    // Quantidade de confetes
    const total = 25;

    for (let i = 0; i < total; i++) {
        const confete = document.createElement("span");
        confete.className = "confetti";

        // cor aleatória
        confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];

        // posição horizontal aleatória
        confete.style.left = Math.random() * 100 + "%";

        // delay e duração diferentes
        confete.style.animationDuration = 1.5 + Math.random() * 1 + "s";
        confete.style.animationDelay = Math.random() * 1 + "s";

        container.appendChild(confete);
    }

    cardElement.appendChild(container);
}
