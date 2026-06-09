const chrono = require("chrono-node");

const empresasModel =
    require("../models/empresas.model.js");


let cacheEmpresas = [];

let cacheEmpresasData = null;
// ========================================================
// NORMALIZAR
// ========================================================

function normalizar(texto = "") {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}

// ========================================================
// EXTRAIR DATA
// ========================================================

function extrairData(pergunta) {

    const texto =
        normalizar(pergunta);

    // ====================================================
    // CONTEXTO PASSADO
    // ====================================================

    const contextoPassado =

        /trabalhou|executou|esteve|fez|atuou|participou|ficou|realizou/.test(texto);

    // ====================================================
    // CONTEXTO FUTURO
    // ====================================================

    const contextoFuturo =

        /vai trabalhar|ira trabalhar|programado|amanha|agendado|pr[oó]ximo/.test(texto);

    // ====================================================
    // PARSE
    // ====================================================

    const data =
        chrono.pt.parseDate(
            pergunta,
            new Date(),
            {
                forwardDate:
                    contextoFuturo
            }
        );

    if (!data) {

        return null;

    }

    // ====================================================
    // AJUSTE MANUAL
    // ====================================================

    if (

        contextoPassado &&
        data > new Date()

    ) {

        data.setDate(
            data.getDate() - 7
        );

    }

    return data
        .toISOString()
        .split("T")[0];

}

function extrairPeriodo(pergunta) {

    const p =
        normalizar(pergunta);

    // ====================================================
    // HOJE
    // ====================================================

    if (
        /hoje/i.test(p)
    ) {

        return "hoje";

    }

    // ====================================================
    // AMANHA
    // ====================================================

    if (
        /amanha/i.test(p)
    ) {

        return "amanha";

    }

    // ====================================================
    // ONTEM
    // ====================================================

    if (
        /ontem/i.test(p)
    ) {

        return "ontem";

    }

    // ====================================================
    // SEMANA PASSADA
    // ====================================================

    if (
        /semana passada/i.test(p)
    ) {

        return "semana_passada";

    }

    // ====================================================
    // ESSA SEMANA
    // ====================================================

    if (
        /essa semana/i.test(p)
    ) {

        return "semana_atual";

    }

    // ====================================================
    // MES PASSADO
    // ====================================================

    if (
        /mes passado/i.test(p)
    ) {

        return "mes_passado";

    }

    // ====================================================
    // ESSE MES
    // ====================================================

    if (
        /esse mes/i.test(p)
    ) {

        return "mes_atual";

    }
    // ====================================================
    // ESSE ANO
    // ====================================================

    if (
        /esse ano|deste ano/i.test(p)
    ) {

        return "ano_atual";

    }

    // ====================================================
    // ANO PASSADO
    // ====================================================

    if (
        /ano passado|do ano passado/i.test(p)
    ) {

        return "ano_passado";

    }
    return null;

}


// ========================================================
// EXTRAIR OS
// ========================================================

function extrairOS(pergunta) {

    const match =
        pergunta.match(
            /\bos\s*(\d+)\b/i
        );

    if (!match) return null;

    return Number(match[1]);

}

// ========================================================
// IDENTIFICAR INTENT
// ========================================================

function identificarIntent(pergunta) {

    const p =
        normalizar(pergunta);

    // ====================================================
    // COLABORADORES OS
    // ====================================================

    const patternsOS = [

        /quem.*os\s*\d+/i,
        /colaboradores.*os/i,
        /equipe.*os/i,
        /funcionarios.*os/i

    ];

    if (
        patternsOS.some(r => r.test(p))
    ) {

        return "colaboradores_os";

    }
    // ====================================================
    // HISTÓRICO COLABORADOR
    // ====================================================

    const patternsHistorico = [

        /onde.*ja trabalhou/i,
        /onde.*trabalhou/i,
        /historico/i,
        /quais empresas.*trabalhou/i,
        /quais os.*trabalhou/i,
        /empresas.*atuou/i,
        /os.*participou/i

    ];

    if (
        patternsHistorico
            .some(r => r.test(p))
    ) {

        return "historico_colaborador";

    }
    // ====================================================
    // RANKING
    // ====================================================

    const patternsRanking = [

        /quem mais trabalhou/i,
        /mais os/i,
        /ranking/i,
        /mais ativo/i,
        /mais produtivo/i,
        /trabalhou mais/i,
        /quem teve mais dias/i,
        /quem mais atuou/i,

        // dias da semana

        /quem mais trabalhou (no|na) (sabado|sábado|domingo|segunda|terca|terça|quarta|quinta|sexta)/i

    ];

    if (
        patternsRanking
            .some(r => r.test(p))
    ) {

        return "ranking";

    }
    // ====================================================
    // ESTATÍSTICAS
    // ====================================================

    const patternsEstatistica = [

        /quantas vezes/i,
        /quantos dias/i,
        /quantas os/i,
        /quantas obras/i,
        /quantos trabalhos/i,
        /quantas participacoes/i,
        /quantas participações/i

    ];

    if (
        patternsEstatistica
            .some(r => r.test(p))
    ) {

        return "estatistica_colaborador";

    }
    // ====================================================
    // COLABORADORES POR DATA
    // ====================================================

    const patternsColaboradoresData = [

        /quem.*trabalh/i,
        /quais.*trabalh/i,

        /quem.*execut/i,
        /quais.*execut/i,

        /equipe.*dia/i,
        /funcionarios.*trabalh/i,
        /colaboradores.*trabalh/i,

        /servicos.*hoje/i,
        /servicos.*amanha/i,

        /quem.*foi/i

    ];

    if (
        patternsColaboradoresData
            .some(r => r.test(p))
    ) {

        return "colaboradores_data";

    }

    // ====================================================
    // DISPONIVEIS
    // ====================================================

    const patternsDisponiveis = [

        /disponiv/i,
        /livre/i,
        /sem os/i,
        /nao alocado/i,
        /nao.*alocado/i

    ];

    if (
        patternsDisponiveis
            .some(r => r.test(p))
    ) {

        return "disponiveis";

    }

    // ====================================================
    // LOCALIZAR COLABORADOR
    // ====================================================

    const patternsLocalizar = [

        /onde.*trabalhando/i,
        /qual os.*esta/i,
        /onde.*esta/i,
        /trabalhando agora/i,
        /em qual os.*agora/i

    ];

    if (
        patternsLocalizar
            .some(r => r.test(p))
    ) {

        return "localizar_colaborador";

    }

    // ====================================================
    // ANIVERSARIANTES
    // ====================================================

    const patternsAniversariantes = [

        /aniversariantes/i,
        /aniversariantes d/i,
        /quem faz aniversario/i,
        /quem faz aniversário/i,
        /aniversario/i,
        /aniversário/i,
        /faz aniversario/i,
        /faz aniversário/i

    ];

    if (
        patternsAniversariantes
            .some(r => r.test(p))
    ) {

        return "aniversariantes";

    }

    // ====================================================
    // OS POR DATA
    // ====================================================

    const patternsOSData = [

        /quais.*os/i,
        /servicos programados/i,
        /os.*hoje/i,
        /os.*amanha/i

    ];

    if (
        patternsOSData
            .some(r => r.test(p))
    ) {

        return "os_data";

    }

    // ====================================================
    // VERSAO
    // ====================================================

    if (
        /versao/i.test(p)
    ) {

        return "versao";

    }

    return "desconhecido";

}

// ========================================================
// EXTRAIR EMPRESA
// ========================================================
function textoNormalizado(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

async function extrairEmpresa(texto) {

    if (!texto) {

        return null;

    }

    const empresas =
        await carregarEmpresas();

    const textoNorm =
        textoNormalizado(texto);

    let melhorEmpresa = null;

    let maiorScore = 0;

    for (const emp of empresas) {

        const nomeOriginal =
            emp.nome || "";

        const nomeNorm =
            textoNormalizado(nomeOriginal);

        if (!nomeNorm) {

            continue;

        }

        // ====================================================
        // MATCH DIRETO
        // ====================================================

        // texto contém nome completo

        if (
            textoNorm.includes(nomeNorm)
        ) {

            return nomeOriginal;

        }

        // nome completo contém texto digitado

        if (
            nomeNorm.includes(textoNorm)
        ) {

            return nomeOriginal;

        }

        // início do nome

        if (
            nomeNorm.startsWith(textoNorm)
        ) {

            return nomeOriginal;

        }

        // ====================================================
        // MATCH POR PARTES
        // ====================================================

        const partes =
            nomeNorm
                .split(" ")
                .filter(
                    p => p.length > 2
                );

        let score = 0;

        for (const parte of partes) {

            if (
                textoNorm.includes(parte)
            ) {

                score++;

            }

        }

        // ====================================================
        // MELHOR SCORE
        // ====================================================

        if (score > maiorScore) {

            maiorScore = score;
            melhorEmpresa = nomeOriginal;

        }

    }

    // ========================================================
    // VALIDAÇÃO FINAL
    // ========================================================

    if (maiorScore >= 1) {

        return melhorEmpresa;

    }

    return null;

}

async function carregarEmpresas() {

    const agora =
        Date.now();

    // ========================================================
    // CACHE 10 MIN
    // ========================================================

    if (

        cacheEmpresas.length > 0 &&
        cacheEmpresasData &&
        (agora - cacheEmpresasData)
        < 600000

    ) {

        return cacheEmpresas;

    }

    try {

        const empresas =
            await empresasModel
                .getEmpresa();

        cacheEmpresas =
            empresas;

        cacheEmpresasData =
            agora;

        return empresas;

    } catch (err) {

        console.error(
            "Erro carregarEmpresas:",
            err
        );

        return [];

    }

}


// ========================================================
// EXTRAIR NOME
// ========================================================

function extrairNome(
    pergunta,
    colaboradores = []
) {
    console.log('Extrair nome... Pergunta: ', pergunta);
    console.log('Extrair nome... colaboradores: ', colaboradores);
    const perguntaNorm =
        normalizar(pergunta);

    let melhor = null;

    let scoreMaior = 0;

    for (const colab of colaboradores) {

        const nome =
            colab.nome || "";

        const partes =
            normalizar(nome)
                .split(" ");

        let score = 0;

        for (const parte of partes) {

            if (
                parte.length > 2 &&
                perguntaNorm.includes(parte)
            ) {

                score++;

            }

        }

        if (score > scoreMaior) {

            scoreMaior = score;
            melhor = nome;

        }

    }

    return scoreMaior >= 1
        ? melhor
        : null;

}

// ========================================================
// PARSER PRINCIPAL
// ========================================================

async function parsePergunta(
    pergunta,
    colaboradores = []
) {

    // ====================================================
    // EXTRAIR DATA
    // ====================================================

    let dataExtraida =
        extrairData(pergunta);

    let mes = null;
    let ano = null;

    // ====================================================
    // EXTRAIR MES/ANO
    // ====================================================

    const texto =
        normalizar(pergunta);

    // exemplo:
    // julho de 2025

    const meses = {

        janeiro: 1,
        fevereiro: 2,
        marco: 3,
        março: 3,
        abril: 4,
        maio: 5,
        junho: 6,
        julho: 7,
        agosto: 8,
        setembro: 9,
        outubro: 10,
        novembro: 11,
        dezembro: 12

    };

    for (const nomeMes in meses) {

        const regex =
            new RegExp(
                `${nomeMes}\\s+de\\s+(\\d{4})`,
                "i"
            );

        const match =
            texto.match(regex);

        if (match) {

            mes =
                meses[nomeMes];

            ano =
                Number(match[1]);

            break;

        }

    }

    // ====================================================
    // DIA DA SEMANA
    // ====================================================

    let diaSemana = null;

    if (/sabado|sábado/i.test(texto)) {

        diaSemana = 6;

    }

    else if (/domingo/i.test(texto)) {

        diaSemana = 0;

    }

    else if (/segunda/i.test(texto)) {

        diaSemana = 1;

    }

    else if (/terca|terça/i.test(texto)) {

        diaSemana = 2;

    }

    else if (/quarta/i.test(texto)) {

        diaSemana = 3;

    }

    else if (/quinta/i.test(texto)) {

        diaSemana = 4;

    }

    else if (/sexta/i.test(texto)) {

        diaSemana = 5;

    }
    if (diaSemana !== null) {
        dataExtraida = null;
    }

    // ====================================================
    // EVITAR CONFLITO:
    // DIA DA SEMANA + PERÍODO
    // ====================================================
    let periodo = extrairPeriodo(pergunta);
    if (

        diaSemana !== null &&

        [
            "semana_passada",
            "mes_passado",
            "mes_atual",
            "ano_passado",
            "ano_atual"
        ].includes(periodo)

    ) {

        dataExtraida = null;

    }

    // ====================================================
    // MÊS SEM ANO
    // ====================================================

    if (!mes) {

        for (const nomeMes in meses) {

            const regexMes =
                new RegExp(
                    `\\b${nomeMes}\\b`,
                    "i"
                );

            if (
                regexMes.test(texto)
            ) {

                mes =
                    meses[nomeMes];

                // assume ano atual
                ano =
                    new Date()
                        .getFullYear();

                break;

            }

        }

    }
    // ====================================================
    // EXTRAIR ANO ISOLADO
    // ====================================================

    if (!ano) {

        const matchAno =
            texto.match(/\b(20\d{2})\b/);

        if (matchAno) {

            ano =
                Number(matchAno[1]);

        }

    }
    // =====================================================
    // DETALHES COLABORADOR
    // =====================================================

    const textoLower =
        texto.toLowerCase().trim();

    // -----------------------------------------------------
    // PREFIXOS
    // -----------------------------------------------------

    const prefixosColaborador = [

        "dados do",
        "dados da",
        "informações de",
        "informacoes de",
        "perfil de",
        "perfil do",
        "colaborador",
        "funcionário",
        "funcionario"

    ];

    // -----------------------------------------------------
    // TENTA EXTRAIR NOME
    // -----------------------------------------------------

    let nomeDetectado = null;

    for (const prefixo of prefixosColaborador) {

        if (textoLower.startsWith(prefixo)) {

            nomeDetectado =
                texto
                    .substring(prefixo.length)
                    .trim();

            break;

        }

    }

    // -----------------------------------------------------
    // NOME PURO
    // -----------------------------------------------------

    if (

        !nomeDetectado &&

        texto.split(" ").length >= 2 &&

        texto.split(" ").length <= 5

    ) {

        const palavrasBloqueadas = [

            "quem",
            "aniversariantes",
            "aniversario",
            "trabalhou",
            "ranking",
            "ontem",
            "hoje",
            "amanhã",
            "amanha",
            "quantos",
            "empresa",
            "os",
            "colaboradores"

        ];

        const palavrasTexto =
            textoLower.split(/\s+/);

        const possuiBloqueada =
            palavrasBloqueadas.some(p =>

                palavrasTexto.includes(p)

            );

        if (!possuiBloqueada) {

            nomeDetectado =
                texto.trim();

        }

    }

    let intentColaborador =
        null;

    if (nomeDetectado) {

        intentColaborador =
            "colaborador_detalhes";

    }
    // ====================================================
    // RETORNO
    // ====================================================

    return {

        intent:
            intentColaborador ||
            identificarIntent(pergunta),

        osID:
            extrairOS(pergunta),

        data:
            dataExtraida,
        diaSemana,
        periodo:
            extrairPeriodo(pergunta),

        empresa:
            await extrairEmpresa(pergunta),

        nomeColaborador:

            extrairNome(
                nomeDetectado || pergunta,
                colaboradores
            )

            ||

            nomeDetectado,

        mes,
        ano

    };

}

module.exports = {
    parsePergunta
};