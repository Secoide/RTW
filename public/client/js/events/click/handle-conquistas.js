export function initaddConquistas() {
    $(document).on(
        'click',
        '#btAdicionarConquista',
        async function () {

            try {

                const id_colaborador =
                    $('#idColaborador')
                        .val();

                const tipo =
                    $('#cbxConquista')
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

                        tipo

                    }

                );
                await carregarConquistasColaborador(
                    id_colaborador
                );
                alert(
                    'Conquista adicionada'
                );

            } catch (err) {

                console.error(err);

            }

        }
    );

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

    const mapa = {

        CIPA: {
            icone: '♻️',
            nome: 'Membro da CIPA'
        },

        BRIGADISTA: {
            icone: '⛑️',
            nome: 'Brigadista'
        },

        DESTAQUE_MES: {
            icone: '🏅',
            nome: 'Destaque do Mês'
        },

        DESTAQUE_ANO: {
            icone: '🏆',
            nome: 'Destaque do Ano'
        },

        INOVADOR: {
            icone: '💡',
            nome: 'Inovador'
        },

        ESPIRITO_EQUIPE: {
            icone: '🤝',
            nome: 'Espírito de Equipe'
        },

        HEROI_SEGURANCA: {
            icone: '🚨',
            nome: 'Herói da Segurança'
        },

        MENTOR: {
            icone: '🎓',
            nome: 'Mentor'
        },

        EMBAIXADOR: {
            icone: '🌎',
            nome: 'Embaixador'
        },

        CLIENTE_DESTAQUE: {
            icone: '💬',
            nome: 'Elogiado pelo Cliente'
        },

        RESOLVE_TUDO: {
            icone: '🧩',
            nome: 'Resolve Tudo'
        },

        LIDERANCA: {
            icone: '👔',
            nome: 'Liderança Inspiradora'
        },

        SUPERACAO: {
            icone: '🏔️',
            nome: 'Superação'
        },

        ORGULHO_RTW: {
            icone: '❤️',
            nome: 'Orgulho RTW'
        },

        SOLUCAO_INTELIGENTE: {
            icone: '🧠',
            nome: 'Solução Inteligente'
        },

        CORUJA_RTW: {
            icone: '🦉',
            nome: 'Coruja'
        },

        PRECISAO_RTW: {
            icone: '🎯',
            nome: 'Precisão'
        },

        ORGANIZACAO_EXEMPLAR: {
            icone: '📋',
            nome: 'Organização Exemplar'
        },

        RESPOSTA_RAPIDA: {
            icone: '⚡',
            nome: 'Resposta Rápida'
        },

        COMUNICADOR_RTW: {
            icone: '📡',
            nome: 'Comunicador'
        },

        ALTA_PERFORMANCE: {
            icone: '🦾',
            nome: 'Alta Performance'
        },

        PONTUALIDADE_OURO: {
            icone: '⏱️',
            nome: 'Pontualidade de Ouro'
        },

        GUARDIAO_QUALIDADE: {
            icone: '🔐',
            nome: 'Guardião da Qualidade'
        }

    };

    dados.forEach(c => {

        const item =
            mapa[c.tipo];

        if (!item)
            return;
        const data =
            new Date(
                c.data_conquista
            ).toLocaleDateString(
                'pt-BR'
            );
        let classdestaque;
        if (item.nome == "Destaque do Ano"){
            classdestaque = "cardConquistaGold"
        }
        $lista.append(`
            
      <div
            class="cardConquista ${classdestaque}"
            title="${item.nome}">

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


