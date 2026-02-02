/* ===============================
   CONFIGURAÇÕES
================================ */
export function initFerias() {

    $('#mesSelecionado').on('change', async function () {
        const [ano, mes] = this.value.split('-').map(Number);

        const { inicio, fim } = getIntervaloVisivel(ano, mes - 1);

        // 1️⃣ busca dados primeiro
        await carregarFerias(inicio, fim);

        // 2️⃣ depois cria estrutura baseada nos colaboradores
        gerarMeses(ano, mes - 1);

        // 3️⃣ renderiza férias explicitamente
        renderFerias();
    });




    /* MENU CONTEXTO (STATUS VISUAL) */
    $(document).on('contextmenu', '.barra-ferias', function (e) {
        e.preventDefault();

        const barra = $(this);
        const colabId = barra.data('colab');
        const periodoId = barra.data('periodo');

        menuContexto.colabId = colabId;
        menuContexto.periodoId = periodoId;

        const colab = colaboradores.find(c => c.id === colabId);
        const periodo = colab.ferias.find(f => f.id === periodoId);

        // 🔥 REGRA ESPECIAL PARA SUGESTÃO
        if (periodo.status === 'sugerida') {
            $('#menu-status [data-status="reprovado"]').hide();
        } else {
            $('#menu-status div').show();
        }

        $('#menu-status')
            .css({ top: e.clientY - 20, left: e.clientX })
            .show();
    });

    $('#menu-status div').on('click', function () {
        const novoStatus = $(this).data('status');
        const acao = $(this).data('acao');
        const { colabId, periodoId } = menuContexto;

        const colab = colaboradores.find(c => c.id === colabId);
        const periodo = colab.ferias.find(f => f.id === periodoId);

        // 🗑 EXCLUIR FÉRIAS
        if (acao === 'excluir') {

            if (periodo.status === 'sugerida') {
                colab.ferias = colab.ferias.filter(f => f.id !== periodoId);
                renderFerias();
                $('#menu-status').hide();
                return;
            }

            if (!confirm('Tem certeza que deseja apagar este período de férias?')) {
                return;
            }

            fetch(`/api/ferias/${periodoId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
                .then(() => carregarFerias());

            $('#menu-status').hide();
            return;
        }

        // 💡 SUGESTÃO
        if (periodo.status === 'sugerida') {

            if (novoStatus !== 'aprovado') {
                colab.ferias = colab.ferias.filter(f => f.id !== periodoId);
                renderFerias();
                $('#menu-status').hide();
                return;
            }

            apiFetch('/api/ferias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // ❌ REMOVE Authorization (sessão ≠ token)
                },
                body: JSON.stringify({
                    id_func: colabId,
                    data_inicio: periodo.inicio.toISOString().slice(0, 10),
                    data_fim: periodo.fim.toISOString().slice(0, 10),
                    status: 'aprovado'
                })
            })
                .then(() => carregarFerias())
                .catch(err => {
                    console.error(err);
                    // redirect já foi tratado no apiFetch
                });

            $('#menu-status').hide();
            return;
        }


        // 📌 FÉRIAS REAIS → STATUS
        fetch(`/api/ferias/${periodoId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: novoStatus })
        })
            .then(() => carregarFerias());

        $('#menu-status').hide();
    });

    $(document).on('click', function () {
        $('#menu-status').hide();
    });

    // 🔑 SETA MÊS ATUAL E DISPARA O FLUXO CORRETO
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    const seletor = document.getElementById("mesSelecionado");

    if (seletor) {
        seletor.value = mesAtual;
        seletor.dispatchEvent(new Event("change"));
    } else {
        console.warn("⚠️ Não encontrei #mesSelecionado no DOM");
    }
}




/* ===============================
   CONSTANTES
================================ */
const LARGURA_DIA = 57;
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ===============================
   DADOS
================================ */
let colaboradores = [];

/* ===============================
   CARREGAR FÉRIAS (BACKEND)
================================ */
async function carregarFerias(inicio, fim) {

    let url = '/api/ferias';

    if (inicio && fim) {
        url += `?inicio=${inicio.toISOString().slice(0, 10)}&fim=${fim.toISOString().slice(0, 10)}`;
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!res.ok) {
        console.error('Erro ao carregar férias');
        return;
    }

    const dados = await res.json();

    colaboradores = dados.map(c => ({
        ...c,
        ciclos: c.ciclos.map(ci => ({
            ...ci,
            aquisitivoInicio: new Date(ci.aquisitivoInicio),
            aquisitivoFim: new Date(ci.aquisitivoFim),
            concessivoFim: new Date(ci.concessivoFim),
            concessivoInicio: new Date(ci.concessivoInicio),
        })),
        ferias: c.ferias.map(f => ({
            ...f,
            inicio: new Date(f.inicio),
            fim: new Date(f.fim),
            status: f.status || 'avaliar'
        }))
    }));

    renderFerias();
}

/* ===============================
   UTILITÁRIOS
================================ */
function diasNoMes(ano, mes) {
    return new Date(ano, mes + 1, 0).getDate();
}

function addDias(data, qtd) {
    const d = new Date(data);
    d.setDate(d.getDate() + qtd);
    return d;
}

/* ===============================
   CICLO / ALERTAS CLT
================================ */
function getCicloDoPeriodo(colab, periodo) {
    // sempre retorna o ciclo atual (único existente)
    return colab.ciclos && colab.ciclos.length
        ? colab.ciclos[0]
        : null;
}


function isPeriodoEmAlerta(periodo, ciclo) {

    const hoje = new Date();

    // ❌ férias já encerradas nunca entram em alerta
    if (periodo.fim < hoje) return false;

    if (!ciclo) return false;
    if (!ciclo.cicloAtual) return false;
    if (periodo.status === 'sugerida') return false;

    // alerta somente se ESTIVER vencendo
    return hoje > ciclo.concessivoFim || hoje < ciclo.concessivoInicio;
}


function isFeriasVencidas(colab, ciclo) {
    if (!ciclo) return false;

    const hoje = new Date();
    if (hoje <= ciclo.concessivoFim) return false;

    const diasUsados = colab.ferias.reduce((acc, f) => {
        if (
            f.inicio >= ciclo.aquisitivoInicio &&
            f.inicio <= ciclo.concessivoFim
        ) {
            const dias = Math.round((f.fim - f.inicio) / 86400000) + 1;
            return acc + dias;
        }
        return acc;
    }, 0);

    return diasUsados < 30;
}


function getTooltipPeriodo(periodo, colab, ciclo, emAlerta) {

    if (isFeriasVencidas(colab, ciclo)) {
        return 'Férias vencidas – pagamento em dobro (CLT)';
    }

    if (emAlerta) {
        return 'Fora do período permitido pela CLT';
    }

    switch (periodo.status) {
        case 'aprovado':
            return 'Férias aprovadas – alteração bloqueada';
        case 'avaliar':
            return 'Férias em ajuste / aguardando aprovação';
        case 'reprovado':
            return 'Férias reprovadas - avaliar nova data';
        default:
            return 'Sugestão de férias pelo sistema';
    }
}


function getTextoSaldoCiclo(ciclo) {

    if (!ciclo) return ' ';

    // 🟢 ciclo encerrado → mostra data
    if (ciclo.cicloEncerradoEm) {
        return `Ciclo encerrado em ${new Date(ciclo.cicloEncerradoEm).toLocaleDateString('pt-BR')
            }`;
    }

    // 🟡 ciclo atual → mostra saldo
    if (ciclo.saldo) {
        return `
Saldo do ciclo:
• Usados: ${ciclo.saldo.diasUsados} dias
• Restantes: ${ciclo.saldo.diasRestantes} dias
• Períodos: ${ciclo.saldo.quantidadePeriodos} / 3
`.trim();
    }

    // fallback seguro (nunca vazio)
    return ' ';
}




/* ===============================
   STATUS / ÍCONE
================================ */
function getClasseStatus(status) {
    return {
        avaliar: 'status-avaliar',
        aprovado: 'status-aprovado',
        reprovado: 'status-reprovado',
        sugerida: 'status-sugerida'
    }[status];
}

function getIconePeriodo(periodo, colab, ciclo, emAlerta) {

    // 🔥 PRIORIDADE MÁXIMA – regras CLT
    if (isFeriasVencidas(colab, ciclo)) return '💰';
    if (emAlerta) return '⚠️';

    // 💡 sugestão (não é férias real)
    if (periodo.status === 'sugerida') return '💡';

    // 📌 status normal
    switch (periodo.status) {
        case 'aprovado': return '🔒';
        case 'avaliar': return '🔓';
        case 'reprovado': return '❌';
        default: return '';
    }
}

function getIntervaloVisivel(ano, mes) {
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes + 2, 0);
    return { inicio, fim };
}

/* ===============================
   CALENDÁRIO
================================ */
function gerarMeses(anoBase, mesBase) {
    $('#tabela-ferias').empty();

    const inicioVisivel = new Date(anoBase, mesBase - 1, 1);
    const fimVisivel = new Date(anoBase, mesBase + 2, 0);

    for (let offset = -1; offset <= 1; offset++) {
        let mes = mesBase + offset;
        let ano = anoBase;

        if (mes < 0) { mes = 11; ano--; }
        if (mes > 11) { mes = 0; ano++; }

        const qtdDias = diasNoMes(ano, mes);

        const mesDiv = $('<div class="mes"></div>');
        mesDiv.append(`<div class="titulo-mes">${mes + 1}/${ano}</div>`);

        const linhaDias = $('<div class="linha-dias"></div>')
            .css('grid-template-columns', `repeat(${qtdDias}, ${LARGURA_DIA}px)`);

        for (let d = 1; d <= qtdDias; d++) {
            const data = new Date(ano, mes, d);
            linhaDias.append(`
                <div class="dia">
                    <div class="num-dia">${d}</div>
                    <div class="dia-semana">${DIAS_SEMANA[data.getDay()]}</div>
                </div>
            `);
        }

        mesDiv.append(linhaDias);

        colaboradores.forEach(colab => {
            const aparece = colab.ferias.some(p =>
                p.inicio <= fimVisivel && p.fim >= inicioVisivel
            );

            if (!aparece) return;

            mesDiv.append(`
                <div class="linha-colaborador"
                     data-colab="${colab.id}"
                     data-ano="${ano}"
                     data-mes="${mes}">
                    <div class="colaborador-grade"
                         style="grid-template-columns: repeat(${qtdDias}, ${LARGURA_DIA}px);">
                    </div>
                </div>
            `);
        });

        $('#tabela-ferias').append(mesDiv);
    }
}

/* ===============================
   RENDERIZA FÉRIAS
================================ */
function renderFerias() {
    $('.colaborador-grade').empty();
    colaboradores.forEach(colab => {
        colab.ferias.forEach(periodo => {
            const ciclo = getCicloDoPeriodo(colab, periodo);
            const emAlerta = isPeriodoEmAlerta(periodo, ciclo);
            const classe = getClasseStatus(periodo.status);
            const icone = getIconePeriodo(periodo, colab, ciclo, emAlerta);

            $('.linha-colaborador[data-colab="' + colab.id + '"]').each(function () {
                const linha = $(this);
                const ano = linha.data('ano');
                const mes = linha.data('mes');
                const grade = linha.find('.colaborador-grade');

                const inicioMes = new Date(ano, mes, 1);
                const fimMes = new Date(ano, mes + 1, 0);

                const segInicio = periodo.inicio > inicioMes ? periodo.inicio : inicioMes;
                const segFim = periodo.fim < fimMes ? periodo.fim : fimMes;

                if (segInicio <= segFim) {
                    const diaInicio = segInicio.getDate();
                    const duracao =
                        Math.round((segFim - segInicio) / 86400000) + 0.7;

                    const tooltipStatus = getTooltipPeriodo(periodo, colab, ciclo, emAlerta);
                    const tooltipSaldo = getTextoSaldoCiclo(ciclo);

                    const barra = $(`
                    <div class="barra-ferias ${classe} ${emAlerta ? 'status-alerta' : ''}"
                        data-colab="${colab.id}"
                        data-periodo="${periodo.id}">

                        <div class="barra-esquerda">
                            <img class="barra-foto"
                                src="${colab.fotoperfil}?v=${colab.versao_foto}"
                                onerror="this.src='/imagens/user-default.webp'">
                            <span class="barra-nome">
                                ${colab.nome}
                            </span>
                        </div>

                        <div class="barra-direita">
                            <span class="barra-icone barra-info"
                                data-tooltip="${tooltipSaldo}">ℹ️</span>

                            <span class="barra-icone"
                                data-tooltip="${tooltipStatus}">${icone}</span>
                        </div>
                    </div>
                `).css({
                        left: (diaInicio - 1) * LARGURA_DIA,
                        width: duracao * LARGURA_DIA
                    });


                    grade.append(barra);
                    initDragBarra(barra, colab.id, periodo.id);
                }
            });
        });
    });
}

/* ===============================
   DRAG & DROP
================================ */
function initDragBarra(barra, colabId, periodoId) {
    const colab = colaboradores.find(c => c.id === colabId);
    const periodo = colab.ferias.find(f => f.id === periodoId);

    if (periodo.status === 'aprovado') {
        barra.addClass('barra-bloqueada');
        return;
    }
    if (periodo.status === 'sugerida') {
        barra.addClass('barra-bloqueada');
        return;
    }
    let ultimoDia = null;

    barra.draggable({
        axis: "x",
        grid: [LARGURA_DIA, 0],

        start: function (e, ui) {
            ultimoDia = Math.round(ui.position.left / LARGURA_DIA) + 1;
        },

        drag: function (e, ui) {
            const diaAtual = Math.round(ui.position.left / LARGURA_DIA) + 1;
            const delta = diaAtual - ultimoDia;

            if (delta !== 0) {
                periodo.inicio = addDias(periodo.inicio, delta);
                periodo.fim = addDias(periodo.fim, delta);
                ultimoDia = diaAtual;
            }
        },

        stop: function () {
            salvarFerias(colabId, periodoId);
            renderFerias();
        }
    });
}

/* ===============================
   SALVAR (BACKEND)
================================ */
function salvarFerias(colabId, periodoId) {
    const colab = colaboradores.find(c => c.id === colabId);
    const periodo = colab.ferias.find(f => f.id === periodoId);

    fetch(`/api/ferias/${periodoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            data_inicio: periodo.inicio,
            data_fim: periodo.fim
        })
    });
}

/* ===============================
   MENU CONTEXTO
================================ */
let menuContexto = {
    colabId: null,
    periodoId: null
};
