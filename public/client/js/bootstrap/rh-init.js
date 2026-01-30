import { get_carregarPerfilUsuario } from "../events/click/handle-abrir-info-colab.js";
import { open_form_AnexarCurso } from "../events/forms/anexarCurso.js";
import { open_form_AnexarExame } from "../events/forms/anexarExame.js";
import { open_form_AnexarEPI } from "../events/forms/anexarEPI.js";


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
    filterTableOS();
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
}




//Prenche hitorico tabela atestar
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
                        <tr class="rh_tb_lin_colob ${colab.exames} ${colab.contrato === "desligado" ? colab.contrato : colab.motivo}" style="font-size: 13px;" data-id="${colab.idFunc}">
                            <td>${colab.idFunc}</td>
                           <td>
                            <img class="tb_fotoColab"
                                    src="${colab.fotoperfil}?v=${colab.versao_foto}"
                                    onerror="this.src='/imagens/user-default.webp'">
                            </img>${colab.nome}</td>
                            <td>${colab.nascimento_idade}</td>
                            <td>${colab.cargo}</td>
                            <td>${colab.categoria}</td>
                            <td>${colab.status_epi}</td>
                            <td><div id="integracoes_${colab.idFunc}" class="rh_integracao"></div></td>
                            <td><div id="exames_${colab.idFunc}" class="rh_exames"></div></td>
                            <td><div id="cursos_${colab.idFunc}" class="tb_coluna_NRs"></div></td>
                            <td><span class="${colab.contrato === "desligado" ? colab.contrato : colab.motivo}">${colab.contrato === "desligado" ? "Desligado" : colab.motivo}</span></td>
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

            filterTableOS();
        },
        error: function (xhr) {
            alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da tabela');
        }
    });
}




