import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";
import { preencherTabelaColaboradoresRH } from "../../bootstrap/rh-init.js";
import {
    preencherCbxSetor,
    preencherCbxCargo
} from "./populate-combobox.js";


export function initColabForm() {
    $(document).off("submit", "#form_atestar");
    $(document).off("submit", "#formColaborador");


    $(document).on("submit", "#formColaborador", async function (e) {
        e.preventDefault();
        
        const botaoClicado = e.originalEvent.submitter?.name || '';
        const formData = $(this).serialize();

        try {

            if (botaoClicado === 'cadColab') {

                const res = await $.ajax({
                    url: '/api/colaboradores/cadastrar',
                    type: 'POST',
                    data: formData,
                    dataType: 'json'
                });

                if (!res.sucesso) {
                    return Toast.fire({
                        icon: "warning",
                        title: "Atenção",
                        theme: "dark",
                        text: res.mensagem
                    });
                }

                // 🔹 Sucesso
                let msg = `Colaborador cadastrado com sucesso!`;
                msg += `\n\nLogin: ${res.id}`;
                msg += `\nSenha: ${res.senhaPadrao}`;

                $('#idColaborador').val(res.id);
                $('#idColaboradorPro').val(res.id);

                await Swal.fire({
                    icon: "success",
                    title: "Cadastrado",
                    theme: "dark",
                    text: msg
                });

                // 🔹 Estado UI
                $('#btn_upload').removeClass('hidden-inicial');
                $('#bt_editColab').removeClass('hidden-inicial');
                $('#bt_cadColaborador').addClass('hidden-inicial');

                const $wrap = $('#formColaboradorProfissional');

                await preencherCbxSetor($wrap);
                await preencherCbxCargo('0', $wrap);

                // 🔹 Navegação por classe (não use .show())
                $('[data-target=".painel_profissional"]').show();
                
            }

            else if (botaoClicado === 'editColab') {

                const idColaborador = $('#idColaborador').val();

                const res = await $.ajax({
                    url: `/api/colaboradores/editar/${idColaborador}`,
                    type: 'PUT',
                    data: formData,
                    dataType: 'json'
                });

                if (res.sucesso) {
                    return Toast.fire({
                        icon: "success",
                        theme: 'dark',
                        text: 'Colaborador atualizado com sucesso!'
                    });
                }

                destacarCampoQueFalta(res.mensagem);

                Toast.fire({
                    icon: "warning",
                    theme: 'dark',
                    title: res.mensagem
                });

            }

        } catch (xhr) {

            let mensagem = xhr.responseJSON?.mensagem || "Erro ao processar a solicitação.";

            const ehAviso =
                mensagem.includes('CPF já cadastrado') ||
                mensagem.includes('RG já cadastrado');

            Toast.fire({
                icon: ehAviso ? "warning" : "error",
                title: ehAviso ? "Atenção" : "Erro",
                theme: "dark",
                text: mensagem
            });

        }

    });


    // delega o evento ao document
    $(document).on("submit", "#form_atestar", function (e) {
        e.preventDefault();
        const formData = $(this).serialize();

        $.ajax({
            url: 'api/colaboradores/atestar',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function (res) {
                if (res.sucesso) {
                    preencherTabelaAtestar($('.painel_todos').find('#id').val());
                    const msg = `Atestar cadastrado com sucesso!`;
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        }
                    });
                    Toast.fire({
                        icon: "success",
                        theme: 'dark',
                        title: msg
                    });
                } else {
                    alert(res.mensagem);
                }
            },
            error: function () {
                alert('Erro ao excluir historico.');
            }
        });
    });


    $(document).on('submit', '#formColaboradorProfissional', function (e) {
        e.preventDefault();
        // Serializa dados do form
        const formData = $(this).serialize();

        const idColaborador = $('#idColaboradorPro').val(); // pega do input hidden
        $.ajax({
            url: `/api/colaboradores/editar-profissional/${idColaborador}`,
            type: 'PUT',
            data: formData,
            dataType: 'json',
            success: function (res) {
                if (res.sucesso) {
                    $('[data-target]').show();
                    const msg = `Dados profissionais atualizados!`;
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        }
                    });
                    Toast.fire({
                        icon: "success",
                        theme: 'dark',
                        title: msg
                    });
                    preencherTabelaColaboradoresRH();
                } else {
                    alert(res.mensagem);
                }
            },
            error: function () {
                alert('Erro ao salvar os dados profissional.');
            }
        });
    });
}




function destacarCampoQueFalta(mensagem) {
    // Remove erros anteriores
    $('input').removeClass('input-erro');

    // 🔎 Verifica nome
    if (mensagem.toLowerCase().includes("nome")) {
        const inp = $('[name="nome"]');
        inp.addClass('input-erro').focus();
    }

    // 🔎 Verifica CPF
    if (mensagem.toLowerCase().includes("cpf")) {
        const inp = $('[name="cpf"]');
        inp.addClass('input-erro').focus();
    }
    // 🔎 Verifica E-mail
    if (mensagem.toLowerCase().includes("e-mail")) {
        const inp = $('[name="email"]');
        inp.addClass('input-erro').focus();
    }
}
