import { carregarColaboradoresDisp, carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { formatarData_Semana } from "../../utils/formatters/date-format.js";
import { mostrarErroUI } from "../../utils/dom/error-handler.js";


export function initDateChangeHandler() {
  document.addEventListener("change", async (e) => {
    if (e.target && e.target.id === "seletor_data") {
      const dataBase = new Date(e.target.value);
      await atualizarProgramacao(dataBase);
    } 
  });
}


export async function atualizarProgramacao(dataBase){
  try {
        document.body.style.cursor = "wait";
        if (isNaN(dataBase.getTime())) return;

        document.querySelectorAll(".painelDia").forEach((painel, index) => {
          const novaData = new Date(dataBase);
          novaData.setDate(dataBase.getDate() + (index - 1));

          const dataFormatada = novaData.toISOString().split("T")[0];
          painel.setAttribute("data-dia", dataFormatada);
          painel.querySelector(".painel_Dia").textContent = formatarData_Semana(dataFormatada);
        });

        await Promise.all(
          [...document.querySelectorAll(".painelDia")].map(async painel => {
            await carregarColaboradoresDisp(painel, false);
            await carregarOSComColaboradores(painel);
          })
        );
        
        restaurarOSPrioridade();
      } catch (err) {
        console.error("Erro ao atualizar os painéis:", err);
        mostrarErroUI("Falha ao aplicar pesquisa. Tente novamente."); // exemplo de handler central
      } finally {
        document.body.style.cursor = "default";
      }
}
