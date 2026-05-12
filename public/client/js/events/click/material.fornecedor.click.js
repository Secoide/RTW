import {
  getFornecedoresMaterial,
  deleteFornecedor,
  selecionarFornecedor
} from "../../services/api/material.fornecedor.api.js";

import { renderTabelaFornecedores } from "../../utils/dom/material.fornecedor.render.js";
import { materialState as state } from "../../state/material.state.js";
import { carregarFornecedores } from "../../services/api/material.api.js";
import { montarSelectFornecedores } from "../../components/inputs/material.fornecedor.select.js";
import { carregarMateriaisCompleto } from "../../bootstrap/material.load.js";
import { atualizarBarraScore } from "../../utils/dom/score.render.js";

export function initFornecedorClicks() {

  // 🔥 abrir fornecedores
  $(document).on("click", ".fornecedores", async function () {

    try {

      const id = $(this).data("id");
      const linha = $(this).closest("tr");

      // toggle correto
      if (linha.next().hasClass("linha-fornecedores")) {
        linha.next().remove();
        return;
      }

      // remove outros abertos (opcional)
      $(".linha-fornecedores").remove();

      const lista = await getFornecedoresMaterial(id);

      linha.after(renderTabelaFornecedores(lista, id));
      $(".tb-fornecedores tbody tr").each(function () {

        const score = Number($(this).data("score"));
        atualizarBarraScore($(this), score);

      });
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar fornecedores");
    }

  });

  // 🔥 adicionar fornecedor
  $(document).on("click", ".add-fornecedor", async function () {

    const id = $(this).data("id");

    const $container = $(this).closest(".fornecedores-box");

    let $tbody = $container.find("tbody");

    // 🔥 se não existe tabela (caso vazio)
    if (!$tbody.length) {

      $container.html(`
      <table class="tb-fornecedores">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Valor</th>
            <th>ICMS</th>
            <th>Qtd</th>
            <th>OK</th>
            <th>Prazo</th>
            <th>Orçamento</th>
            <th>Obs</th>
            <th>Valor RS</th>
            <th>Score</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <button class="add-fornecedor" data-id="${id}">
        + fornecedor
      </button>
    `);

      $tbody = $container.find("tbody");
    }

    // 🔥 remove linha aberta
    $tbody.find(".novo-forn").remove();

    // 🔥 cria linha
    const linha = `
    <tr class="novo-forn">
      <td>${montarSelectFornecedores()}</td>
      <td><input class="valor"></td>
      <td><input class="input-icms"></td>
      <td><input class="qtd-forn"></td>
      <td><input type="checkbox" class="material-ok"></td>
      <td><input class="prazo" value="1"></td>
      <td><input class="orcamento"></td>
      <td><input class="observacao"></td>
      <td>—</td>
      <td>—</td>
      <td>
        <button class="salvar-forn save" data-id="${id}">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>
      </td>
    </tr>
  `;

    $tbody.prepend(linha);

  });


  // 🔥 deletar
  $(document).on("click", ".deletar-forn", async function () {

    const id = $(this).data("id");

    if (!confirm("Excluir fornecedor?")) return;

    await deleteFornecedor(id);

    $(this).closest("tr").remove();
  });

  // 🔥 selecionar fornecedor
  $(document).on("click", ".selecionar-forn", async function () {

    const id = $(this).data("id");

    await selecionarFornecedor(id);

    carregarMateriaisCompleto();

  });

  // 🔥 salvar orçamento do fornecedor
  $(document).on("click", ".salvar-forn", async function () {

    const $btn = $(this);
    const $tr = $btn.closest("tr");
    const $container = $btn.closest(".fornecedores-box");

    const valor = Number($tr.find(".valor").val());
    const icms = Number($tr.find(".input-icms").val() || 0);
    const quantidade = Number($tr.find(".qtd-forn").val());
    const prazo = Number($tr.find(".prazo").val());

    const itemId = $btn.data("id");
    const item = state.dados.find(i => i.id == itemId);
    const total = Number(item?.quantidade || 0);

    // ===== VALIDAÇÕES =====
    console.log(valor);
    if (!valor || valor <= 0) {
      alert("Valor deve ser maior que 0");
      return;
    }

    if (icms < 0) {
      alert("ICMS não pode ser negativo");
      return;
    }

    if (!quantidade || quantidade <= 0) {
      alert("Quantidade deve ser maior que 0");
      return;
    }

    if (quantidade > total) {
      alert(`Quantidade não pode ser maior que ${total}`);
      return;
    }

    if (!prazo || prazo <= 0) {
      alert("Prazo deve ser maior que 0");
      return;
    }

    const payload = {
      id_material_os: itemId,
      id_fornecedor: $tr.find(".forn-select").val(),
      valor,
      icms,
      quantidade,
      material_ok: $tr.find(".material-ok").is(":checked") ? 1 : 0,
      prazo,
      orcamento: $tr.find(".orcamento").val() || null,
      observacao: $tr.find(".observacao").val() || null
    };

    if (!payload.id_fornecedor) {
      alert("Selecione um fornecedor");
      return;
    }

    try {

      await $.post("/api/materiais/os/fornecedores", payload);

      // 🔥 remove linha temporária
      $tr.remove();

      // 🔥 garante lista fornecedores
      if (!state.listaFornecedores.length) {
        await carregarFornecedores();
      }

      // 🔥 RECARREGA SOMENTE ESSE MATERIAL (top)
      const listaAtualizada = await getFornecedoresMaterial(itemId);

      // 🔥 substitui a tabela expandida
      const $linhaExpandida = $container.closest("tr");

      $linhaExpandida.replaceWith(
        renderTabelaFornecedores(listaAtualizada, itemId)

      );
      $(".tb-fornecedores tbody tr").each(function () {

        const score = Number($(this).data("score"));
        atualizarBarraScore($(this), score);

      });

    } catch (err) {
      console.error("💥 ERRO:", err);
      alert("Erro ao salvar fornecedor");
    }

  });

}