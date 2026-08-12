function textoSeguro(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function textoDoElemento(seletor, fallback = "-") {
    const el = document.querySelector(seletor);
    const texto = el?.value ?? el?.innerText ?? el?.textContent ?? "";
    return texto.toString().trim() || fallback;
}

function textoSelect(seletor, fallback = "-") {
    const select = document.querySelector(seletor);
    const texto = select?.selectedOptions?.[0]?.textContent || select?.value || "";
    return texto.trim() || fallback;
}

function linhasUnicasDoContainer(seletor, limite = 80) {
    const el = document.querySelector(seletor);
    if (!el) return [];

    return [...new Set(
        (el.innerText || "")
            .split("\n")
            .map(linha => linha.trim())
            .filter(Boolean)
    )].slice(0, limite);
}

function listaHtml(linhas, vazio = "Nenhum registro encontrado.") {
    if (!linhas.length) {
        return `<p class="empty">${textoSeguro(vazio)}</p>`;
    }

    return `<ul>${linhas.map(linha => `<li>${textoSeguro(linha)}</li>`).join("")}</ul>`;
}

function cardsHtml(itens, vazio = "Nenhum registro encontrado.", classeExtra = "") {
    if (!itens.length) {
        return `<p class="empty">${textoSeguro(vazio)}</p>`;
    }

    return `
        <div class="pdf-card-grid ${textoSeguro(classeExtra)}">
            ${itens.map(item => `
                <article class="pdf-record-card status-${textoSeguro(item.statusKey || "ok")}">
                    <div class="pdf-record-top">
                        <strong>${textoSeguro(item.titulo || "-")}</strong>
                        <span>${textoSeguro(item.status || "-")}</span>
                    </div>
                    ${item.subtitulo ? `<p>${textoSeguro(item.subtitulo)}</p>` : ""}
                    <div class="pdf-record-meta">
                        ${item.dias ? `<small>${textoSeguro(item.dias)}</small>` : ""}
                        ${item.data ? `<small>${textoSeguro(item.data)}</small>` : ""}
                        ${item.extra ? `<small>${textoSeguro(item.extra)}</small>` : ""}
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function urlAbsoluta(url) {
    if (!url) return "";
    try {
        return new URL(url, window.location.origin).href;
    } catch (_) {
        return url;
    }
}

function abrirDocumentoImpressao(titulo, conteudo) {
    const janela = window.open("", "_blank", "width=1200,height=900");
    if (!janela) {
        alert("O navegador bloqueou a janela de impressão. Libere pop-ups para exportar o PDF.");
        return;
    }

    const agora = new Date().toLocaleString("pt-BR");

    janela.document.write(`
        <!doctype html>
        <html lang="pt-BR">
        <head>
            <meta charset="utf-8">
            <title>${textoSeguro(titulo)}</title>
            <style>
                :root {
                    --texto: #202020;
                    --muted: #666;
                    --linha: #d8d8d8;
                    --fundo: #f5f5f5;
                    --marca-a: #ee7722;
                    --marca-b: #efda38;
                }

                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                body {
                    margin: 0;
                    padding: 16px 10px;
                    color: var(--texto);
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 11px;
                    background: #fff;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 18px;
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                    border-bottom: 3px solid var(--texto);
                }

                h1, h2, h3, p { margin: 0; }
                h1 { font-size: 20px; letter-spacing: 0; }
                h2 { font-size: 14px; margin: 18px 0 8px; }
                h3 { font-size: 12px; margin-bottom: 6px; }
                .meta { color: var(--muted); text-align: right; line-height: 1.45; }
                .tag {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, var(--marca-a), var(--marca-b));
                    color: #181818;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .cards {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px;
                    margin: 10px 0 14px;
                }

                .card {
                    border: 1px solid var(--linha);
                    border-radius: 8px;
                    padding: 9px;
                    background: var(--fundo);
                    min-height: 54px;
                }

                .card strong {
                    display: block;
                    font-size: 18px;
                    margin-bottom: 3px;
                }

                .grid-info {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .info {
                    border: 1px solid var(--linha);
                    border-radius: 7px;
                    padding: 8px;
                    min-height: 44px;
                }

                .info span,
                .card span {
                    display: block;
                    color: var(--muted);
                    font-size: 9px;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    page-break-inside: auto;
                }

                th {
                    background: #2f2f2f;
                    color: #fff;
                    font-size: 9px;
                    text-transform: uppercase;
                    padding: 7px 6px;
                    text-align: left;
                }

                td {
                    border-bottom: 1px solid var(--linha);
                    padding: 6px;
                    vertical-align: top;
                }

                tr { page-break-inside: avoid; }
                ul { margin: 0; padding-left: 16px; }
                li { margin-bottom: 4px; }
                .section {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    border: 1px solid var(--linha);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .pdf-card-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                }

                .pdf-card-grid-wide {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .pdf-card-grid-compact .pdf-record-card {
                    min-height: 112px;
                }

                .pdf-card-grid-compact .pdf-record-top {
                    flex-direction: column;
                    gap: 5px;
                }

                .pdf-card-grid-compact .pdf-record-top span {
                    max-width: 100%;
                }

                .pdf-record-card {
                    border: 1px solid var(--linha);
                    border-left: 4px solid #8d8d8d;
                    border-radius: 8px;
                    padding: 9px;
                    background: #fafafa;
                    min-height: 96px;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .pdf-record-card.status-vencido { border-left-color: #c0392b; }
                .pdf-record-card.status-alerta,
                .pdf-record-card.status-atencao,
                .pdf-record-card.status-atenção { border-left-color: #ee7722; }
                .pdf-record-card.status-ok,
                .pdf-record-card.status-integrado { border-left-color: #2f9e44; }
                .pdf-record-card.status-agendado,
                .pdf-record-card.status-pendente { border-left-color: #2f80ed; }
                .pdf-record-card.status-nao_aplica { border-left-color: #8d8d8d; }

                .pdf-record-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    align-items: flex-start;
                    margin-bottom: 5px;
                }

                .pdf-record-top strong {
                    font-size: 12px;
                    line-height: 1.25;
                }

                .pdf-record-top span {
                    flex: 0 0 auto;
                    max-width: 110px;
                    border-radius: 999px;
                    padding: 3px 7px;
                    background: #ececec;
                    color: #333;
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    text-align: center;
                }

                .pdf-record-card p {
                    color: #383838;
                    margin-bottom: 6px;
                    line-height: 1.35;
                }

                .pdf-record-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }

                .pdf-record-meta small {
                    border-radius: 5px;
                    background: #f0f0f0;
                    padding: 3px 5px;
                    color: var(--muted);
                    font-size: 9px;
                }

                .pdf-epi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px;
                }

                .pdf-epi-card {
                    display: grid;
                    grid-template-columns: 52px 1fr;
                    gap: 8px;
                    align-items: center;
                    border: 1px solid var(--linha);
                    border-radius: 9px;
                    padding: 8px;
                    background: linear-gradient(145deg, #ffffff, #f3f3f3);
                    min-height: 76px;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .pdf-epi-icon {
                    display: grid;
                    place-items: center;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #2f2f2f, #111);
                    border: 1px solid #d8d8d8;
                    color: #efda38;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 0;
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
                }

                .pdf-epi-card strong {
                    display: block;
                    font-size: 10px;
                    line-height: 1.15;
                    margin-bottom: 4px;
                }

                .pdf-epi-card span {
                    display: block;
                    color: var(--muted);
                    font-size: 9px;
                    line-height: 1.25;
                }

                .pdf-epi-card em {
                    display: inline-block;
                    margin-top: 4px;
                    padding: 2px 6px;
                    border-radius: 999px;
                    background: #ececec;
                    color: #303030;
                    font-size: 8px;
                    font-style: normal;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .pdf-ausencias-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .pdf-ausencia-card {
                    position: relative;
                    overflow: hidden;
                    min-height: 112px;
                    border: 1px solid var(--linha);
                    border-radius: 12px;
                    padding: 12px;
                    background: #f7f7f7;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .pdf-ausencia-card::before {
                    content: "";
                    position: absolute;
                    inset: 0 auto 0 0;
                    width: 6px;
                    background: #8d8d8d;
                }

                .pdf-ausencia-card.ferias {
                    border-color: rgba(238, 119, 34, 0.38);
                    background:
                        linear-gradient(135deg, rgba(238,119,34,0.16), rgba(239,218,56,0.16)),
                        #fffaf0;
                }

                .pdf-ausencia-card.ferias::before {
                    background: linear-gradient(180deg, var(--marca-a), var(--marca-b));
                }

                .pdf-ausencia-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }

                .pdf-ausencia-head strong {
                    font-size: 13px;
                    line-height: 1.2;
                }

                .pdf-ausencia-head span {
                    border-radius: 999px;
                    padding: 3px 8px;
                    background: #fff;
                    border: 1px solid #e4e4e4;
                    font-size: 9px;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .pdf-ausencia-datas {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 6px;
                    margin-bottom: 8px;
                }

                .pdf-ausencia-datas small {
                    display: block;
                    border-radius: 7px;
                    padding: 6px;
                    background: rgba(255,255,255,0.72);
                    border: 1px solid rgba(0,0,0,0.07);
                    color: #303030;
                }

                .pdf-ausencia-datas b {
                    display: block;
                    color: var(--muted);
                    font-size: 8px;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }

                .pdf-ausencia-card p {
                    color: #4a4a4a;
                    line-height: 1.35;
                }

                .pdf-chart {
                    display: grid;
                    gap: 7px;
                }

                .pdf-chart-row {
                    display: grid;
                    grid-template-columns: 170px 1fr 42px;
                    gap: 8px;
                    align-items: center;
                }

                .pdf-chart-label {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #303030;
                    font-weight: 700;
                }

                .pdf-chart-track {
                    height: 16px;
                    border-radius: 999px;
                    background: #e8e8e8;
                    overflow: hidden;
                }

                .pdf-chart-fill {
                    height: 100%;
                    min-width: 3px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, var(--marca-a), var(--marca-b));
                }

                .pdf-chart-value {
                    text-align: right;
                    font-weight: 700;
                }

                .empty { color: var(--muted); font-style: italic; }
                .perfil-topo {
                    display: grid;
                    grid-template-columns: 86px 1fr;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .perfil-topo img {
                    width: 78px;
                    height: 78px;
                    object-fit: cover;
                    border-radius: 50%;
                    border: 2px solid var(--marca-a);
                }

                .grafico {
                    width: 100%;
                    max-height: 360px;
                    object-fit: contain;
                    border: 1px solid var(--linha);
                    border-radius: 8px;
                    padding: 8px;
                }

                @media print {
                    html,
                    body {
                        padding: 6mm 4mm;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    header { margin-bottom: 10px; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <header>
                <div>
                    <span class="tag">ConnectPear</span>
                    <h1>${textoSeguro(titulo)}</h1>
                </div>
                <div class="meta">
                    Gerado em ${textoSeguro(agora)}<br>
                    Documento para impressão e conferência rápida
                </div>
            </header>
            ${conteudo}
            <script>
                window.onload = function () {
                    setTimeout(function () { window.print(); }, 350);
                };
            <\/script>
        </body>
        </html>
    `);
    janela.document.close();
}

function coletarResumoRH() {
    const visiveis = document.querySelectorAll("#tb_colaboradoresRH tbody tr.rh_tb_lin_colob:not([style*='display: none'])").length;
    const totalLinhas = document.querySelectorAll("#tb_colaboradoresRH tbody tr.rh_tb_lin_colob").length;
    const pendencias = textoDoElemento("#rhResumoPendencias", "0");
    const ausencias = textoDoElemento("#rhResumoAusentes", "0");

    return { visiveis, totalLinhas, pendencias, ausencias };
}

export function exportarResumoRHPDF() {
    const linhas = [...document.querySelectorAll("#tb_colaboradoresRH tbody tr.rh_tb_lin_colob")]
        .map(row => {
            const cells = [...row.cells].map(cell => cell.innerText.trim().replace(/\s+/g, " "));
            return {
                id: cells[0] || "-",
                nome: cells[1] || "-",
                nascimento: cells[2] || "-",
                cargo: cells[3] || "-",
                setor: cells[4] || "-",
                epis: cells[5] || "-",
                integracoes: cells[6] || "-",
                exames: cells[7] || "-",
                cursos: cells[8] || "-",
                status: cells[9] || "-"
            };
        });

    if (!linhas.length) {
        alert("Nenhum colaborador carregado para exportar.");
        return;
    }

    const resumo = coletarResumoRH();
    const busca = textoDoElemento("#myInputPesquisaNomeRH", "Sem busca aplicada");
    const filtroRapido = document.querySelector(".rh-chip.ativo")?.innerText?.trim() || "Todos";

    const secoesHtml = `
        <section class="section">
            <h3>Exames ocupacionais</h3>
            ${cardsHtml(coletarCardsExames(), "Nenhum exame carregado.", "pdf-card-grid-compact")}
        </section>

        <section class="section">
            <h3>Cursos e treinamentos</h3>
            ${cardsHtml(coletarCardsCursos(), "Nenhum curso carregado.", "pdf-card-grid-compact")}
        </section>

        <section class="section">
            <h3>Integrações</h3>
            ${cardsHtml(coletarCardsIntegracoes(), "Nenhuma integração carregada.")}
        </section>

        <section class="section">
            <h3>EPI e vestimentas</h3>
            ${episHtml(coletarEpisPerfil())}
        </section>

        <section class="section">
            <h3>Atestados e ausências</h3>
            ${listaHtml(linhasUnicasDoContainer(".painel_atestar"), "Nenhum histórico de atestado carregado.")}
        </section>

        <section class="section">
            <h3>Conquistas e reconhecimentos</h3>
            ${cardsHtml(coletarCardsConquistas(), "Nenhuma conquista carregada.")}
        </section>
    `;

    const conteudo = `
        <div class="cards">
            <div class="card"><span>Visíveis</span><strong>${textoSeguro(resumo.visiveis)}</strong>colaboradores no filtro atual</div>
            <div class="card"><span>Total carregado</span><strong>${textoSeguro(resumo.totalLinhas)}</strong>registros na tela</div>
            <div class="card"><span>Atenção</span><strong>${textoSeguro(resumo.pendencias)}</strong>pendências rápidas</div>
            <div class="card"><span>Ausências</span><strong>${textoSeguro(resumo.ausencias)}</strong>férias, afastamentos ou situações especiais</div>
        </div>
        <div class="grid-info">
            <div class="info"><span>Busca</span>${textoSeguro(busca)}</div>
            <div class="info"><span>Filtro rápido</span>${textoSeguro(filtroRapido)}</div>
            <div class="info"><span>Desligados</span>${document.querySelector("#chkDesligados")?.checked ? "Incluídos" : "Ocultos"}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Nascimento</th>
                    <th>Cargo</th>
                    <th>Setor</th>
                    <th>Integrações</th>
                    <th>Exames</th>
                    <th>Cursos</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${linhas.map(colab => `
                    <tr>
                        <td>${textoSeguro(colab.id)}</td>
                        <td>${textoSeguro(colab.nome)}</td>
                        <td>${textoSeguro(colab.nascimento)}</td>
                        <td>${textoSeguro(colab.cargo)}</td>
                        <td>${textoSeguro(colab.setor)}</td>
                        <td>${textoSeguro(colab.integracoes)}</td>
                        <td>${textoSeguro(colab.exames)}</td>
                        <td>${textoSeguro(colab.cursos)}</td>
                        <td>${textoSeguro(colab.status)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    abrirDocumentoImpressao("Resumo geral de colaboradores", conteudo);
}

function carregarSecaoPerfil(nomeFuncao, idFunc, seletor) {
    const funcao = window[nomeFuncao];
    const $box = window.jQuery ? window.jQuery(seletor) : null;

    if (typeof funcao !== "function" || !$box?.length) {
        return Promise.resolve();
    }

    try {
        return Promise.resolve(funcao(idFunc, $box)).catch(() => undefined);
    } catch (err) {
        console.warn(`Não foi possível carregar ${nomeFuncao} para o PDF.`, err);
        return Promise.resolve();
    }
}

async function carregarDadosPerfilPDF(idFunc) {
    await Promise.all([
        carregarSecaoPerfil("load_exames_colaborador", idFunc, "#carregarExamesAqui"),
        carregarSecaoPerfil("load_cursos_colaborador", idFunc, "#carregarCursosAqui"),
        carregarSecaoPerfil("load_integracoes_colaborador", idFunc, "#carregarIntegracoesAqui"),
        carregarSecaoPerfil("load_epis_colaborador", idFunc, "#carregarEPIAqui")
    ]);

    await carregarSecaoPerfil("load_estatisticas_func_empresa", idFunc, "#areaGraficoHist");
    await new Promise(resolve => setTimeout(resolve, 650));
}

function obterImagemGraficoPerfil() {
    const canvas = document.querySelector("#areaGraficoHist canvas");
    if (!canvas) return "";

    try {
        return canvas.toDataURL("image/png");
    } catch (err) {
        console.warn("Não foi possível capturar o gráfico do perfil.", err);
        return "";
    }
}

function cnhSelecionada() {
    const categorias = ["A", "B", "C", "D"]
        .filter(cat => document.querySelector(`#cat_cnh_${cat}`)?.checked);

    return categorias.length ? categorias.join(", ") : "-";
}

function statusKey(valor) {
    return String(valor || "ok")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function textoInterno(card, seletor, fallback = "") {
    return card.querySelector(seletor)?.innerText?.trim() || fallback;
}

function coletarCardsExames() {
    return [...document.querySelectorAll("#carregarExamesAqui .bloco_exame")].map(card => {
        const status = card.dataset.status || "OK";
        return {
            titulo: textoInterno(card, ".exame_nome"),
            subtitulo: card.getAttribute("title") || "",
            status,
            statusKey: statusKey(status),
            dias: textoInterno(card, ".exame_dias"),
            data: textoInterno(card, ".exame_data"),
            extra: card.querySelector("[title='PDF anexado']") ? "PDF anexado" : ""
        };
    });
}

function coletarCardsCursos() {
    return [...document.querySelectorAll("#carregarCursosAqui .bloco_curso")].map(card => {
        const status = card.dataset.status || "OK";
        return {
            titulo: textoInterno(card, ".norma"),
            subtitulo: textoInterno(card, ".exame_nome"),
            status,
            statusKey: statusKey(status),
            dias: textoInterno(card, ".exame_dias"),
            data: textoInterno(card, ".exame_data"),
            extra: card.querySelector("[title='PDF anexado']") ? "PDF anexado" : ""
        };
    });
}

function coletarCardsIntegracoes() {
    return [...document.querySelectorAll("#carregarIntegracoesAqui .bloco_integracao")].map(card => {
        const status = card.dataset.status || textoInterno(card, ".integracao_nome", "OK");
        return {
            titulo: textoInterno(card, ".integra"),
            subtitulo: "",
            status,
            statusKey: statusKey(status),
            dias: textoInterno(card, ".integracao_dias"),
            data: textoInterno(card, ".integracao_data")
        };
    });
}

function coletarEpisPerfil() {
    return [...document.querySelectorAll("#carregarEPIAqui .painel_Imganes_EPI")].map(card => {
        const statusBox = card.querySelector(".status_EPI");
        const status = textoInterno(card, ".statusEPI", "Sem status");
        const nome = textoInterno(card, ".nomeEPI", "EPI");
        return {
            icone: iconeEpi(statusBox?.dataset?.idepi, nome),
            nome,
            ca: textoInterno(card, ".tamanhoEPI"),
            entregue: textoInterno(card, ".entregueEPI"),
            ficha: textoInterno(card, ".fichaepi_assinado") || textoInterno(card, ".fichaepi_nao_assinado"),
            status
        };
    });
}

function iconeEpi(idEpi, nome) {
    const porId = {
        1: "CAP",
        2: "OC",
        3: "PA",
        4: "MS",
        5: "LV",
        6: "LC",
        7: "BT",
        8: "JL",
        9: "CL",
        10: "CV",
        11: "SL"
    };

    if (porId[idEpi]) return porId[idEpi];

    const texto = String(nome || "EPI").toUpperCase();
    if (texto.includes("CAPACETE")) return "CAP";
    if (texto.includes("OCUL")) return "OC";
    if (texto.includes("AURICULAR") || texto.includes("FONE")) return "PA";
    if (texto.includes("MASC")) return "MS";
    if (texto.includes("LUVA")) return "LV";
    if (texto.includes("SAPATO") || texto.includes("BOT")) return "BT";
    if (texto.includes("JALECO")) return "JL";
    if (texto.includes("CALCA")) return "CL";
    if (texto.includes("COLETE")) return "CV";
    return "EPI";
}

function episHtml(itens) {
    if (!itens.length) {
        return `<p class="empty">Nenhum EPI carregado.</p>`;
    }

    return `
        <div class="pdf-epi-grid">
            ${itens.map(epi => `
                <article class="pdf-epi-card">
                    <div class="pdf-epi-icon">${textoSeguro(epi.icone)}</div>
                    <div>
                        <strong>${textoSeguro(epi.nome)}</strong>
                        ${epi.ca ? `<span>${textoSeguro(epi.ca)}</span>` : ""}
                        ${epi.entregue ? `<span>${textoSeguro(epi.entregue)}</span>` : ""}
                        ${epi.ficha ? `<span>${textoSeguro(epi.ficha)}</span>` : ""}
                        <em>${textoSeguro(epi.status)}</em>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function coletarCardsConquistas() {
    return [...document.querySelectorAll("#listaConquistasColaborador .cardConquista")].map(card => ({
        titulo: textoInterno(card, ".titulo"),
        subtitulo: "Conquista registrada",
        status: "Medalha",
        statusKey: "ok",
        dias: textoInterno(card, ".data"),
        data: textoInterno(card, ".icone")
    }));
}

function formatarDataCurta(valor) {
    if (!valor) return "-";
    const texto = String(valor).trim();
    const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`;
    return texto;
}

function calcularDiasPeriodo(inicio, fim) {
    const ini = new Date(inicio);
    const end = new Date(fim);
    if (Number.isNaN(ini.getTime()) || Number.isNaN(end.getTime())) return "-";
    const diff = Math.round((end - ini) / 86400000) + 1;
    return diff > 0 ? `${diff} dia${diff > 1 ? "s" : ""}` : "-";
}

async function obterAtestadosPerfil(idFunc) {
    try {
        const resposta = await fetch(`/api/colaboradores/historico-atestar/${idFunc}`, {
            credentials: "same-origin"
        });

        if (!resposta.ok) return [];
        const dados = await resposta.json();
        return Array.isArray(dados) ? dados : [];
    } catch (err) {
        console.warn("Não foi possível buscar o histórico de atestados.", err);
        return [];
    }
}

function ausenciasHtml(registros) {
    if (!registros.length) {
        return `<p class="empty">Nenhum histórico de atestado carregado.</p>`;
    }

    return `
        <div class="pdf-ausencias-grid">
            ${registros.map(item => {
                const motivo = item.motivo || "Registro";
                const classe = statusKey(motivo).includes("ferias") ? "ferias" : "";
                const inicio = item.datainicio || item.data_inicio || item.periodoinicial;
                const fim = item.datafinal || item.data_final || item.periodofinal;
                return `
                    <article class="pdf-ausencia-card ${classe}">
                        <div class="pdf-ausencia-head">
                            <strong>${textoSeguro(motivo)}</strong>
                            <span>${textoSeguro(calcularDiasPeriodo(inicio, fim))}</span>
                        </div>
                        <div class="pdf-ausencia-datas">
                            <small><b>Início</b>${textoSeguro(formatarDataCurta(inicio))}</small>
                            <small><b>Final</b>${textoSeguro(formatarDataCurta(fim))}</small>
                            <small><b>Tipo</b>${classe ? "Férias" : "Licença"}</small>
                        </div>
                        <p>${textoSeguro(item.descricao || "Sem observação registrada.")}</p>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

async function obterDadosGraficoPerfil(idFunc) {
    try {
        const resposta = await fetch(`/api/colaboradores/historico-empresas/${idFunc}`, {
            credentials: "same-origin"
        });

        if (!resposta.ok) return [];
        const dados = await resposta.json();
        return Array.isArray(dados) ? dados : [];
    } catch (err) {
        console.warn("Não foi possível buscar o gráfico do perfil.", err);
        return [];
    }
}

function graficoParticipacoesHtml(dados) {
    const linhas = dados
        .map(item => ({
            cliente: item.cliente || "Cliente não informado",
            quantidade: Number(item.quantidade || 0)
        }))
        .filter(item => item.quantidade > 0)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 12);

    if (!linhas.length) {
        return `<p class="empty">Gráfico não disponível no momento.</p>`;
    }

    const maior = Math.max(...linhas.map(item => item.quantidade), 1);

    return `
        <div class="pdf-chart">
            ${linhas.map(item => {
                const largura = Math.max(4, Math.round((item.quantidade / maior) * 100));
                return `
                    <div class="pdf-chart-row">
                        <div class="pdf-chart-label">${textoSeguro(item.cliente)}</div>
                        <div class="pdf-chart-track">
                            <div class="pdf-chart-fill" style="width:${largura}%"></div>
                        </div>
                        <div class="pdf-chart-value">${textoSeguro(item.quantidade)}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function graficoParticipacoesSvgDataUri(dados) {
    const linhas = dados
        .map(item => ({
            cliente: item.cliente || "Cliente não informado",
            quantidade: Number(item.quantidade || 0)
        }))
        .filter(item => item.quantidade > 0)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

    if (!linhas.length) return "";

    const maior = Math.max(...linhas.map(item => item.quantidade), 1);
    const largura = 900;
    const alturaLinha = 42;
    const altura = 54 + linhas.length * alturaLinha;

    const rows = linhas.map((item, index) => {
        const y = 44 + index * alturaLinha;
        const barWidth = Math.max(6, Math.round((item.quantidade / maior) * 560));
        const label = textoSeguro(item.cliente).slice(0, 42);
        return `
            <text x="24" y="${y + 15}" font-size="14" font-family="Arial" font-weight="700" fill="#202020">${label}</text>
            <rect x="285" y="${y}" width="560" height="18" rx="9" fill="#e8e8e8"/>
            <rect x="285" y="${y}" width="${barWidth}" height="18" rx="9" fill="#ee7722"/>
            <text x="862" y="${y + 15}" font-size="14" font-family="Arial" font-weight="700" fill="#202020" text-anchor="end">${item.quantidade}</text>
        `;
    }).join("");

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
            <rect width="100%" height="100%" rx="14" fill="#ffffff"/>
            <text x="24" y="26" font-size="16" font-family="Arial" font-weight="700" fill="#202020">Participações por cliente</text>
            ${rows}
        </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function exportarPerfilColaboradorPDF() {
    const idFunc = textoDoElemento("#idColaborador", "") || textoDoElemento("#idColaboradorPro", "");
    if (!idFunc) {
        alert("Abra um colaborador antes de exportar o PDF.");
        return;
    }

    await carregarDadosPerfilPDF(idFunc);

    const nome = textoDoElemento("#nome", "Colaborador");
    const foto = urlAbsoluta(document.querySelector("#fotoavatar")?.src || "/imagens/user-default.webp");
    let grafico = obterImagemGraficoPerfil();
    const dadosGrafico = await obterDadosGraficoPerfil(idFunc);
    const atestados = await obterAtestadosPerfil(idFunc);
    grafico = graficoParticipacoesSvgDataUri(dadosGrafico) || grafico;
    const secoesHtml = `
        <section class="section">
            <h3>Exames ocupacionais</h3>
            ${cardsHtml(coletarCardsExames(), "Nenhum exame carregado.")}
        </section>

        <section class="section">
            <h3>Cursos e treinamentos</h3>
            ${cardsHtml(coletarCardsCursos(), "Nenhum curso carregado.")}
        </section>

        <section class="section">
            <h3>Integrações</h3>
            ${cardsHtml(coletarCardsIntegracoes(), "Nenhuma integração carregada.")}
        </section>

        <section class="section">
            <h3>EPI e vestimentas</h3>
            ${listaHtml(linhasUnicasDoContainer("#carregarEPIAqui"), "Nenhum EPI carregado.")}
        </section>

        <section class="section">
            <h3>Atestados e ausências</h3>
            ${listaHtml(linhasUnicasDoContainer(".painel_atestar"), "Nenhum histórico de atestado carregado.")}
        </section>

        <section class="section">
            <h3>Conquistas e reconhecimentos</h3>
            ${cardsHtml(coletarCardsConquistas(), "Nenhuma conquista carregada.")}
        </section>
    `;

    const secoes = normalizarSecoesPerfilPDF();
    const secoesAntigas = [
        ["Exames ocupacionais", linhasUnicasDoContainer("#carregarExamesAqui"), "Nenhum exame carregado."],
        ["Cursos e treinamentos", linhasUnicasDoContainer("#carregarCursosAqui"), "Nenhum curso carregado."],
        ["Integrações", linhasUnicasDoContainer("#carregarIntegracoesAqui"), "Nenhuma integração carregada."],
        ["EPI e vestimentas", linhasUnicasDoContainer("#carregarEPIAqui"), "Nenhum EPI carregado."],
        ["Atestados e ausências", linhasUnicasDoContainer(".painel_atestar"), "Nenhum histórico de atestado carregado."],
        ["Conquistas e reconhecimentos", linhasUnicasDoContainer(".painel_conquistas"), "Nenhuma conquista carregada."]
    ];

    const conteudo = `
        <div class="perfil-topo">
            <img src="${textoSeguro(foto)}" alt="Foto do colaborador">
            <div>
                <h2>${textoSeguro(nome)}</h2>
                <p class="empty">ID ${textoSeguro(idFunc)}</p>
            </div>
        </div>

        ${secoes.dadosPessoais ? `
            <h2>Dados pessoais</h2>
            <div class="grid-info">
                <div class="info"><span>CPF</span>${textoSeguro(textoDoElemento("#cpf"))}</div>
                <div class="info"><span>RG</span>${textoSeguro(textoDoElemento("#rg"))}</div>
                <div class="info"><span>Nascimento</span>${textoSeguro(textoDoElemento("#nascimento"))}</div>
                <div class="info"><span>Telefone</span>${textoSeguro(textoDoElemento("#telefone"))}</div>
                <div class="info"><span>E-mail</span>${textoSeguro(textoDoElemento("#mail"))}</div>
                <div class="info"><span>Sexo</span>${textoSeguro(textoSelect("#sexo"))}</div>
                <div class="info"><span>Endereço</span>${textoSeguro(textoDoElemento("#endereco"))}</div>
                <div class="info"><span>CNH</span>${textoSeguro(cnhSelecionada())}</div>
                <div class="info"><span>Empresa contratante</span>${textoSeguro(textoSelect("#empresacontrato"))}</div>
            </div>
        ` : ""}

        ${secoes.dadosProfissionais ? `
            <h2>Dados profissionais</h2>
            <div class="grid-info">
                <div class="info"><span>Setor</span>${textoSeguro(textoSelect("#selectSetor"))}</div>
                <div class="info"><span>Cargo</span>${textoSeguro(textoSelect("#selectCargo"))}</div>
                <div class="info"><span>Sobre</span>${textoSeguro(textoDoElemento("#sobremim"))}</div>
            </div>
        ` : ""}

        ${secoes.exames ? `
            <section class="section">
                <h3>Exames ocupacionais</h3>
                ${cardsHtml(coletarCardsExames(), "Nenhum exame carregado.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.cursos ? `
            <section class="section">
                <h3>Cursos e treinamentos</h3>
                ${cardsHtml(coletarCardsCursos(), "Nenhum curso carregado.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.integracoes ? `
            <section class="section">
                <h3>Integrações</h3>
                ${cardsHtml(coletarCardsIntegracoes(), "Nenhuma integração carregada.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.epis ? `
            <section class="section">
                <h3>EPI e vestimentas</h3>
                ${episHtml(coletarEpisPerfil())}
            </section>
        ` : ""}

        ${secoes.atestados ? `
            <section class="section">
                <h3>Atestados, licenças e férias</h3>
                ${ausenciasHtml(atestados)}
            </section>
        ` : ""}

        ${secoes.conquistas ? `
            <section class="section">
                <h3>Conquistas e reconhecimentos</h3>
                ${cardsHtml(coletarCardsConquistas(), "Nenhuma conquista carregada.", "pdf-card-grid-wide")}
            </section>
        ` : ""}

        ${secoes.estatistica ? `
            <section class="section">
                <h3>Histórico de participações por cliente</h3>
                ${grafico
                    ? `<img class="grafico" src="${grafico}" alt="Gráfico de participações por cliente">`
                    : `<p class="empty">Gráfico não disponível no momento.</p>`}
            </section>
        ` : ""}
    `;

    abrirDocumentoImpressao(`Perfil completo - ${nome}`, conteudo);
}

function normalizarSecoesPerfilPDF(secoes = {}) {
    const padrao = {
        dadosPessoais: true,
        dadosProfissionais: true,
        exames: true,
        cursos: true,
        integracoes: true,
        epis: true,
        atestados: true,
        conquistas: true,
        estatistica: true
    };

    return { ...padrao, ...secoes };
}

async function exportarPerfilColaboradorPDFV2(secoesSelecionadas = {}) {
    const idFunc = textoDoElemento("#idColaborador", "") || textoDoElemento("#idColaboradorPro", "");
    if (!idFunc) {
        alert("Abra um colaborador antes de exportar o PDF.");
        return;
    }

    await carregarDadosPerfilPDF(idFunc);

    const secoes = normalizarSecoesPerfilPDF(secoesSelecionadas);
    const nome = textoDoElemento("#nome", "Colaborador");
    const foto = urlAbsoluta(document.querySelector("#fotoavatar")?.src || "/imagens/user-default.webp");
    const dadosGrafico = secoes.estatistica ? await obterDadosGraficoPerfil(idFunc) : [];
    const atestados = secoes.atestados ? await obterAtestadosPerfil(idFunc) : [];
    const grafico = secoes.estatistica
        ? (graficoParticipacoesSvgDataUri(dadosGrafico) || obterImagemGraficoPerfil())
        : "";

    const conteudo = `
        <div class="perfil-topo">
            <img src="${textoSeguro(foto)}" alt="Foto do colaborador">
            <div>
                <h2>${textoSeguro(nome)}</h2>
                <p class="empty">ID ${textoSeguro(idFunc)}</p>
            </div>
        </div>

        ${secoes.dadosPessoais ? `
            <h2>Dados pessoais</h2>
            <div class="grid-info">
                <div class="info"><span>CPF</span>${textoSeguro(textoDoElemento("#cpf"))}</div>
                <div class="info"><span>RG</span>${textoSeguro(textoDoElemento("#rg"))}</div>
                <div class="info"><span>Nascimento</span>${textoSeguro(textoDoElemento("#nascimento"))}</div>
                <div class="info"><span>Telefone</span>${textoSeguro(textoDoElemento("#telefone"))}</div>
                <div class="info"><span>E-mail</span>${textoSeguro(textoDoElemento("#mail"))}</div>
                <div class="info"><span>Sexo</span>${textoSeguro(textoSelect("#sexo"))}</div>
                <div class="info"><span>Endereço</span>${textoSeguro(textoDoElemento("#endereco"))}</div>
                <div class="info"><span>CNH</span>${textoSeguro(cnhSelecionada())}</div>
                <div class="info"><span>Empresa contratante</span>${textoSeguro(textoSelect("#empresacontrato"))}</div>
            </div>
        ` : ""}

        ${secoes.dadosProfissionais ? `
            <h2>Dados profissionais</h2>
            <div class="grid-info">
                <div class="info"><span>Setor</span>${textoSeguro(textoSelect("#selectSetor"))}</div>
                <div class="info"><span>Cargo</span>${textoSeguro(textoSelect("#selectCargo"))}</div>
                <div class="info"><span>Sobre</span>${textoSeguro(textoDoElemento("#sobremim"))}</div>
            </div>
        ` : ""}

        ${secoes.exames ? `
            <section class="section">
                <h3>Exames ocupacionais</h3>
                ${cardsHtml(coletarCardsExames(), "Nenhum exame carregado.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.cursos ? `
            <section class="section">
                <h3>Cursos e treinamentos</h3>
                ${cardsHtml(coletarCardsCursos(), "Nenhum curso carregado.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.integracoes ? `
            <section class="section">
                <h3>Integrações</h3>
                ${cardsHtml(coletarCardsIntegracoes(), "Nenhuma integração carregada.", "pdf-card-grid-compact")}
            </section>
        ` : ""}

        ${secoes.epis ? `
            <section class="section">
                <h3>EPI e vestimentas</h3>
                ${episHtml(coletarEpisPerfil())}
            </section>
        ` : ""}

        ${secoes.atestados ? `
            <section class="section">
                <h3>Atestados, licenças e férias</h3>
                ${ausenciasHtml(atestados)}
            </section>
        ` : ""}

        ${secoes.conquistas ? `
            <section class="section">
                <h3>Conquistas e reconhecimentos</h3>
                ${cardsHtml(coletarCardsConquistas(), "Nenhuma conquista carregada.", "pdf-card-grid-wide")}
            </section>
        ` : ""}

        ${secoes.estatistica ? `
            <section class="section">
                <h3>Histórico de participações por cliente</h3>
                ${grafico
                    ? `<img class="grafico" src="${grafico}" alt="Gráfico de participações por cliente">`
                    : `<p class="empty">Gráfico não disponível no momento.</p>`}
            </section>
        ` : ""}
    `;

    abrirDocumentoImpressao(`Perfil completo - ${nome}`, conteudo);
}

window.exportarResumoRHPDF = exportarResumoRHPDF;
window.exportarPerfilColaboradorPDF = exportarPerfilColaboradorPDFV2;
