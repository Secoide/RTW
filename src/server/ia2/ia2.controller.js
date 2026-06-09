const ia2Service =
    require("./ia2.service");

async function chat(
    req,
    res
) {

    try {

        const {
            pergunta
        } = req.body;

        const resposta =
            await ia2Service
                .chat(
                    pergunta
                );

        return res.json(
            resposta
        );

    } catch (err) {

        console.error(
            err
        );

        return res
            .status(500)
            .json({

                erro:
                    "Erro IA2"

            });

    }

}

module.exports = {

    chat

};