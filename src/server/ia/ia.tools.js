const fs = require("fs");
const path = require("path");
const ColabService =
    require("../services/colaboradores.service");
const OSService =
    require("../services/os.service");







// ============================================================
// BUSCAR ÚLTIMA VERSÃO
// ============================================================

async function buscarUltimaVersao() {

    const fs =
        require("fs");

    const path =
        require("path");

    const caminho =
        path.join(
            process.cwd(), "public",
            "CHANGELOG.md"
        );

    // ====================================================
    // LER ARQUIVO
    // ====================================================

    const texto =
        fs.readFileSync(
            caminho,
            "utf8"
        );

    const linhas =
        texto.split(/\r?\n/);

    // ====================================================
    // PEGAR PRIMEIRA VERSÃO
    // ====================================================

    let versao = null;

    for (const linha of linhas) {

        const match =
            linha.match(
                /^##\s*\[(.*?)\]/
            );

        if (match) {

            versao =
                match[1];

            break;

        }

    }

    // ====================================================
    // NÃO ENCONTROU
    // ====================================================

    if (!versao) {

        return {
            versao: null,
            conteudo: ""
        };

    }

    // ====================================================
    // EXTRAIR BLOCO
    // ====================================================

    let dentroDaVersao =
        false;

    let bloco = [];

    for (let linha of linhas) {

        if (
            linha.includes(
                `## [${versao}]`
            )
        ) {

            dentroDaVersao = true;

        }

        if (dentroDaVersao) {

            if (
                linha.startsWith("## [") &&
                !linha.includes(versao)
            ) {

                break;

            }

            bloco.push(linha);

        }

    }

    // ====================================================
    // RETORNO
    // ====================================================

    return {

        versao,

        conteudo:
            bloco.join("\n")

    };

}

// ============================================================
// BUSCAR VERSÃO ESPECÍFICA
// ============================================================

async function buscarVersaoSistema(args) {

    const versao =
        args.versao;

    const caminho =
        path.join(process.cwd(), "public", "CHANGELOG.md");

    const texto =
        fs.readFileSync(caminho, "utf8");

    const linhas =
        texto.split(/\r?\n/);

    let dentro = false;

    let bloco = [];

    for (const linha of linhas) {

        if (linha.includes(`## [${versao}]`)) {

            dentro = true;

        }

        if (dentro) {

            if (
                linha.startsWith("## [") &&
                !linha.includes(versao)
            ) {

                break;

            }

            bloco.push(linha);

        }

    }

    return {
        versao,
        conteudo: bloco.join("\n")
    };

}





// ============================================================
// BUSCAR COLABORADORES DISPONÍVEIS
// ============================================================

async function buscarColaboradoresDisponiveis(args) {

    const dataDia =
        args.dataDia || new Date()
            .toISOString()
            .split("T")[0];

    const dados =
        await ColabService
            .listarColaboradoresDisponiveis(dataDia);

    return dados;

}

// ============================================================
// BUSCAR COLABORADORES EM OS
// ============================================================

async function buscarColaboradoresEmOS(args) {

    const dataDia =
        args.dataDia || new Date()
            .toISOString()
            .split("T")[0];

    const dados =
        await ColabService
            .listarColaboradoresEmOS(
                dataDia,
                args.osID,
                args.nomeColaborador
            );

    // ========================================================
    // AGRUPAR POR OS
    // ========================================================

    const agrupado = {};

    for (const item of dados) {

        if (!agrupado[item.id_OSs]) {

            agrupado[item.id_OSs] = {
                os: item.id_OSs,
                descricao: item.descricao,
                empresa: item.nomeEmpresa,
                colaboradores: [],
                supervisor: null
            };

        }

        if (item.nome) {

            agrupado[item.id_OSs]
                .colaboradores
                .push(item.nome);

            if (item.supervisor === "supervisor") {

                agrupado[item.id_OSs]
                    .supervisor = item.nome;

            }

        }

    }

    let resultado =
        Object.values(agrupado);

    // ========================================================
    // FILTRAR POR COLABORADOR
    // ========================================================

    if (args.nomeColaborador) {

        resultado =
            resultado.filter(os => {

                return os.colaboradores.some(c => {

                    const nomeBanco =
                        c.toLowerCase();

                    const nomeBusca =
                        args.nomeColaborador
                            .toLowerCase();

                    // separa palavras

                    const partes =
                        nomeBusca.split(" ");

                    // precisa encontrar pelo menos uma

                    return partes.some(p =>
                        nomeBanco.includes(p)
                    );

                });

            });

    }

    return resultado;

}


// ============================================================
// BUSCAR OS
// ============================================================

async function buscarOS(args) {

    return await OSService
        .buscarOSPorData(
            args.dataDia
        );

}

// ============================================================
// BUSCAR COLABORADORES IA
// ============================================================

async function buscarColaboradoresOSIA(args) {

    return await ColabService
        .listarColaboradoresOSIA(
            args.dataDia,
            args.osID
        );

}

// ============================================================
// BUSCAR DISPONÍVEIS
// ============================================================

async function buscarDisponiveis(
    args
) {

    return await ColabService
        .listarDisponiveis(
            args.dataDia
        );

}

async function buscarColaboradoresPorData(args) {

    return await ColabService
        .listarColaboradoresPorData(
            args.dataDia
        );

}

// ============================================================
// HISTÓRICO COLABORADOR EMPRESA
// ============================================================

async function buscarHistoricoColaboradorEmpresa(
    args
) {

    if (!args.nomeColaborador) {

        return [];

    }

    // busca colaborador

    const colab =
        await ColabService
            .listarColaboradorIA(
                null,
                args.nomeColaborador
            );

    if (!colab) {

        return [];

    }

    // histórico

    return await ColabService
        .buscarHistoricoColabPorEmpresa(
            colab.idfuncionario
        );

}

async function buscarColaborador(args) {

    return await ColabService
        .listarColaboradorIA(
            args.dataDia,
            args.nomeColaborador
        );

}


function normalizarTexto(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

// ============================================================
// BUSCAR ANIVERSARIANTES
// ============================================================

async function buscarAniversariantes() {

    const dados =
        await ColabService
            .listarColaboradoresAniversariantes();

    return dados;

}

async function buscarColaboradoresCBX() {

    return await ColabService
        .listarColaboradoresCBX();

}

async function buscarRankingColaboradores(
    args
) {

    return await ColabService
        .listarRankingColaboradores(
            args.empresa
        );

}

module.exports = {
    buscarUltimaVersao,
    buscarVersaoSistema,
    buscarColaboradoresDisponiveis,
    buscarColaboradoresEmOS,
    buscarColaboradoresOSIA,
    buscarColaboradoresPorData,
    buscarDisponiveis,
    buscarColaborador,
    buscarAniversariantes,
    buscarOS,
    buscarRankingColaboradores,
    buscarColaboradoresCBX,
    buscarHistoricoColaboradorEmpresa
};