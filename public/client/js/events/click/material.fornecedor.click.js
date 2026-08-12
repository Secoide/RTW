import {
  getFornecedoresMaterial,
  updateFornecedor,
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
  $(document).off(".materialFornecedor");

  $(document).on("click.materialFornecedor", ".fornecedores", async function () {
    const $btn = $(this);

    if ($btn.data("loading")) return;
    $btn.data("loading", true);

    try {
      const id = $btn.data("id");
      const linha = $btn.closest("tr");

      if (linha.next().hasClass("linha-fornecedores")) {
        linha.next().remove();
        return;
      }

      $(".linha-fornecedores").remove();

      const lista = await getFornecedoresMaterial(id);

      linha.after(renderTabelaFornecedores(lista, id));
      atualizarScoresFornecedores();
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar fornecedores");
    } finally {
      $btn.data("loading", false);
    }
  });

  $(document).on("click.materialFornecedor", ".add-fornecedor", async function () {
    const id = $(this).data("id");
    const $container = $(this).closest(".fornecedores-box");

    if (!state.listaFornecedores.length) {
      await carregarFornecedores();
    }

    criarLinhaFornecedor($container, id);
  });

  $(document).on("keydown.materialFornecedor", ".novo-forn input, .novo-forn select, .novo-forn button", async function (event) {
    if (event.key === "Escape" || (event.altKey && event.key === "ArrowRight")) {
      event.preventDefault();
      await pularFornecedorAtual($(this).closest(".novo-forn"));
      return;
    }

    if (event.key !== "Enter") return;

    const $atual = $(this);

    if ($atual.hasClass("salvar-forn")) {
      return;
    }

    event.preventDefault();
    focarProximoCampoFornecedor($atual.closest(".novo-forn"), $atual);
  });

  $(document).on("click.materialFornecedor", ".pular-forn", async function () {
    await pularFornecedorAtual($(this).closest(".novo-forn"));
  });

  $(document).on("click.materialFornecedor", ".editar-forn", async function () {
    const $btn = $(this);
    const idMaterial = $btn.data("material");
    const $container = $btn.closest(".fornecedores-box");

    if (!state.listaFornecedores.length) {
      await carregarFornecedores();
    }

    criarLinhaFornecedor($container, idMaterial, $btn.data("fornecedor"), {
      id: $btn.data("id"),
      valor: $btn.data("valor"),
      icms: $btn.data("icms"),
      quantidade: $btn.data("quantidade"),
      material_ok: Number($btn.data("material-ok")) === 1,
      prazo: $btn.data("prazo"),
      orcamento: $btn.data("orcamento") || "",
      observacao: $btn.data("observacao") || ""
    });
  });

  $(document).on("click.materialFornecedor", ".deletar-forn", async function () {
    const id = $(this).data("id");

    if (!confirm("Excluir fornecedor?")) return;

    await deleteFornecedor(id);

    $(this).closest("tr").remove();
  });

  $(document).on("click.materialFornecedor", ".selecionar-forn", async function () {
    const id = $(this).data("id");

    await selecionarFornecedor(id, true);

    carregarMateriaisCompleto();
  });

  $(document).on("click.materialFornecedor", ".deselecionar-forn", async function () {
    const id = $(this).data("id");

    await selecionarFornecedor(id, false);

    carregarMateriaisCompleto();
  });

  $(document).on("click.materialFornecedor", ".salvar-forn", async function () {
    const $btn = $(this);
    if ($btn.data("saving")) return;

    const $tr = $btn.closest("tr");
    const $container = $btn.closest(".fornecedores-box");

    const valor = parseNumeroBR($tr.find(".valor").val());
    const icms = parseNumeroBR($tr.find(".input-icms").val() || 0);
    const quantidade = parseNumeroBR($tr.find(".qtd-forn").val());
    const prazo = parseNumeroBR($tr.find(".prazo").val());

    const itemId = $btn.data("id");
    const item = state.dados.find(i => i.id == itemId);
    const total = Number(item?.quantidade || 0);

    if (!valor || valor <= 0) {
      alert("Valor deve ser maior que 0");
      return;
    }

    if (icms < 0) {
      alert("ICMS nao pode ser negativo");
      return;
    }

    if (!quantidade || quantidade <= 0) {
      alert("Quantidade deve ser maior que 0");
      return;
    }

    if (quantidade > total) {
      alert(`Quantidade nao pode ser maior que ${total}`);
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
      $btn.data("saving", true).prop("disabled", true);

      const fornecedorEdicaoId = $btn.data("fornecedorEdicaoId");

      if (fornecedorEdicaoId) {
        await updateFornecedor(fornecedorEdicaoId, payload);
      } else {
        await $.post("/api/materiais/os/fornecedores", payload);
      }

      $tr.remove();

      if (!state.listaFornecedores.length) {
        await carregarFornecedores();
      }

      const listaAtualizada = await getFornecedoresMaterial(itemId);
      const $linhaExpandida = $container.closest("tr");

      $linhaExpandida.replaceWith(
        renderTabelaFornecedores(listaAtualizada, itemId)
      );

      atualizarScoresFornecedores();

      if (!fornecedorEdicaoId && confirm("Fornecedor salvo. Ir para o proximo material?")) {
        await abrirProximoMaterialParaFornecedor(itemId, payload.id_fornecedor);
      }
    } catch (err) {
      console.error("Erro ao salvar fornecedor:", err);
      alert("Erro ao salvar fornecedor");
    } finally {
      $btn.data("saving", false).prop("disabled", false);
    }
  });
}

function criarLinhaFornecedor($container, id, idFornecedorPadrao = null, dadosEdicao = null) {
  let $tbody = $container.find("tbody");

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
            <th>Or&ccedil;amento</th>
            <th>Obs</th>
            <th>Valor RS</th>
            <th>Total R$</th>
            <th>Score</th>
            <th>A&ccedil;&otilde;es</th>
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

  $tbody.find(".novo-forn").remove();

  const item = state.dados.find(material => Number(material.id) === Number(id));
  const quantidadePadrao = Number(item?.quantidade || 0);

  const linha = `
    <tr class="novo-forn">
      <td>${montarSelectFornecedores()}</td>
      <td><input class="valor" type="text" inputmode="decimal" placeholder="0,00"></td>
      <td><input class="input-icms" type="text" inputmode="decimal" readonly></td>
      <td><input class="qtd-forn" type="text" inputmode="decimal" value="${formatarNumeroInput(quantidadePadrao)}"></td>
      <td><input type="checkbox" class="material-ok" checked></td>
      <td><input class="prazo" type="text" inputmode="numeric" value="1"></td>
      <td><input class="orcamento"></td>
      <td><input class="observacao"></td>
      <td class="valor-rs">-</td>
      <td class="valor-total-rs">-</td>
      <td class="score"><span class="score-text">-</span></td>
      <td>
        <button class="salvar-forn save" data-id="${id}" title="Salvar fornecedor">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>
        <button class="pular-forn" data-id="${id}" title="Pular sem salvar (Esc)">
          <i class="fa-solid fa-forward-step"></i>
        </button>
      </td>
    </tr>
  `;

  $tbody.prepend(linha);

  const $novaLinha = $tbody.find(".novo-forn").first();

  if (idFornecedorPadrao) {
    $novaLinha.find(".forn-select").val(String(idFornecedorPadrao)).trigger("change");
  }

  if (dadosEdicao) {
    $novaLinha.addClass("editando-forn");
    $novaLinha.find(".valor").val(formatarNumeroInput(dadosEdicao.valor));
    $novaLinha.find(".input-icms").val(formatarNumeroInput(dadosEdicao.icms));
    $novaLinha.find(".qtd-forn").val(formatarNumeroInput(dadosEdicao.quantidade));
    $novaLinha.find(".material-ok").prop("checked", Boolean(dadosEdicao.material_ok));
    $novaLinha.find(".prazo").val(formatarNumeroInput(dadosEdicao.prazo || 1));
    $novaLinha.find(".orcamento").val(dadosEdicao.orcamento || "");
    $novaLinha.find(".observacao").val(dadosEdicao.observacao || "");
    $novaLinha.find(".salvar-forn")
      .data("fornecedorEdicaoId", dadosEdicao.id)
      .attr("title", "Salvar edicao do fornecedor");
  }

  setTimeout(() => {
    $novaLinha.find(".valor").focus().select();
  }, 50);

  return $novaLinha;
}

async function abrirProximoMaterialParaFornecedor(itemIdAtual, idFornecedorPadrao) {
  const $linhaAtual = $(`#tableMaterial tbody tr[data-id="${itemIdAtual}"]`).first();
  const $proximaLinha = $linhaAtual.nextAll("tr[data-id]").first();

  if (!$proximaLinha.length) {
    alert("Fornecedor salvo. Este era o ultimo material da lista.");
    return;
  }

  const proximoId = $proximaLinha.data("id");

  $(".linha-fornecedores").remove();

  const lista = await getFornecedoresMaterial(proximoId);
  $proximaLinha.after(renderTabelaFornecedores(lista, proximoId));

  const $linhaExpandida = $proximaLinha.next(".linha-fornecedores");
  atualizarScoresFornecedores($linhaExpandida);

  if (!state.listaFornecedores.length) {
    await carregarFornecedores();
  }

  criarLinhaFornecedor(
    $linhaExpandida.find(".fornecedores-box"),
    proximoId,
    idFornecedorPadrao
  );
}

async function pularFornecedorAtual($linhaFornecedor) {
  const itemId = $linhaFornecedor.find(".salvar-forn").data("id");
  const idFornecedorAtual = $linhaFornecedor.find(".forn-select").val() || null;

  await abrirProximoMaterialParaFornecedor(itemId, idFornecedorAtual);
}

function focarProximoCampoFornecedor($linhaFornecedor, $campoAtual) {
  const $campos = $linhaFornecedor
    .find("select, input, button")
    .filter(":visible:not(:disabled)");

  const indiceAtual = $campos.index($campoAtual);
  const $proximo = $campos.eq(indiceAtual + 1);

  if ($proximo.length) {
    $proximo.focus();
    if ($proximo.is("input[type='text'], input:not([type])")) {
      $proximo.select();
    }
    return;
  }

  $linhaFornecedor.find(".salvar-forn").focus();
}

function atualizarScoresFornecedores($scope = $(document)) {
  $scope.find(".tb-fornecedores tbody tr").each(function () {
    const score = Number($(this).data("score"));
    atualizarBarraScore($(this), score);
  });
}

function formatarNumeroInput(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? String(numero).replace(".", ",") : "";
}

function parseNumeroBR(valor) {
  if (typeof valor === "number") return valor;

  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "");

  if (!texto) return 0;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}
