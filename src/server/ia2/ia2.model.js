const iaModel =
    require("../ia/ia.model.railway");

function getHoje() {

    const hoje =
        new Date();

    return hoje
        .toISOString()
        .split("T")[0];

}

async function buscarDashboardHoje() {

    const dados =
        await iaModel
            .buscarDadosOperacionais({

                dataDia:
                    getHoje()

            });

    const colaboradores =
        new Set();

    const empresas =
        new Set();

    const osMap =
        {};

    dados.forEach(item => {

        colaboradores.add(
            item.colaborador
        );

        empresas.add(
            item.empresa
        );

        if (
            !osMap[item.id_OSs]
        ) {

            osMap[item.id_OSs] = {

                os:
                    item.id_OSs,

                empresa:
                    item.empresa,

                supervisor:
                    item.supervisor,

                colaboradores:
                    new Set(),

                equipe: []

            };

        }

        osMap[item.id_OSs]
            .colaboradores
            .add(
                item.colaborador
            );
        osMap[item.id_OSs]
            .equipe
            .push({

                nome:
                    item.colaborador,

                fotoperfil:
                    item.fotoperfil,

                versao_foto:
                    item.versao_foto

            });

    });

    const topOS =
        Object.values(osMap)

            .map(os => ({

                ...os,

                colaboradores:
                    os.colaboradores
                        .size,

                equipe:
                    os.equipe

            }))

            .sort(
                (
                    a,
                    b
                ) =>
                    b.colaboradores
                    -
                    a.colaboradores
            )

            .slice(0, 5);

    return {

        tipo: "dashboardHoje",

        cabecalho: {

            texto:
                `Hoje, ${colaboradores.size} colaboradores trabalharam em ${Object.keys(osMap).length} Ordens de Serviço.`

        },

        indicadores: {

            colaboradores:
                colaboradores.size,

            os:
                Object.keys(osMap).length,

            empresas:
                empresas.size

        },

        topOS,

        curiosidade:

            topOS.length

                ?

                `${topOS[0].empresa} possui atualmente a maior equipe operacional do dia.`

                :

                null

    };

}

module.exports = {

    buscarDashboardHoje

};