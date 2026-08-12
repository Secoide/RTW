const MAPA_CONQUISTAS = {
    CIPA: {
        icone: '♻️',
        nome: 'Membro da CIPA',
        descricao: 'Participa da Comissão Interna de Prevenção de Acidentes.'
    },
    BRIGADISTA: {
        icone: '⛑️',
        nome: 'Brigadista',
        descricao: 'Integrante da Brigada de Emergência da empresa.'
    },
    DESTAQUE_MES: {
        icone: '🏅',
        nome: 'Destaque do Mês',
        descricao: 'Reconhecimento mensal por desempenho, postura, entrega ou contribuição acima do esperado.'
    },
    DESTAQUE_ANO: {
        icone: '🏆',
        nome: 'Destaque do Ano',
        descricao: 'Reconhecimento anual para colaborador com grande impacto, constância e contribuição para a equipe.'
    },
    INOVADOR: {
        icone: '💡',
        nome: 'Inovador',
        descricao: 'Concedida a colaboradores que criaram melhorias, automações ou processos que geraram resultados positivos.'
    },
    ESPIRITO_EQUIPE: {
        icone: '🤝',
        nome: 'Espírito de Equipe',
        descricao: 'Reconhece colaboradores que promovem colaboração, respeito e ajudam seus colegas constantemente.'
    },
    HEROI_SEGURANCA: {
        icone: '🚨',
        nome: 'Herói da Segurança',
        descricao: 'Concedida por atitudes relevantes de prevenção de acidentes e promoção da segurança.'
    },
    MENTOR: {
        icone: '🎓',
        nome: 'Mentor',
        descricao: 'Reconhece profissionais que compartilham conhecimento e desenvolvem outros colaboradores.'
    },
    EMBAIXADOR: {
        icone: '🌎',
        nome: 'Embaixador',
        descricao: 'Representa a empresa de forma exemplar perante clientes, fornecedores e parceiros.'
    },
    CLIENTE_DESTAQUE: {
        icone: '💬',
        nome: 'Elogiado pelo Cliente',
        descricao: 'Conquista recebida através de elogios e reconhecimentos formais dos clientes.'
    },
    RESOLVE_TUDO: {
        icone: '🧩',
        nome: 'Resolve Tudo',
        descricao: 'Reconhece profissionais que encontram soluções para desafios complexos do dia a dia.'
    },
    LIDERANCA: {
        icone: '👔',
        nome: 'Liderança Inspiradora',
        descricao: 'Concedida a líderes que influenciam positivamente suas equipes pelo exemplo.'
    },
    SUPERACAO: {
        icone: '🏔️',
        nome: 'Superação',
        descricao: 'Reconhece colaboradores que superaram desafios importantes durante sua trajetória.'
    },
    ORGULHO_RTW: {
        icone: '❤️',
        nome: 'Orgulho RTW',
        descricao: 'Uma das maiores honrarias concedidas pela empresa.'
    },
    SOLUCAO_INTELIGENTE: {
        icone: '🧠',
        nome: 'Solução Inteligente',
        descricao: 'Reconhece soluções criativas e eficientes para problemas complexos.'
    },
    CORUJA_RTW: {
        icone: '🦉',
        nome: 'Coruja',
        descricao: 'Reconhece colaboradores que demonstram dedicação excepcional em atividades realizadas durante períodos noturnos, paradas de manutenção ou atendimentos fora do horário convencional.'
    },
    PRECISAO_RTW: {
        icone: '🎯',
        nome: 'Precisão',
        descricao: 'Concedida a profissionais que executam suas atividades com elevado padrão de qualidade, baixa incidência de retrabalho e atenção aos detalhes.'
    },
    ORGANIZACAO_EXEMPLAR: {
        icone: '📋',
        nome: 'Organização Exemplar',
        descricao: 'Reconhecimento destinado aos colaboradores que mantêm documentação, materiais, ferramentas e informações organizadas de forma exemplar.'
    },
    RESPOSTA_RAPIDA: {
        icone: '⚡',
        nome: 'Resposta Rápida',
        descricao: 'Concedida a profissionais que demonstram agilidade no atendimento de demandas urgentes, emergências e situações críticas.'
    },
    COMUNICADOR_RTW: {
        icone: '📡',
        nome: 'Comunicador',
        descricao: 'Reconhece colaboradores que mantêm comunicação clara, objetiva e eficiente com clientes, colegas e lideranças.'
    },
    ALTA_PERFORMANCE: {
        icone: '🦾',
        nome: 'Alta Performance',
        descricao: 'Destinada aos profissionais que mantêm desempenho acima da média, entregando resultados consistentes e de alto impacto para a empresa.'
    },
    PONTUALIDADE_OURO: {
        icone: '⏱️',
        nome: 'Pontualidade de Ouro',
        descricao: 'Concedida aos colaboradores que demonstram elevado compromisso com horários, prazos e compromissos assumidos.'
    },
    GUARDIAO_QUALIDADE: {
        icone: '🔐',
        nome: 'Guardião da Qualidade',
        descricao: 'Reconhece profissionais que contribuem continuamente para a excelência dos serviços, mantendo elevados padrões de qualidade e confiabilidade.'
    }
};

function escapeAttr(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function aplicarTooltipsConquistas() {
    const $select = $('#cbxConquista');

    if (!$select.length)
        return;

    let $tooltip = $('body').find('#conquistaSelectTooltip');

    if (!$tooltip.length) {
        $tooltip = $('<div id="conquistaSelectTooltip" class="conquista-select-tooltip" aria-hidden="true"></div>');
        $('body').append($tooltip);
    }

    $select.find('option[value]').each(function () {
        const item = MAPA_CONQUISTAS[this.value];
        if (!item)
            return;

        this.title = `${item.nome}: ${item.descricao}`;
    });

    const montarTextoTooltip = () => {
        const item = MAPA_CONQUISTAS[$select.val()];

        if (!item)
            return {
                titulo: 'Conquistas e medalhas',
                descricao: 'Selecione uma conquista para ver a descrição antes de adicionar.'
            };

        return {
            titulo: `${item.icone} ${item.nome}`,
            descricao: item.descricao
        };
    };

    const atualizarTooltip = () => {
        const texto = montarTextoTooltip();
        $select.attr('title', `${texto.titulo}: ${texto.descricao}`);
        $tooltip.html(`
            <strong>${escapeAttr(texto.titulo)}</strong>
            <span>${escapeAttr(texto.descricao)}</span>
        `);
    };

    const posicionarTooltip = () => {
        const el = $select.get(0);
        if (!el)
            return;

        const rect = el.getBoundingClientRect();
        const largura = Math.min(420, Math.max(260, rect.width));
        const margem = 10;
        const left = Math.min(
            Math.max(margem, rect.left),
            window.innerWidth - largura - margem
        );
        const top = Math.min(
            rect.bottom + 8,
            window.innerHeight - $tooltip.outerHeight() - margem
        );

        $tooltip.css({
            width: `${largura}px`,
            left: `${left}px`,
            top: `${top}px`
        });
    };

    const mostrarTooltip = () => {
        atualizarTooltip();
        posicionarTooltip();
        $tooltip.addClass('visivel').attr('aria-hidden', 'false');
    };

    const ocultarTooltip = () => {
        $tooltip.removeClass('visivel').attr('aria-hidden', 'true');
    };

    $select
        .off('change.conquistasTooltip mouseenter.conquistasTooltip focus.conquistasTooltip mouseleave.conquistasTooltip blur.conquistasTooltip')
        .on('change.conquistasTooltip mouseenter.conquistasTooltip focus.conquistasTooltip', mostrarTooltip)
        .on('mouseleave.conquistasTooltip blur.conquistasTooltip', ocultarTooltip);

    mostrarTooltip();
}

export function initaddConquistas() {
    $(document).off(
        'click.conquistas',
        '#btAdicionarConquista'
    ).on(
        'click.conquistas',
        '#btAdicionarConquista',
        async function () {
            const $botao = $(this);

            if ($botao.data('salvando'))
                return;

            try {
                $botao.data('salvando', true);

                const id_colaborador =
                    $('#idColaborador')
                        .val();

                const tipo =
                    $('#cbxConquista')
                        .val();

                const data_conquista =
                    $('#dataConquista')
                        .val();

                if (!tipo) {

                    alert(
                        'Selecione uma conquista'
                    );

                    return;

                }

                await $.post(

                    '/api/colaboradores/conquista',

                    {

                        id_colaborador,

                        tipo,

                        data_conquista

                    }

                );
                await carregarConquistasColaborador(
                    id_colaborador
                );

                $('#dataConquista').val(new Date().toISOString().slice(0, 10));

                alert(
                    'Conquista adicionada'
                );

            } catch (err) {

                console.error(err);

            } finally {

                $botao.data('salvando', false);

            }

        }
    );

    $(document)
        .off('mouseenter.conquistasTooltip focusin.conquistasTooltip change.conquistasTooltip', '#cbxConquista')
        .on('mouseenter.conquistasTooltip focusin.conquistasTooltip change.conquistasTooltip', '#cbxConquista', aplicarTooltipsConquistas);

    if (!$('#dataConquista').val()) {
        $('#dataConquista').val(new Date().toISOString().slice(0, 10));
    }

    $(document).off(
        'contextmenu.conquistas',
        '.cardConquista'
    ).on(
        'contextmenu.conquistas',
        '.cardConquista',
        function (event) {
            event.preventDefault();

            const tipo = $(this).data('tipo');
            const idColaborador = $('#idColaborador').val();

            if (!tipo || !idColaborador)
                return;

            abrirMenuConquista(event, idColaborador, tipo);
        }
    );

}

function abrirMenuConquista(event, idColaborador, tipo) {
    $('.menuConquistaManual').remove();

    const $menu = $(`
        <div class="menuConquistaManual">
            <button type="button" class="removerConquistaManual">
                Remover medalha
            </button>
        </div>
    `);

    $menu.css({
        left: event.pageX,
        top: event.pageY
    });

    $('body').append($menu);

    $menu.find('.removerConquistaManual').on('click', async function () {
        const confirmar = confirm('Remover esta medalha manual?');
        if (!confirmar)
            return;

        try {
            await $.ajax({
                url: `/api/colaboradores/conquista/${idColaborador}/${encodeURIComponent(tipo)}`,
                method: 'DELETE'
            });

            $('.menuConquistaManual').remove();
            await carregarConquistasColaborador(idColaborador);
        } catch (err) {
            console.error(err);
            alert('Erro ao remover medalha.');
        }
    });

    setTimeout(() => {
        $(document).one('click.conquistas-menu', () => $('.menuConquistaManual').remove());
    }, 0);
}


export async function carregarConquistasColaborador(
    idColaborador
) {
    console.log(
        'Carregando conquistas:',
        idColaborador
    );
    const dados =
        await $.get(
            `/api/colaboradores/conquistas/${idColaborador}`
        );

    const $lista =
        $('#listaConquistasColaborador');

    $lista.empty();

    dados.forEach(c => {

        const item =
            MAPA_CONQUISTAS[c.tipo];

        if (!item)
            return;
        const data =
            new Date(
                c.data_conquista
            ).toLocaleDateString(
                'pt-BR'
            );
        let classdestaque = '';
        if (item.nome == "Destaque do Ano"){
            classdestaque = "cardConquistaGold"
        }
        const tooltip = `${item.nome}\n${item.descricao}\nData: ${data}\nClique com o botão direito para remover medalhas manuais.`;

        $lista.append(`
            
      <div
            class="cardConquista ${classdestaque}"
            data-tipo="${c.tipo}"
            title="${escapeAttr(tooltip)}">

            <div class="icone">
                ${item.icone}
            </div>

            <div class="titulo">
                ${item.nome}
            </div>

            <div class="data">
                ${data}
            </div>

        </div>

    `);

    });

}


