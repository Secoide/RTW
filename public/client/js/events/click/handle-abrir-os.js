// /public/client/js/events/click/handle-abrir-os.js
import { initOSForm } from "../forms/handle-os-submit.js";
import { getDadosOS } from "../../services/api/os-service.js";
import { formatDateToInput } from "../../utils/formatters/date-format.js";
import {
  preencherCbxCidade,
  preencherCbxSupervisor,
  preencherCbxCliente,
  preencherCbxResponsavel
} from "../forms/populate-combobox.js";

function carregarFormularioOS() {
  return new Promise((resolve, reject) => {
    $("#form_cadOS").empty().load("../html/forms/cadastro_os.html", function (response, status, xhr) {
      if (status === "success") {
        initOSForm();
        initCombosOS();
        resolve();
        return;
      }

      reject(new Error(`Erro ao carregar o formulário: ${xhr.status} ${xhr.statusText}`));
    });
  });
}

function selecionarValorSelect($select, valor, textoFallback = "") {
  if (valor === undefined || valor === null || valor === "") {
    $select.val("");
    return;
  }

  const valorStr = String(valor);
  const possuiOpcao = $select.find("option").filter(function () {
    return String(this.value) === valorStr;
  }).length > 0;

  if (!possuiOpcao) {
    $select.append(new Option(textoFallback || `Registro ${valorStr}`, valorStr));
  }

  $select.val(valorStr);
}

async function prepararCombosOS(dados = null) {
  const $wrap = $("#frm_cadastrarOS");

  await Promise.all([
    preencherCbxCliente($wrap),
    preencherCbxResponsavel()
  ]);

  if (!dados?.idEmp) return;

  selecionarValorSelect($("#selectCliente"), dados.idEmp, dados.nomeEmpresa);

  await Promise.all([
    preencherCbxSupervisor(dados.idEmp, $wrap),
    preencherCbxCidade(dados.idEmp, $wrap)
  ]);

  selecionarValorSelect($("#selectSupervisor"), dados.idSup, dados.nomeSupervisor);
  selecionarValorSelect($("#selectCidade"), dados.id_cidade, dados.cidade);
  selecionarValorSelect($("#selectResponsavel"), dados.idResp, dados.lider);
  $("#selectSupervisor").trigger("change");
}

export async function abrirNovaOS() {
  try {
    await carregarFormularioOS();
    await prepararCombosOS();
  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao carregar o formulário da OS.");
  }
}

export function initAbrirOSClick() {
  $(document).off(".abrirOS");
  $(document).on("click.abrirOS", "#bt_abrir_NovaOS", abrirNovaOS);

  $(document).on("click.abrirOS", ".lbl_OS", async function () {
    const idOS = $(this).text().trim();
    get_carregarDadosOS(idOS);
  });

  $(document).on("click.abrirOS", ".status_daOSnaOS", function () {
    const $os = $(this);
    const idOS = $os.closest(".p_infoOS").data("os");
    get_carregarDadosOS(idOS);
    setTimeout(() => {
      $('.cadOS a.bt_menu[data-target=".painel_status"]').trigger("click");
    }, 400);
  });
}

function initCombosOS() {
  const $form = $("#formOS");
  let consultaEmpresa;

  $form.on("change", "#selectCliente", async function () {
    consultaEmpresa?.abort();
    const $wrap = $(this).closest("#frm_cadastrarOS");
    const idEmpresas = $(this).val();
    $wrap.find("#selectSupervisor").empty().trigger("change");
    $wrap.find("#selectCidade").empty();
    if (!idEmpresas) return;

    consultaEmpresa = new AbortController();
    const { signal } = consultaEmpresa;
    await Promise.all([
      preencherCbxSupervisor(idEmpresas, $wrap, signal),
      preencherCbxCidade(idEmpresas, $wrap, signal)
    ]);
  });

  $form.on("change", "#selectSupervisor", function () {
    const idSupervisorSelecionado = $(this).val();
    const $telefone = $form.find("#telefoneSupervisor");
    const $email = $form.find("#emailSupervisor");

    function atualizarCampos({ telefone = "-", email = "-" } = {}) {
      $telefone.text("Telefone: " + (telefone || "-"));
      $email.text("E-mail: " + (email || "-"));
    }

    if (!idSupervisorSelecionado) {
      atualizarCampos();
      return;
    }

    atualizarCampos({ telefone: "carregando...", email: "carregando..." });

    $.ajax({
      url: `/api/supervisor/${idSupervisorSelecionado}`,
      method: "GET",
      dataType: "json",
      success: function (data) {
        if ($form.find("#selectSupervisor").val() !== idSupervisorSelecionado) return;
        atualizarCampos(data);
      },
      error: function (xhr) {
        console.error(xhr.responseText);
      }
    });
  });
}

export async function get_carregarDadosOS(idOS) {
  if (!idOS) {
    alert("OS não encontrada!");
    return;
  }

  try {
    const res = await getDadosOS(idOS);

    if (!res.sucesso) {
      alert(res.mensagem || "Erro ao carregar OS.");
      return;
    }

    await carregarFormularioOS();

    $("#bt_editOS").show();
    $("#bt_analisarGraficoOS").show();
    $("#bt_cadOS").hide();

    const dados = res.dados;
    $("#idOS").val(dados.id_OSs);
    $("#descricaoOS").val(dados.descricao);

    await prepararCombosOS(dados);

    $("#valorOrcadoOS").val(dados.orcado);
    $("#dataconclusaoOS").val(formatDateToInput(dados.mesExpec));
    $("#statusOS").val(dados.statuss);
  } catch (err) {
    alert("Erro ao carregar dados da OS. Verifique o console.");
    console.error(err);
  }
}
