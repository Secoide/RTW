const ia2Model =
    require("./ia2.model");

const {
    GoogleGenerativeAI
} = require(
    "@google/generative-ai"
);

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

async function gerarComentarioIA(
    dashboard
) {

    try {

        const model =
            genAI.getGenerativeModel({

                model:
                    "gemini-2.5-flash"

            });

        const prompt = `

Você é um analista operacional da RTW Engenharia.

Analise os dados abaixo e gere um comentário executivo.

DADOS:

${JSON.stringify(
    {
        indicadores:
            dashboard.indicadores,

        topOS:
            dashboard.topOS
    },
    null,
    2
)}

REGRAS:

- Não repita todos os números.
- Gere observações úteis.
- Destaque concentração de equipes.
- Destaque empresas mais movimentadas.
- Identifique possíveis gargalos.
- Máximo 70 palavras.
- Linguagem profissional.
- Não invente dados.
- Não utilize markdown.
- Não utilize listas.
- Responda em um único texto corrido.

`;

        const result =
            await model
                .generateContent(
                    prompt
                );

        return result
            .response
            .text()
            .trim();

    } catch (err) {

        console.error(
            "Erro Gemini IA2:",
            err
        );

        return "Não foi possível gerar a análise inteligente neste momento.";

    }

}

async function chat(
    pergunta
) {

    const texto =
        pergunta
            .toLowerCase();

    if (

        texto.includes(
            "quem trabalhou hoje"
        )

        ||

        texto.includes(
            "trabalhou hoje"
        )

        ||

        texto.includes(
            "resumo operacional"
        )

        ||

        texto.includes(
            "movimento de hoje"
        )

    ) {

        const dashboard =
            await ia2Model
                .buscarDashboardHoje();

        dashboard.comentarioIA =
            await gerarComentarioIA(
                dashboard
            );

        return dashboard;

    }

    return {

        tipo:
            "texto",

        mensagem:
            "Ainda não sei responder essa pergunta."

    };

}

module.exports = {

    chat

};