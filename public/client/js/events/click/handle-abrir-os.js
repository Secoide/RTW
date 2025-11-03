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


export function initAbrirOSClick() {
  
  $(document).on("click", "#bt_abrir_NovaOS", async function () {
    $('#form_cadOS').empty().load('../html/forms/cadastro_os.html', function (response, status, xhr) {
      if (status === "success") {
        preencherCbxResponsavel();
        const $wrap = $('#frm_cadastrarOS');
        preencherCbxCliente($wrap);
        
      } else {
        alert("Erro ao carregar o formulário: " + xhr.status + " " + xhr.statusText);
      }
    });
  });

  $(document).on("click", ".lbl_OS", async function () {
    const idOS = $(this).text().trim();
    get_carregarDadosOS(idOS);
  });

  $(document).on("click", ".status_daOSnaOS", function (e) {
      const $os = $(this);
      const idOS = $os.closest('.p_infoOS').data("os");
      get_carregarDadosOS(idOS);
      setTimeout(() => {
          $('.cadOS a.bt_menu[data-target=".painel_status"]').trigger('click');
      }, 400);
  });



initOSForm();




  $(document).on("change", "#selectCliente", async function () {
    const $wrap = $('#frm_cadastrarOS');
    const idEmpresas = $(this).val();
    if (!idEmpresas) {
      return;
    }
    preencherCbxSupervisor(idEmpresas, $wrap);
    preencherCbxCidade(idEmpresas, $wrap);
  });

  $(document).on("change", "#selectSupervisor", async function () {
    const idSupervisorSelecionado = $(this).val();

    // Função utilitária p/ atualizar os campos
    function atualizarCampos({ telefone = '-', email = '-' } = {}) {
      $('#telefoneSupervisor').text('Telefone: ' + (telefone || '-'));
      if (email && email !== '-') {
        $('#emailSupervisor').html('E-mail: <a href="mailto:' + email + '">' + email + '</a>');
      } else {
        $('#emailSupervisor').text('E-mail: -');
      }
    }

    // Sem seleção → limpa campos e sai
    if (!idSupervisorSelecionado) {
      atualizarCampos();
      return;
    }

    // Mostra “carregando…”
    atualizarCampos({ telefone: 'carregando…', email: 'carregando…' });

    // Chame seu endpoint que devolve JSON { telefone, email }
    $.ajax({
      url: `/api/supervisor/${idSupervisorSelecionado}`,
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        $('#telefoneSupervisor').text('Telefone: ' + (data.telefone || '-'));
        $('#emailSupervisor').text('E-mail: ' + (data.email || '-'));
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

      if (res.sucesso) {
        $("#form_cadOS").empty().load("../html/forms/cadastro_os.html", function () {

          preencherCbxResponsavel();
          $("#bt_editOS").show();
          $("#bt_analisarGraficoOS").show();
          $("#bt_cadOS").hide();

          const dados = res.dados;
          $("#idOS").val(dados.id_OSs);
          $("#descricaoOS").val(dados.descricao);

          const $wrap = $("#frm_cadastrarOS");
          preencherCbxCliente($wrap);
          preencherCbxSupervisor("0", $wrap);
          preencherCbxCidade("0", $wrap);

          setTimeout(() => {
            $("#selectCliente").val(dados.idEmp);
            $("#selectSupervisor").val(dados.idSup);
            $("#selectSupervisor").trigger("change");
            $("#selectCidade").val(dados.id_cidade);
            $("#selectResponsavel").val(dados.idResp);
          }, 200);

          $("#valorOrcadoOS").val(dados.orcado);
          $("#dataconclusaoOS").val(formatDateToInput(dados.mesExpec));
          
          $("#statusOS").val(dados.statuss);
        });
      } else {
        alert(res.mensagem || "Erro ao carregar OS.");
      }
    } catch (err) {
      alert("Erro ao carregar dados da OS. Verifique o console.");
      console.error(err);
    }
}