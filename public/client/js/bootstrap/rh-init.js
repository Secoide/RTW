import { get_carregarPerfilUsuario } from "../events/click/handle-abrir-info-colab.js";
import { open_form_AnexarCurso } from "../events/forms/anexarCurso.js";
import { open_form_AnexarExame } from "../events/forms/anexarExame.js";
import { open_form_AnexarEPI } from "../events/forms/anexarEPI.js";
import { exportarResumoRHPDF } from "../services/pdf/rh-pdf.js";


export async function inciarRH() {
    try {
        preencherTabelaColaboradoresRH();
    } catch (err) {
        console.error("❌ Erro ao inicializar tela rh:", err);
    }



}

$(document).on("click", "#bt_atualizarRH", async function () {
    preencherTabelaColaboradoresRH();
});

$(document).on("click", "#btnExportarRHPDF", function () {
    exportarResumoRHPDF();
});

$(document).on("click", ".bt_form_anexar_epi", function (e) {
    open_form_AnexarEPI();
});

$(document).on("click", ".bt_form_anexar_exame", function (e) {
    open_form_AnexarExame();
});

$(document).on("click", ".bt_form_anexar_curso", function (e) {
    open_form_AnexarCurso();
});

function bindMiniClick(selector, painelTarget) {
    $(document).on("click", selector, async function () {
        const funcID = $(this).closest('.rh_tb_lin_colob').data("id");

        if (!funcID) {
            console.error("ID do colaborador não encontrado");
            return;
        }

        await get_carregarPerfilUsuario(funcID);

        $(`.cad a.bt_menu[data-target="${painelTarget}"]`).trigger('click');
    });
}

bindMiniClick(".mini_curso", ".painel_cursos");
bindMiniClick(".mini_exame", ".painel_exames");
bindMiniClick(".mini_integracao", ".painel_integra");
bindMiniClick(".text-danger", ".painel_vestimentas");


$(document).on("click", "#chkDesligados", function (e) {
    toggleDesligados($(this))
});

$(document).on("input", "#myInputPesquisaNomeRH", function (e) {
    aplicarFiltrosRH();
});

$(document).on("click", "#btnBuscaAvancadaRH", function () {
    $("#rhBuscaAvancadaPainel").toggleClass("ativo");
    $(this).toggleClass("ativo");
});

$(document).on("input change", "#rhFiltroCargo, #rhFiltroSetor, #rhFiltroStatus", function () {
    aplicarFiltrosRH();
    atualizarEstadoBuscaAvancadaRH();
});

$(document).on("click", ".rh-chip", function () {
    $(".rh-chip").removeClass("ativo");
    $(this).addClass("ativo");
    aplicarFiltrosRH();
});

$(document).on("click", "#btnLimparFiltrosRH", function () {
    $("#myInputPesquisaNomeRH").val("");
    $("#rhFiltroCargo").val("");
    $("#rhFiltroSetor").val("");
    $("#rhFiltroStatus").val("");
    $(".rh-chip").removeClass("ativo");
    $('.rh-chip[data-rh-filter="todos"]').addClass("ativo");
    atualizarEstadoBuscaAvancadaRH();
    aplicarFiltrosRH();
});

$(document).on("click", "#bt_excluirConta", function () {
    const idColaborador = $('#idColaborador').val();

    Swal.fire({
        title: "Excluir?",
        text: "Deseja realmente excluir essa conta? Não será possível reverter esta ação!",
        icon: "warning",
        theme: "dark",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!"
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/colaboradores/deletar/${idColaborador}`,
                type: "DELETE",
                dataType: "json",
                success: function (res) {
                    if (res.sucesso) {
                        Swal.fire({
                            icon: "success",
                            title: "Excluído",
                            theme: "dark",
                            text: "Conta excluída com sucesso!"
                        });
                        $('#form_cadColab').empty();
                        preencherTabelaColaboradoresRH();
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Erro",
                            theme: "dark",
                            text: res.mensagem || "Erro ao excluir conta."
                        });
                    }
                },
                error: function (xhr) {
                    let mensagem = "Erro ao processar a solicitação.";

                    if (xhr.responseJSON?.mensagem) {
                        mensagem = xhr.responseJSON.mensagem;
                    }
                    else if (xhr.responseText) {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            mensagem = json.mensagem || mensagem;
                        } catch (e) { }
                    }

                    // 🎯 Regras de negócio
                    const ehAviso =
                        mensagem.includes('Você não tem permissão para excluir essa conta');

                    Toast.fire({
                        icon: ehAviso ? "warning" : "error",
                        title: ehAviso ? "Atenção" : "Erro",
                        theme: "dark",
                        text: mensagem
                    });
                }
            });
        }
    });
});

$(document).on("click", function (e) {
    const menu = document.getElementById("menuRegistrar");

    if (!menu) return;

    if ($(e.target).closest(menu).length === 0) {
        // clique fora
        menu.classList.remove("ativo");
    } else {
        // clique dentro
        menu.classList.toggle("ativo");
    }
});


function filterTableOS() {
    // pega o valor digitado
    var input = document.getElementById("myInputPesquisaNomeRH");
    var filter = input.value.toLowerCase();

    // pega todas as linhas da tabela (ajuste o seletor da sua tabela)
    var rows = document.querySelectorAll("tr.rh_tb_lin_colob");

    rows.forEach(function (row) {
        // pega o texto da coluna de nome (2ª coluna no seu caso)
        var nomeColab = row.cells[1].innerText.toLowerCase();

        // mostra ou esconde a linha
        if (nomeColab.indexOf(filter) > -1) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}


export function toggleDesligados(chk) {
    $("#rh").toggleClass("mostrar-desligados", $(chk).is(":checked"));
    aplicarFiltrosRH();
}

function normalizarTexto(valor = "") {
    return valor
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function getFiltroRapidoRH() {
    return $(".rh-chip.ativo").data("rh-filter") || "todos";
}

function linhaPassaFiltroRapido($row, filtro) {
    if (filtro === "todos") return true;

    const exames = normalizarTexto($row.data("exames"));
    const status = normalizarTexto($row.data("status"));
    const epi = normalizarTexto($row.data("epi"));

    if (filtro === "vencidos") return exames.includes("vencido") || $row.find(".status-vencido, .VENCIDO").length > 0;
    if (filtro === "alerta") return exames.includes("alerta") || $row.find(".status-alerta, .ALERTA").length > 0;
    if (filtro === "agendado") return exames.includes("agendado") || status.includes("exame agendado") || $row.find(".status-agendado, .AGENDADO").length > 0;
    if (filtro === "ferias") return status.includes("ferias") || $row.hasClass("Ferias");
    if (filtro === "afastados") return ["afastamento", "saude", "maternidade", "paternidade"].some(item => status.includes(item)) || $row.is(".Afastamento, .Saude, .Maternidade, .Paternidade");
    if (filtro === "epi") return epi.includes("atencao") || epi.includes("avaliar") || $row.find(".text-danger, .text-warning").length > 0;

    return true;
}

function aplicarFiltrosRH() {
    const termo = normalizarTexto($("#myInputPesquisaNomeRH").val());
    const cargo = normalizarTexto($("#rhFiltroCargo").val());
    const setor = normalizarTexto($("#rhFiltroSetor").val());
    const statusFiltro = normalizarTexto($("#rhFiltroStatus").val());
    const filtroRapido = getFiltroRapidoRH();
    const mostrarDesligados = $("#chkDesligados").is(":checked");

    $("tr.rh_tb_lin_colob").each(function () {
        const $row = $(this);
        const textoLinha = normalizarTexto($row.text());
        const cargoLinha = normalizarTexto($row.data("cargo"));
        const setorLinha = normalizarTexto($row.data("setor"));
        const statusLinha = normalizarTexto($row.data("status"));
        const contrato = normalizarTexto($row.data("contrato"));

        const passaTermo = !termo || textoLinha.includes(termo);
        const passaCargo = !cargo || cargoLinha.includes(cargo);
        const passaSetor = !setor || setorLinha.includes(setor);
        const passaStatus = !statusFiltro || statusLinha.includes(statusFiltro) || contrato.includes(statusFiltro);
        const passaRapido = linhaPassaFiltroRapido($row, filtroRapido);
        const passaDesligado = mostrarDesligados || contrato !== "desligado";

        $row.toggle(passaTermo && passaCargo && passaSetor && passaStatus && passaRapido && passaDesligado);
    });

    atualizarResumoRH();
}

function atualizarEstadoBuscaAvancadaRH() {
    const temFiltroAvancado =
        normalizarTexto($("#rhFiltroCargo").val()) ||
        normalizarTexto($("#rhFiltroSetor").val()) ||
        normalizarTexto($("#rhFiltroStatus").val());

    $("#btnBuscaAvancadaRH").toggleClass("tem-filtro", !!temFiltroAvancado);
}

function atualizarResumoRH() {
    const $visiveis = $("tr.rh_tb_lin_colob:visible");
    const $todas = $("tr.rh_tb_lin_colob");
    let pendencias = 0;
    let ausencias = 0;
    let desligadosOcultos = 0;
    const detalhes = {
        vencidos: 0,
        alertas: 0,
        agendados: 0,
        epi: 0
    };

    $visiveis.each(function () {
        const $row = $(this);
        const exames = normalizarTexto($row.data("exames"));
        const epi = normalizarTexto($row.data("epi"));
        const status = normalizarTexto($row.data("status"));
        const temVencido = exames.includes("vencido") || $row.find(".status-vencido, .VENCIDO").length > 0;
        const temAlerta = exames.includes("alerta") || $row.find(".status-alerta, .ALERTA").length > 0;
        const temAgendado = exames.includes("agendado") || status.includes("exame agendado") || $row.find(".status-agendado, .AGENDADO").length > 0;
        const temEpi = epi.includes("atencao") || epi.includes("avaliar") || $row.find(".text-danger, .text-warning").length > 0;

        if (temVencido) detalhes.vencidos += 1;
        if (temAlerta) detalhes.alertas += 1;
        if (temAgendado) detalhes.agendados += 1;
        if (temEpi) detalhes.epi += 1;

        if (temVencido || temAlerta || temAgendado || temEpi) {
            pendencias += 1;
        }

        if (["ferias", "afastamento", "saude", "maternidade", "paternidade", "exame agendado"].some(item => status.includes(item))) {
            ausencias += 1;
        }
    });

    $todas.each(function () {
        if (normalizarTexto($(this).data("contrato")) === "desligado" && !$("#chkDesligados").is(":checked")) {
            desligadosOcultos += 1;
        }
    });

    $("#rhResumoVisiveis").text($visiveis.length);
    $("#rhResumoPendencias").text(pendencias);
    $("#rhResumoAusentes").text(ausencias);

    const partesAtencao = [];
    if (detalhes.vencidos) partesAtencao.push(`${detalhes.vencidos} vencido(s)`);
    if (detalhes.alertas) partesAtencao.push(`${detalhes.alertas} a vencer`);
    if (detalhes.agendados) partesAtencao.push(`${detalhes.agendados} agendado(s)`);
    if (detalhes.epi) partesAtencao.push(`${detalhes.epi} EPI`);

    let insight = "Leitura rápida: equipe sem pendências críticas visíveis.";
    if (pendencias > 0) {
        insight = `${pendencias} colaborador(es) precisam de atenção: ${partesAtencao.join(" | ")}.`;
    } else if (ausencias > 0) {
        insight = `${ausencias} colaborador(es) visível(is) estão com férias, afastamento ou situação especial.`;
    } else if (desligadosOcultos > 0) {
        insight = `${desligadosOcultos} desligado(s) estão ocultos. Ative o filtro para consultar históricos.`;
    }

    $("#rhInsight span").text(insight);
}




//Prenche hitorico tabela atestar
//${colab.status_epi}
export function preencherTabelaColaboradoresRH() {
    const tbody = $('#tb_colaboradoresRH tbody');
    let buscarExame;
    let buscarCurso;
    let buscarIntegracao;
    tbody.empty(); // Limpa antes de preencher
    $.ajax({
        url: 'api/rh/listar-geral',
        type: 'GET',
        success: function (data) {
            data.forEach(colab => {
                const linha = `
                        <tr class="rh_tb_lin_colob ${colab.exames} ${colab.contrato === "desligado" ? colab.contrato : colab.motivo}" style="font-size: 13px;"
                            data-id="${colab.idFunc}"
                            data-nome="${colab.nome || ''}"
                            data-cargo="${colab.cargo || ''}"
                            data-setor="${colab.categoria || ''}"
                            data-status="${colab.contrato === "desligado" ? "Desligado" : colab.motivo || ''}"
                            data-contrato="${colab.contrato || ''}"
                            data-exames="${colab.exames || ''}"
                            data-epi="${(colab.status_epi || '').replace(/<[^>]*>/g, ' ').replace(/"/g, '&quot;')}">
                            <td  style="color: #bbbbbb;">${colab.idFunc}</td>
                           <td>
                            <img class="tb_fotoColab"
                                    src="${colab.fotoperfil}?v=${colab.versao_foto}"
                                    onerror="this.src='/imagens/user-default.webp'">
                            </img>${colab.nome}</td>
                            <td style="color: #bbbbbb;">${colab.nascimento_idade}</td>
                            <td style="color: #bbbbbb;;">${colab.cargo}</td>
                            <td style="color: #bbbbbb;">${colab.categoria}</td>
                            <td></td>
                            <td><div id="integracoes_${colab.idFunc}" class="rh_integracao"></div></td>
                            <td><div id="exames_${colab.idFunc}" class="rh_exames"></div></td>
                            <td><div id="cursos_${colab.idFunc}" class="tb_coluna_NRs"></div></td>
                            <td><span class="${colab.contrato === "desligado" ? colab.contrato : colab.motivo.replace(/\s+/g, '')}">${colab.contrato === "desligado" ? "Desligado" : colab.motivo}</span></td>
                            <td><i class="fa-solid fa-trash-can bt_excluirHistoricoAtestar"></i></td>
                        </tr>
                        `;
                tbody.append(linha);
                buscarExame = '#exames_' + colab.idFunc;
                buscarCurso = '#cursos_' + colab.idFunc;
                buscarIntegracao = '#integracoes_' + colab.idFunc;
                load_miniexames_colaborador(colab.idFunc, $(buscarExame));
                load_miniintegracoes_colaborador(colab.idFunc, $(buscarIntegracao));
                load_minicursos_colaborador(colab.idFunc, $(buscarCurso))
            });

            aplicarFiltrosRH();
        },
        error: function (xhr) {
            alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da tabela');
        }
    });
}




