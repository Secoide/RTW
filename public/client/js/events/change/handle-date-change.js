import { carregarColaboradoresDisp, carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { formatarData_Semana } from "../../utils/formatters/date-format.js";
import { mostrarErroUI } from "../../utils/dom/error-handler.js";

let atualizacaoProgramacaoSeq = 0;

export function criarDataLocalProgramacao(valor) {
  if (valor instanceof Date) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const match = String(valor || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(NaN);

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatarDataLocalProgramacao(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function limparDestaqueStatusDiaProgramacao() {
  $(".painelDia.iluminar_verde").each(function () {
    const $painel = $(this);
    clearTimeout($painel.data("timerIluminarVerde"));
    $painel.removeClass("iluminar_verde");
    $painel.removeData("timerIluminarVerde");
  });
}

async function handleDateChangeProgramacao(e) {
  if (e.target && e.target.id === "seletor_data") {
    const dataBase = criarDataLocalProgramacao(e.target.value);
    await atualizarProgramacao(dataBase);
  }
}

export function initDateChangeHandler() {
  document.removeEventListener("change", handleDateChangeProgramacao);
  document.addEventListener("change", handleDateChangeProgramacao);
}


export async function atualizarProgramacao(dataBase){
  const sequenciaAtual = ++atualizacaoProgramacaoSeq;
  try {
        document.body.style.cursor = "wait";
        window.__programacaoCarregando = true;
        document.dispatchEvent(new CustomEvent("programacao:carregando", { detail: { carregando: true } }));

        if (isNaN(dataBase.getTime())) return;
        limparDestaqueStatusDiaProgramacao();

        document.querySelectorAll(".painelDia").forEach((painel, index) => {
          const novaData = criarDataLocalProgramacao(dataBase);
          novaData.setDate(dataBase.getDate() + (index - 1));

          const dataFormatada = formatarDataLocalProgramacao(novaData);
          painel.setAttribute("data-dia", dataFormatada);
          $(painel).removeData("dia");
          painel.querySelector(".painel_Dia").textContent = formatarData_Semana(dataFormatada);
        });

        await Promise.all(
          [...document.querySelectorAll(".painelDia")].map(async painel => {
            await carregarColaboradoresDisp(painel, false);
            await carregarOSComColaboradores(painel);
          })
        );

        if (sequenciaAtual !== atualizacaoProgramacaoSeq) return;
        
        restaurarOSPrioridade();
        limparDestaqueStatusDiaProgramacao();
        document.dispatchEvent(new CustomEvent("programacao:atualizada"));
      } catch (err) {
        console.error("Erro ao atualizar os painéis:", err);
        mostrarErroUI("Falha ao aplicar pesquisa. Tente novamente."); // exemplo de handler central
      } finally {
        if (sequenciaAtual === atualizacaoProgramacaoSeq) {
          window.__programacaoCarregando = false;
          document.body.style.cursor = "default";
          document.dispatchEvent(new CustomEvent("programacao:carregando", { detail: { carregando: false } }));
        }
      }
}
