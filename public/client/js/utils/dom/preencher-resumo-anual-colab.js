function dataLocal(ano, mes, dia) {
    return new Date(ano, mes, dia);
}

function isoDaData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function lerIso(valor) {
    if (!valor) return '';
    return String(valor).slice(0, 10);
}

function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function adicionarDias(data, quantidade) {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + quantidade);
    return novaData;
}

function tipoInterrupcao(motivo) {
    const texto = normalizarTexto(motivo);

    if (texto.includes('ferias') || texto.includes('maternidade') || texto.includes('paternidade')) {
        return 'licenca';
    }

    const naoJustificada = texto.includes('nao justific') || texto.includes('indevida');
    if (!naoJustificada && (texto.includes('atestado') || texto.includes('justific'))) {
        return 'justificada';
    }

    if (
        texto.includes('afast') ||
        texto.includes('falta') ||
        texto.includes('atestado') ||
        texto.includes('licenca') ||
        texto.includes('saude')
    ) {
        return 'ausencia';
    }

    return null;
}

function textoData(data) {
    return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

function escaparHtml(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function usuarioPodeVerAlerta() {
    const nivel = String(sessionStorage.getItem('nivel_acesso') || '');
    return ['5', '6', '7', '99'].includes(nivel);
}

function pertenceProducao(nomeSetor) {
    return String(nomeSetor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim() === 'producao';
}

function obterDriver() {
    return window.driver?.js?.driver || window.driver?.driver;
}

function carregarDriverSobDemanda() {
    const existente = obterDriver();
    if (typeof existente === 'function') return Promise.resolve(existente);
    if (window.resumoAnualDriverPromise) return window.resumoAnualDriverPromise;

    window.resumoAnualDriverPromise = new Promise((resolve, reject) => {
        if (!document.querySelector('link[data-resumo-driver-css]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.css';
            link.dataset.resumoDriverCss = 'true';
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.js.iife.js';
        script.onload = () => {
            const driver = obterDriver();
            if (typeof driver === 'function') resolve(driver);
            else reject(new Error('Driver.js indisponivel'));
        };
        script.onerror = () => reject(new Error('Falha ao carregar o Driver.js'));
        document.head.appendChild(script);
    });

    return window.resumoAnualDriverPromise;
}

function prepararTourResumoAnual() {
    const botao = document.getElementById('btnGuiaResumoAnual');
    if (!botao || botao.dataset.tourBound === 'true') return;

    botao.dataset.tourBound = 'true';
    botao.addEventListener('click', async () => {
        try {
            const driverFactory = await carregarDriverSobDemanda();
            const steps = [
                {
                    element: '#resumoAnualColab',
                    popover: {
                        title: 'Resumo anual',
                        description: 'Este painel consolida os dias do ano para acompanhar presenca e registros do colaborador.'
                    }
                },
                {
                    element: '#resumoAnualBarra',
                    popover: {
                        title: 'Barra de 365 dias',
                        description: 'As cores sao agrupadas proporcionalmente: verde para trabalho, roxo para falta justificada, vermelho para falta nao justificada ou dia util sem OS, azul para trabalho em feriado ou fim de semana, amarelo para licencas e cinza para folgas e dias ainda a apurar.'
                    }
                },
                {
                    element: '#resumoAnualPercentual',
                    popover: {
                        title: 'Percentual',
                        description: 'O percentual considera os dias avaliados. Fins de semana, feriados nao trabalhados e periodos amarelos nao reduzem o resultado.'
                    }
                },
                {
                    element: '#resumoAnualContagem',
                    popover: {
                        title: 'Totais do periodo',
                        description: 'Mostra quantos dias ja passaram, quantos foram avaliados, os dias positivos, pendentes, descontados e os que ainda estao a apurar.'
                    }
                }
            ];

            if (!document.getElementById('resumoAnualAlerta')?.hidden) {
                steps.push({
                    element: '#resumoAnualAlerta',
                    popover: {
                        title: 'Alerta para Gerencia',
                        description: 'Quando o percentual fica abaixo de 75%, este aviso orienta a Gerencia a avaliar o contexto dos registros.'
                    }
                });
            }

            const tour = driverFactory({
                showProgress: true,
                animate: true,
                allowClose: true,
                overlayColor: '#000000',
                overlayOpacity: 0.78,
                nextBtnText: 'Proximo',
                prevBtnText: 'Voltar',
                doneBtnText: 'Concluir',
                progressText: '{{current}} de {{total}}',
                popoverClass: 'resumo-anual-tour',
                steps
            });

            tour.drive();
        } catch (erro) {
            console.warn('Tour do resumo anual indisponivel:', erro.message);
            if (window.Swal) {
                Swal.fire({
                    icon: 'info',
                    theme: 'dark',
                    title: 'Resumo anual',
                    text: 'A barra reune os dias do ano por cor. Passe o mouse sobre os blocos vermelho e azul para ver as datas.'
                });
            }
        }
    });
}

function faixaPercentual(percentual) {
    if (percentual < 60) return 'critico';
    if (percentual < 70) return 'baixo';
    if (percentual < 80) return 'atencao';
    if (percentual < 90) return 'observacao';
    return 'bom';
}

function montarDiasResumo(dados, dataAdmissao) {
    const ano = Number(dados.ano);
    const primeiroDia = dataLocal(ano, 0, 1);
    const hoje = new Date();
    const hojeDoAno = hoje.getFullYear() === ano
        ? dataLocal(ano, hoje.getMonth(), hoje.getDate())
        : (hoje.getFullYear() > ano ? dataLocal(ano, 11, 31) : dataLocal(ano, 0, 0));
    const admissaoIso = lerIso(dataAdmissao);
    const trabalhados = new Set((dados.trabalhados || []).map(lerIso));
    const feriados = new Set((dados.feriados || []).map(feriado => lerIso(feriado.data)));
    const interrupcoes = (dados.interrupcoes || []).map(interrupcao => ({
        inicio: lerIso(interrupcao.inicio),
        fim: lerIso(interrupcao.fim),
        tipo: tipoInterrupcao(interrupcao.motivo),
        motivo: interrupcao.motivo,
        descricao: interrupcao.descricao
    })).filter(interrupcao => interrupcao.tipo);
    const dias = [];
    const quantidadeDias = Math.round((dataLocal(ano + 1, 0, 1) - primeiroDia) / 86400000);

    for (let indice = 0; indice < quantidadeDias; indice += 1) {
        const data = adicionarDias(primeiroDia, indice);
        const diaIso = isoDaData(data);
        const finalDeSemana = data.getDay() === 0 || data.getDay() === 6;
        const feriado = feriados.has(diaIso);
        const futuro = data > hojeDoAno;
        const foraDoVinculo = Boolean(admissaoIso && diaIso < admissaoIso);
        const interrupcao = interrupcoes.find(item => diaIso >= item.inicio && diaIso <= item.fim);
        let tipo = 'futuro';

        if (futuro || foraDoVinculo) tipo = 'futuro';
        else if (interrupcao) tipo = interrupcao.tipo;
        else if (trabalhados.has(diaIso)) tipo = finalDeSemana || feriado ? 'especial' : 'trabalhado';
        else if (finalDeSemana || feriado) tipo = 'descanso';
        else tipo = 'ausencia';

        dias.push({ data, diaIso, tipo, finalDeSemana, feriado, interrupcao });
    }

    return dias;
}

function renderizarResumoAnual(dados, dataAdmissao) {
    const $painel = $('#resumoAnualColab');
    if (!$painel.length) return;

    const dias = montarDiasResumo(dados, dataAdmissao);
    const contagem = dias.reduce((total, dia) => {
        if (dia.tipo in total) total[dia.tipo] += 1;
        return total;
    }, { trabalhado: 0, especial: 0, justificada: 0, ausencia: 0, licenca: 0, descanso: 0, futuro: 0 });
    const diasAvaliados = contagem.trabalhado + contagem.especial + contagem.ausencia + contagem.justificada;
    const diasPositivos = contagem.trabalhado + contagem.especial;
    const percentual = diasAvaliados ? (diasPositivos / diasAvaliados) * 100 : 0;
    const percentualFormatado = `${percentual.toFixed(2).replace('.', ',')}%`;
    const classePercentual = faixaPercentual(percentual);
    const diasAteHoje = dias.filter(dia => dia.tipo !== 'futuro').length;
    const grupos = [
        { tipo: 'trabalhado', quantidade: contagem.trabalhado, titulo: 'dias trabalhados' },
        { tipo: 'justificada', quantidade: contagem.justificada, titulo: 'faltas justificadas' },
        { tipo: 'ausencia', quantidade: contagem.ausencia, titulo: 'faltas nao justificadas ou dias sem OS' },
        { tipo: 'especial', quantidade: contagem.especial, titulo: 'dias trabalhados em fim de semana/feriado' },
        { tipo: 'licenca', quantidade: contagem.licenca, titulo: 'dias de ferias/licenca descontados' },
        { tipo: 'descanso', quantidade: contagem.descanso + contagem.futuro, titulo: 'dias de folga, feriado ou ainda a apurar' }
    ];
    const segmentos = grupos
        .filter(grupo => grupo.quantidade > 0)
        .map(grupo => {
            const largura = (grupo.quantidade / dias.length) * 100;
            const datasDetalhadas = ['justificada', 'ausencia', 'especial'].includes(grupo.tipo)
                ? dias
                    .filter(dia => dia.tipo === grupo.tipo)
                    .map(dia => textoData(dia.data))
                    .join(', ')
                : '';
            const detalhe = datasDetalhadas ? `\nDatas: ${datasDetalhadas}` : '';
            const titulo = `${grupo.quantidade} ${grupo.titulo}${detalhe}`;
            return `<span class="resumoAnualDia ${grupo.tipo}" style="width:${largura.toFixed(4)}%" title="${escaparHtml(titulo)}"></span>`;
        })
        .join('');

    $painel.removeAttr('hidden');
    prepararTourResumoAnual();
    $('#resumoAnualAno').text(`Resumo de ${dados.ano}`);
    $('#resumoAnualPercentual')
        .removeClass('bom observacao atencao baixo critico')
        .addClass(classePercentual)
        .text(percentualFormatado);
    $('#resumoAnualBarra')
        .css('--dias-ano', dias.length)
        .attr('aria-label', `Resumo anual: ${percentualFormatado} dos dias avaliados`)
        .html(segmentos);
    $('#resumoAnualContagem').text(
        `${diasAteHoje}/${dias.length} dias | ${diasAvaliados} avaliados | ${diasPositivos} positivos | ${contagem.justificada} justificadas | ${contagem.ausencia} nao justificadas | ${contagem.licenca} descontados | ${contagem.futuro} a apurar`
    );

    const $alerta = $('#resumoAnualAlerta');
    if (percentual < 75 && diasAvaliados >= 20 && usuarioPodeVerAlerta()) {
        $alerta.removeAttr('hidden');
    } else {
        $alerta.attr('hidden', 'hidden');
    }
}

export async function carregarResumoAnualColaborador(id, dataAdmissao, nomeSetor) {
    const $painel = $('#resumoAnualColab');
    if (!$painel.length || !id) return;
    if (!pertenceProducao(nomeSetor)) {
        $painel.attr('hidden', 'hidden');
        return;
    }

    try {
        const resposta = typeof window.apiFetch === 'function'
            ? await window.apiFetch(`/api/colaboradores/resumo-anual/${id}`)
            : await fetch(`/api/colaboradores/resumo-anual/${id}`, { credentials: 'include' });

        if (!resposta.ok) throw new Error('Nao foi possivel carregar o resumo anual');
        renderizarResumoAnual(await resposta.json(), dataAdmissao);
    } catch (erro) {
        console.warn('Resumo anual do colaborador indisponivel:', erro.message);
        $painel.attr('hidden', 'hidden');
    }
}
