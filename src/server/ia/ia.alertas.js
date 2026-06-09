const examesModel =
    require("../models/exames.model");

// ============================================================
// ALERTAS IA
// ============================================================

async function buscarAlertasIA() {

    const alertas = [];

    // ========================================================
    // EXAMES
    // ========================================================

    const exames =
        await examesModel
            .buscarAlertasExames();

    if (exames.length > 0) {

        const vencidos =
            exames.filter(
                x => x.dias_restantes < 0
            );

        const vencendo =
            exames.filter(
                x => x.dias_restantes >= 0
            );

        // ====================================================
        // VENCIDOS
        // ====================================================

        if (vencidos.length > 0) {

            alertas.push({

                tipo:
                    "exame_vencido",

                icone:
                    "⚠️",

                mensagem:
                    `${vencidos.length} exames vencidos`

            });

        }

        // ====================================================
        // ALERTA
        // ====================================================

        if (vencendo.length > 0) {

            alertas.push({

                tipo:
                    "exame_alerta",

                icone:
                    "🩺",

                mensagem:
                    `${vencendo.length} exames vencem em até 30 dias`

            });

        }

    }

    return alertas;

}

module.exports = {
    buscarAlertasIA
};