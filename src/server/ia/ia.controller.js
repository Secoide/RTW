const iaService = require("./ia.service");

// ============================================================
// CHAT IA
// ============================================================

async function chatIA(req, res) {

    try {

        const { pergunta } = req.body;

        if (!pergunta) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "Pergunta não enviada."
            });

        }

        const resposta =
            await iaService.perguntarIA(pergunta);

        return res.json({
            sucesso: true,
            resposta
        });

    } catch (err) {

        console.error("Erro IA:", err);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno IA."
        });

    }

}

module.exports = {
    chatIA
};