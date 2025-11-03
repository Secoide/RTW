// /public/client/js/utils/dom/preencher-tabela-atestar.js

import { formatarDataISO } from "../formatters/date-format.js"; 
// 👆 se você já tem um formatter de data, centraliza lá

export function preencherTabelaAtestar(id) {
  const tbody = $("#tb_historico_atestar tbody");
  tbody.empty(); // Limpa antes de preencher

  $.ajax({
    url: `/api/colaboradores/historico-atestar/${id}`,
    type: "GET",
    success: function (data) {
      if (!Array.isArray(data)) {
        console.warn("Resposta inesperada em preencherTabelaAtestar:", data);
        return;
      }

      data.forEach((colab) => {
        const linha = `
          <tr data-idatestar="${colab.id_funcInterrups}">
            <td>${colab.motivo || ""}</td>
            <td>${formatarDataISO(colab.datainicio)}</td>
            <td>${formatarDataISO(colab.datafinal)}</td>
            <td>${colab.descricao || ""}</td>
            <td><i class="fa-solid fa-trash-can bt_excluirHistoricoAtestar"></i></td>
          </tr>
        `;
        tbody.append(linha);
      });
    },
    error: function (xhr) {
      alert(
        xhr.responseJSON?.error ||
          xhr.responseText ||
          "Erro no carregamento da tabela"
      );
    },
  });
}
