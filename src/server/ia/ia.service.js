const iaModel =
    require("./ia.model.js");
const empresasModel =
    require("../models/empresas.model.js");
const parser =
    require("./ia.parser.js");

let cacheEmpresas = [];

let cacheEmpresasData = null;


const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const chrono =
    require("chrono-node");

const tools =
    require("./ia.tools");

// ============================================================
// GEMINI
// ============================================================

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

// ============================================================
// MODEL CLASSIFICADOR
// ============================================================

const modelIntent =
    genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
            temperature: 0.1
        }
    });

// ============================================================
// MODEL RESPOSTA
// ============================================================

const modelChat =
    genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
            temperature: 0.3
        }
    });

// ============================================================
// CACHE
// ============================================================

let cacheColaboradores = null;
let cacheColaboradoresTime = 0;



// ============================================================
// NORMALIZAR
// ============================================================

function textoNormalizado(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

// ============================================================
// EXTRAIR NOME DA PERGUNTA
// ============================================================

function extrairPossivelNome(
    pergunta
) {

    if (!pergunta) {

        return null;

    }

    // remove perguntas comuns

    let texto =
        pergunta
            .replace(/\?/g, "")
            .replace(/quantas vezes/gi, "")
            .replace(/trabalhou/gi, "")
            .replace(/na empresa/gi, "")
            .replace(/\bna\b/gi, "")
            .replace(/\bno\b/gi, "")
            .replace(/\bpmb\b/gi, "")
            .replace(/\bjti\b/gi, "")
            .replace(/\bfemsa\b/gi, "")
            .trim();

    // remove espaços duplos

    texto =
        texto.replace(/\s+/g, " ");

    if (
        texto.length < 3
    ) {

        return null;

    }

    return texto.trim();

}



// ============================================================
// EXTRAIR OS
// ============================================================

function extrairOS(pergunta) {

    const match =
        pergunta.match(/os\s*(\d+)/i);

    if (!match) return null;

    return Number(match[1]);

}


// ============================================================
// EXTRAÇÃO ESTRUTURADA
// ============================================================

async function extrairFiltrosIA(
    pergunta
) {

    try {

        const prompt = `
Você é um extrator de filtros.

Extraia os dados da pergunta.

Retorne SOMENTE JSON.

CAMPOS:

{
  "tipo": null,
  "empresa": null,
  "nomeColaborador": null,
  "osID": null,
  "periodo": null
}

TIPOS POSSÍVEIS:
- ranking
- historico
- disponibilidade
- os
- colaborador

EXEMPLOS:
Pergunta:
Quem trabalhou mais esse mês?

Resposta:
{
  "tipo": "ranking",
  "empresa": null,
  "nomeColaborador": null,
  "osID": null,
  "periodo": "mes_atual"
}

Pergunta:
Quem trabalhou mais na PMB em Julho de 2025?

Resposta:
{
  "tipo": "ranking",
  "empresa": "PMB",
  "nomeColaborador": null,
  "osID": null,
  "periodo": "mes_ano",
  "mes": 7,
  "ano": 2025
}

Pergunta:
Quem trabalhou mais na PMB esse mês?

Resposta:
{
  "tipo": "ranking",
  "empresa": "PMB",
  "nomeColaborador": null,
  "osID": null,
  "periodo": "mes_atual"
}

Pergunta:
Quantas vezes Regis trabalhou na PMB?

Resposta:
{
  "tipo": "historico",
  "empresa": "PMB",
  "nomeColaborador": "Regis",
  "osID": null,
  "periodo": null
}

Pergunta:
Quem trabalhou na OS 1523?

Resposta:
{
  "tipo": "os",
  "empresa": null,
  "nomeColaborador": null,
  "osID": 1523,
  "periodo": null
}

Pergunta:
${pergunta}

Resposta:
`;

        const result =
            await gerarComRetry(
                modelIntent,
                prompt
            );

        const texto =
            result.response
                .text()
                .trim();

        return JSON.parse(texto);

    } catch (err) {

        console.error(
            "Erro extrairFiltrosIA:",
            err
        );

        return {
            tipo: null,
            empresa: null,
            nomeColaborador: null,
            osID: null,
            periodo: null
        };

    }

}

// ============================================================
// EXTRAIR EMPRESA
// ============================================================

async function extrairEmpresa(
    texto
) {

    if (!texto) {

        return null;

    }

    const empresas =
        await carregarEmpresas();

    const textoUpper =
        texto.toUpperCase();

    // ========================================================
    // BUSCA DIRETA
    // ========================================================

    for (const emp of empresas) {

        const nome =
            (emp.nome || "")
                .toUpperCase()
                .trim();

        if (!nome) {

            continue;

        }

        // ====================================================
        // MATCH DIRETO
        // ====================================================

        if (
            textoUpper.includes(nome)
        ) {

            return emp.nome;

        }

        // ====================================================
        // MATCH POR PARTES
        // ====================================================

        const partes =
            nome
                .split(" ")
                .filter(
                    p => p.length > 2
                );

        let score = 0;

        for (const parte of partes) {

            if (
                textoUpper.includes(parte)
            ) {

                score++;

            }

        }

        if (score >= 1) {

            return emp.nome;

        }

    }

    return null;

}

// ============================================================
// EXTRAIR VERSÃO
// ============================================================

function extrairVersao(pergunta) {

    const match =
        pergunta.match(/\d+\.\d+(\.\d+)?/);

    if (!match) return null;

    return match[0];

}

// ============================================================
// EXTRAIR COLABORADOR DINÂMICO
// ============================================================

function extrairNomeColaborador(
    pergunta,
    colaboradores
) {

    if (
        !pergunta ||
        !colaboradores?.length
    ) {

        return null;

    }

    const perguntaNorm =
        textoNormalizado(pergunta);

    // ========================================================
    // REMOVE PALAVRAS COMUNS
    // ========================================================

    const ignorar = [

        "quantas",
        "vezes",
        "trabalhou",
        "na",
        "no",
        "empresa",
        "cliente",
        "pmb",
        "jti",
        "femsa"

    ];

    // ========================================================
    // SCORE
    // ========================================================

    let melhorMatch = null;

    let maiorScore = 0;

    for (const c of colaboradores) {

        const nome =
            c.nome || "";

        const nomeNorm =
            textoNormalizado(nome);

        const partes =
            nomeNorm
                .split(" ")
                .filter(p => p.length > 2);

        let score = 0;

        for (const parte of partes) {

            if (
                perguntaNorm.includes(parte)
            ) {

                score++;

            }

        }

        if (score > maiorScore) {

            maiorScore = score;

            melhorMatch = nome;

        }

    }

    // ========================================================
    // MATCH MINIMO
    // ========================================================

    if (maiorScore >= 2) {

        return melhorMatch;

    }

    return null;

}

// ============================================================
// IDENTIFICAÇÃO RÁPIDA
// ============================================================

function identificarToolRapida(pergunta) {

    const p =
        textoNormalizado(pergunta);

    // ========================================================
    // ANIVERSARIANTES
    // ========================================================

    if (
        p.includes("anivers")
    ) {

        return "buscarAniversariantes";

    }

    // ========================================================
    // VERSÃO
    // ========================================================

    if (
        p.includes("versao atual") ||
        p.includes("ultima versao")||
        p.includes("Qual a versão do sistema?")
    ) {

        return "buscarUltimaVersao";

    }

    // ========================================================
    // QUEM TRABALHOU
    // ========================================================

    if (
        p.includes("quem trabalhou") ||
        p.includes("quem trabalhou hoje") ||
        p.includes("quem trabalhou ontem") ||
        p.includes("colaboradores trabalharam") ||
        p.includes("quais colaboradores trabalharam") ||
        p.includes("funcionarios trabalharam") ||
        p.includes("quem executou hoje")
    ) {
        return "buscarColaboradoresPorData";
    }

    // ========================================================
    // DISPONÍVEIS
    // ========================================================

    if (
        p.includes("disponiveis") ||
        p.includes("quem esta livre")
    ) {
        return "buscarDisponiveis";
    }

    // ========================================================
    // OS
    // ========================================================

    if (
        /^os\s\d+$/i.test(p)
    ) {

        return "buscarOS";

    }

    return null;

}

// ============================================================
// IDENTIFICAÇÃO IA
// ============================================================

async function identificarToolIA(pergunta) {

    try {

        const prompt = `
Você é um roteador de intenções.

Seu trabalho é identificar QUAL ferramenta deve ser usada.

Ferramentas disponíveis:

1. buscarColaboradoresPorData
- quem trabalhou
- colaboradores que trabalharam
- funcionários que trabalharam
- equipe do dia
- quem executou serviços hoje
- colaboradores por data

2. buscarDisponiveis
- consultar colaboradores disponíveis
- quem está livre
- disponibilidade

3. buscarColaboradoresOSIA
- colaboradores de uma OS
- equipe da OS
- quem executou determinada OS
- funcionários envolvidos em uma OS

4. buscarRankingColaboradores
- ranking
- produtividade
- melhores colaboradores
- quantidade de OS

5. buscarColaborador
- dados de um colaborador específico
- informações pessoais
- localizar colaborador

6. buscarAniversariantes
- aniversariantes
- aniversário
- quem faz aniversário

7. buscarUltimaVersao
- última versão do sistema
- versão mais recente

8. buscarVersaoSistema
- versão instalada
- detalhes de versão

9. buscarOS
- consultar OS
- buscar ordem de serviço
- detalhes de OS
- OS por data
- OS abertas

10. buscarHistoricoColaboradorEmpresa
- histórico de colaborador
- quantas vezes trabalhou
- histórico por empresa
- atuações em cliente
- quantas OS em empresa

Exemplos:

Pergunta: Quem trabalhou hoje?
Resposta: buscarColaboradoresPorData

Pergunta: Quais colaboradores trabalharam ontem?
Resposta: buscarColaboradoresPorData

Pergunta: Quem executou a OS 1523?
Resposta: buscarColaboradoresOSIA

Pergunta: Quem está disponível amanhã?
Resposta: buscarDisponiveis

Pergunta: Qual a última versão?
Resposta: buscarUltimaVersao

Regras:

- Retorne SOMENTE o nome exato da ferramenta
- Nunca explique
- Nunca use frases
- Use um pouco de markdown
- Use Lista para colaboradores, nomes;
- Se houver dúvida, escolha a mais provável
- Se realmente não souber:
desconhecido

Pergunta:
"${pergunta}"

Resposta:
`;

        const result =
            await gerarComRetry(
                modelIntent,
                prompt
            );

        return result.response
            .text()
            .trim();

    } catch (err) {

        console.error(
            "Erro identificarToolIA:",
            err
        );

        return "desconhecido";

    }

}


// ============================================================
// RETRY GEMINI
// ============================================================

async function gerarComRetry(
    model,
    prompt,
    tentativas = 3
) {

    for (
        let tentativa = 1;
        tentativa <= tentativas;
        tentativa++
    ) {

        try {

            const result =
                await model.generateContent(
                    prompt
                );

            return result;

        } catch (err) {

            const status =
                err?.status;

            console.error(
                `Erro Gemini tentativa ${tentativa}:`,
                status
            );

            // ====================================================
            // RETRY APENAS ERROS TEMPORÁRIOS
            // ====================================================

            if (
                status === 503 ||
                status === 429
            ) {

                // espera progressiva

                const tempo =
                    tentativa * 2000;

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            tempo
                        )
                );

                continue;

            }

            // erro definitivo

            throw err;

        }

    }

    throw new Error(
        "Gemini indisponível"
    );

}



// ============================================================
// PERGUNTAR IA
// ============================================================


async function perguntarIA(
    pergunta,
    nivelAcesso,
    nomeUsuario
) {
    try {

        if (!pergunta) {

            return "Pergunta inválida.";

        }

        // ====================================================
        // COLABORADORES
        // ====================================================

        const colaboradores =
            await tools.buscarColaboradoresCBX();

        // ====================================================
        // PARSER
        // ====================================================

        const parsed =
            await parser.parsePergunta(
                pergunta,
                colaboradores
            );

        console.log(pergunta);
        console.log(parsed);

        let dadosSistema = [];

        // ====================================================
        // COLABORADORES OS
        // ====================================================

        if (
            parsed.intent ===
            "colaboradores_os"
        ) {

            dadosSistema =
                await iaModel
                    .buscarDadosOperacionais({

                        osID:
                            parsed.osID

                    });
            // ====================================================
            // AGRUPAR RESULTADOS
            // ====================================================
            console.log("RETORNO:", dadosSistema);
            const agrupado = {};

            for (const item of dadosSistema) {

                if (!agrupado[item.id_OSs]) {

                    agrupado[item.id_OSs] = {

                        os: item.id_OSs,
                        descricao: item.descricao,
                        empresa: item.empresa,
                        supervisor: item.supervisor,
                        colaboradores: []

                    };

                }

                agrupado[item.id_OSs]
                    .colaboradores
                    .push(item.colaborador);

            }

            dadosSistema =
                Object.values(agrupado);
        }// ====================================================
        // HISTÓRICO COLABORADOR
        // ====================================================

        // ====================================================
        // HISTÓRICO COLABORADOR
        // ====================================================

        else if (

            parsed.intent ===
            "historico_colaborador"

        ) {

            dadosSistema =
                await iaModel
                    .buscarHistoricoColaborador({

                        nomeColaborador:
                            parsed.nomeColaborador

                    });

            // ====================================================
            // AGRUPAR POR OS
            // ====================================================

            const agrupado = {};

            for (const item of dadosSistema) {

                const chave =
                    item.id_OSs;

                if (!agrupado[chave]) {

                    agrupado[chave] = {

                        os: item.id_OSs,
                        descricao: item.descricao,
                        empresa: item.empresa,
                        datas: []

                    };

                }

                // ====================================================
                // ADICIONAR DATA
                // ====================================================

                agrupado[chave]
                    .datas
                    .push(item.data);

            }

            // ====================================================
            // ORDENAR DATAS
            // ====================================================

            for (const chave in agrupado) {

                agrupado[chave]
                    .datas
                    .sort((a, b) => {

                        const [da, ma, aa] = a.split("/");
                        const [db, mb, ab] = b.split("/");

                        return new Date(`${ab}-${mb}-${db}`)
                            - new Date(`${aa}-${ma}-${da}`);

                    });

                // ====================================================
                // TOTAL DIAS
                // ====================================================

                agrupado[chave]
                    .totalDias =
                    agrupado[chave]
                        .datas.length;

            }

            dadosSistema =
                Object.values(agrupado);

            console.log(
                "Retorno:",
                dadosSistema
            );

        }

        // ====================================================
        // COLABORADORES DATA
        // ====================================================

        else if (

            parsed.intent ===
            "colaboradores_data"

        ) {

            dadosSistema =
                await iaModel
                    .buscarDadosOperacionais({

                        dataDia:
                            parsed.data,

                        periodo:
                            parsed.periodo,

                        empresa:
                            parsed.empresa,

                        nomeColaborador:
                            parsed.nomeColaborador,

                        mes:
                            parsed.mes,

                        ano:
                            parsed.ano,

                        diaSemana:
                            parsed.diaSemana

                    });

        } else if (

            parsed.intent ===
            "estatistica_colaborador"

        ) {

            dadosSistema =
                await iaModel
                    .buscarEstatisticaColaborador({

                        empresa:
                            parsed.empresa,

                        nomeColaborador:
                            parsed.nomeColaborador,

                        periodo:
                            parsed.periodo,

                        mes:
                            parsed.mes,

                        ano:
                            parsed.ano,

                        diaSemana:
                            parsed.diaSemana

                    });

        }

        // ====================================================
        // DISPONIVEIS
        // ====================================================

        else if (

            parsed.intent ===
            "disponiveis"

        ) {

            dadosSistema =
                await iaModel
                    .buscarDisponiveis({

                        dataDia:
                            parsed.data

                    });


        }

        // ====================================================
        // LOCALIZAR COLABORADOR
        // ====================================================

        else if (

            parsed.intent ===
            "localizar_colaborador"

        ) {

            dadosSistema =
                await iaModel
                    .buscarDadosOperacionais({

                        nomeColaborador:
                            parsed.nomeColaborador,

                        dataDia:
                            parsed.data ||
                            formatarDataSQL(
                                getDataBrasil()
                            )

                    });

        }
        // ====================================================
        // DETALHES COLABORADOR
        // ====================================================

        else if (

            parsed.intent ===
            "colaborador_detalhes"

        ) {

            dadosSistema =
                await iaModel
                    .buscarDetalhesColaborador(
                        parsed.nomeColaborador
                    );

            // ====================================================
            // REMOVE DADOS SENSÍVEIS
            // ====================================================

            if (nivelAcesso < 4 && !dadosSistema) {
                delete dadosSistema.cpf;
                delete dadosSistema.rg;
                delete dadosSistema.telefone;
                delete dadosSistema.mail;
            }

        }
        // ====================================================
        // RANKING
        // ====================================================

        else if (

            parsed.intent ===
            "ranking"

        ) {

            dadosSistema =
                await iaModel
                    .buscarRankingColaboradores({

                        empresa:
                            parsed.empresa,

                        periodo:
                            parsed.periodo,

                        dataDia:
                            parsed.data,

                        diaSemana:
                            parsed.diaSemana,

                        mes:
                            parsed.mes,

                        ano:
                            parsed.ano

                    });

        }

        // ====================================================
        // OS DATA
        // ====================================================

        else if (

            parsed.intent ===
            "os_data"

        ) {

            dadosSistema =
                await iaModel
                    .buscarDadosOperacionais({

                        dataDia:
                            parsed.data,

                        periodo:
                            parsed.periodo

                    });
        }

        // ====================================================
        // VERSAO
        // ====================================================

        else if (

            parsed.intent ===
            "versao"

        ) {

            dadosSistema =
                await tools
                    .buscarUltimaVersao();

        } else if (

            parsed.intent ===
            "aniversariantes"

        ) {

            dadosSistema =
                await iaModel
                    .buscarAniversariantes({

                        mes:
                            parsed.mes

                    });

        }

        else {

            return `
😕 Não consegui entender sua solicitação.

Posso ajudar com:

• Colaboradores
• OS
• Disponibilidade
• Aniversariantes
• Ranking
• Versões do sistema
            `;

        }

        // ====================================================
        // SEM DADOS
        // ====================================================

        if (
            !dadosSistema ||
            (
                Array.isArray(dadosSistema) &&
                dadosSistema.length === 0
            )
        ) {

            return `
😕 Nenhum dado encontrado.
            `;

        }

        // ====================================================
        // PROMPT FINAL
        // ====================================================

        const prompt = `
Você é a IA operacional da RTW Engenharia. 
O nome do usuario que esta falando contigo é: ${nomeUsuario}.

OBJETIVO:
Responder consultas operacionais de forma:
- natural
- organizada
- amigável
- objetiva

REGRAS OBRIGATÓRIAS:

- Utilize SOMENTE os dados recebidos.
- Nunca invente informações.
- Nunca invente colaboradores.
- Nunca invente OS.
- Nunca invente empresas.
- Nunca invente datas.
- Nunca faça interpretações fora dos dados.
- Nunca diga:
  "os dados indicam"
  "foi identificado"
  "aparentemente"
  "provavelmente"

PERMITIDO:

- Interagir de forma humana e agradável.

EXEMPLOS DE COMENTÁRIOS VÁLIDOS:

- "Foram encontrados 5 colaboradores nesta programação."
- "A consulta retornou 3 OS cadastradas."
- "Existem colaboradores disponíveis nesta data."
- "Nenhum colaborador foi encontrado para este período."

Intent:${parsed.intent}

- Quando intent for "estatistica_colaborador":
    • Não usar:
        "Espero que esta informação seja útil"
    • Destacar:
        - colaborador com $%...$%
        - empresa com #%...#%
        - quantidade de dias com X%...X%

EXEMPLO:

$%Marcos Lopes$% trabalhou por X%78 diasX% na #%PMB#%.

Quando Dados possuir um array com objetos,
isso significa que EXISTEM dados válidos.
- Quando intent for "historico_colaborador":
    • NÃO listar outros colaboradores
    • NÃO mostrar equipe
    • NÃO mostrar supervisor
    • Sempre mostrar as datas de atuação
    • Nunca omitir datas
    • Mostrar datas abaixo da OS
    • Agrupar datas da mesma OS
    • Mostrar apenas:
        - OS
        - descrição
        - empresa
        - data

Nunca responder:
"Nenhum dado encontrado"
se o array possuir itens.

EXEMPLO OS HISTORICO:

@%OS 1522@%
Descrição: Ampliação Oficina
Empresa: #%FEMSA#%
Datas: (12 dias)
• 08/10/2025
• 23/09/2025


- Quanto intent for aniversariantes coloque um comentario engraçado na resposta.

EXEMPLO ANIVERSARIANTES:
$%Marcos Lopes$% - 25/02/1994

- Fale algo engraçado para os aniversariantes, com icones e mais paragrafos.

- Quando intent for "colaborador_detalhes":
 • Não usar:
    "Espero que esta informação seja útil"
• Destacar nome.     
- Fale SEMPRE algo engraçado no começo sobre o colaborador detalhado, porem NÃO fale os dados neste paragrafo.
- Quando tiver data demissional destaque que foi desligado no dia informado e o tempo que durou na empresa.
- Quando tiver data admissional e sem data demissional, cite o tempo que esta na empresa.
- NUNCA calcule tempo de empresa.
- O campo "tempo_empresa" já vem calculado corretamente.
- Apenas utilize exatamente o valor informado.

Retorne obrigatoriamente:

[COLABORADOR]
{
  "nome":"",
  "cpf":"",
  "rg":"",
  "cargo":"",
  "empresa":"",
  "telefone":"",
  "mail":"",
  "endereco":"",
  "cnh":"",
  "nascimento_idade":"",
  "data_admissional":"",
  "data_demissional":"",
  "fotoperfil":"",
  "versao_foto":"",
}
[/COLABORADOR]

- Use SOMENTE os dados recebidos
- Nunca invente campos
- Retorne JSON válido
- Use aspas duplas

FORMATAÇÃO OBRIGATÓRIA:

- Títulos:
### TITULO

- Listas:
• item

- Labels:
Descrição:
Empresa:
Supervisor:
Colaboradores:
Data:
Datas:

- Destaque SOMENTE nomes de colaboradores comuns usando:
$%NOME$%

- NUNCA destaque supervisor com $%%

EXEMPLO:

Colaboradores:
• $%Marcos$%
• $%Felipe$%

- Destaque empresas usando:
#%EMPRESA#%

- Destaque OS usando:
@%OS 1523@%

EXEMPLO CORRETO:

### Colaboradores Disponíveis

• $%Guilherme$%
• $%Marcos$%
• $%Felipe$%

EXEMPLO OS:

### @%OS 1523@%

Descrição: Reforma elétrica

Empresa: #%PMB#%

Supervisor: Guilherme

Colaboradores:
• $%Marcos$%
• $%Felipe$%

REGRAS:
- Nunca colocar OS iniciando com:
• 
- 
*
- OS deve sempre iniciar com:
### @%OS XXXX@%
- Nunca misturar OS com listas.


EXEMPLO RANKING:
- Quando houver rankings, estatísticas ou comparações,
gere também um gráfico.

FORMATO OBRIGATÓRIO:

[GRAFICO]
{
  "tipo":"bar",
  "labels":["Nome1","Nome2","Nome3"],
  "values":[10,8,5]
}
[/GRAFICO]

REGRAS:
- Retorne JSON válido
- Use apenas:
  "bar"
  "pie"
  "line"
- labels e values devem possuir o mesmo tamanho
- Nunca invente dados
- Gere gráfico apenas quando fizer sentido


- Sempre que houver dados suficientes, adicione uma curiosidade relevante sobre:
• colaboradores
• frequência de atuação
• empresa
• OS
• produtividade
• histórico operacional

- Utilize SOMENTE os dados recebidos.
- Nunca invente informações.


Pergunta:
${pergunta}

Dados:
${JSON.stringify(dadosSistema, null, 2)}
`;
        const result =
            await gerarComRetry(
                modelChat,
                prompt
            );
        return result.response.text();

    } catch (err) {

        console.error(err);

        return `❌ Erro interno IA.`;

    }

}

// ============================================================
// DATA BRASIL
// ============================================================

function getDataBrasil() {

    const agora =
        new Date();

    const brasil =
        new Date(
            agora.toLocaleString(
                "en-US",
                {
                    timeZone:
                        "America/Sao_Paulo"
                }
            )
        );

    return brasil;

}

function getAmanhaBrasil() {

    const data =
        getDataBrasil();

    data.setDate(
        data.getDate() + 1
    );

    return data;

}
function formatarDataSQL(
    data
) {

    return data
        .toISOString()
        .split("T")[0];

}
// ============================================================
// CARREGAR EMPRESAS
// ============================================================

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

module.exports = {
    perguntarIA
};