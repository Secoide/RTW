const iaService = require("./ia.service");

const iaAlertas =
    require("./ia.alertas");

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
    await iaService.perguntarIA(pergunta, req.session.nivel_acesso, req.session.usuarioNome);

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


async function buscarAlertasIA(
    req,
    res
) {

    try {

        const alertas =
            await iaAlertas
                .buscarAlertasIA();

        res.json(alertas);

    } catch(err) {

        console.error(err);

        res.status(500).json({
            erro:
                "Erro alertas IA"
        });

    }

}

module.exports = {
    chatIA,
    buscarAlertasIA
};