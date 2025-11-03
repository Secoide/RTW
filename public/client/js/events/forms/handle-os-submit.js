
import { carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { initFormCadCliente } from "./handle-cadcliente-submit.js";
import { initFormCadSupervisor } from "./handle-cadsupervisor-submit.js";
import { initFormCadCidade } from "./handle-cadcidade-submit.js";
import {
    preencherCbxCliente, preencherCbxCidade
} from "./populate-combobox.js";


export function initOSForm() {
    initFormCadCliente();
    initFormCadSupervisor();
    initFormCadCidade();

    $(document).on('click', '#bt_cad_cliente', function (e) {
        open_form_Cad_Cliente();
    });
    $(document).on('click', '#bt_cad_supervisor', function (e) {
        open_form_Cad_Supervisor();
    });
    $(document).on('click', '#bt_cad_cidade', function (e) {
        open_form_Cad_Cidade();
    });


    $(document).off("submit", "#formOS");
    $(document).on("submit", "#formOS", async function (e) {
        // delega o evento ao document
        e.preventDefault();

        const botaoClicado = e.originalEvent?.submitter?.name || '';
        const form = this;

        // Monte os dados de forma segura
        const params = $(form).serialize() + `&acao=${encodeURIComponent(botaoClicado)}`;

        try {
            const res = await $.ajax({
                url: '/api/os/cad_OS',
                method: 'POST',
                data: params,
                dataType: 'json'
                // contentType padrão (x-www-form-urlencoded) já serve para serialize()
            });

            if (res.sucesso) {
                await Promise.all(
                    [...document.querySelectorAll(".painelDia")].map(async painel => {
                        await carregarOSComColaboradores(painel);
                    })
                );
                const msg = `OS ${botaoClicado === 'cadOS' ? 'cadastrada' : 'atualizada'} com sucesso!`;
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
                    icon: "warning",
                    theme: 'dark',
                    title: res.mensagem
                });
            }

        } catch (err) {
            console.error(err);
            alert('Erro ao processar a solicitação de OS.');
        }
    });

    $(document).off("submit", "#formStatusOS");

    // delega o evento ao document
    $(document).on("submit", "#formStatusOS", function (e) {
        e.preventDefault();
        // Serializa dados do form
        const formData = $(this).serialize();

        const idOS = $('#idOS').val(); // pega do input hidden
        $.ajax({
            url: `/api/os/editar-status/${idOS}`,
            type: 'PUT',
            data: formData,
            dataType: 'json',
            success: function (res) {
                if (res.sucesso) {
                    Promise.all(
                        [...document.querySelectorAll(".painelDia")].map(async painel => {
                            await carregarOSComColaboradores(painel);
                        })
                    );
                    const msg = `Status OS atualizado!`;
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
                alert('Erro ao salvar status atual da OS.');
            }
        });
    });

}


// ABRIR Form cadastar Cliente
async function open_form_Cad_Cliente() {
    const $wrap = $('#form_cadCliente');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/cadastrar_cliente.html');
        $wrap.empty().html(html);
        $('.cadCliente', $wrap).show();

        // espera preencher os combos
        await preencherCbxCidade(0, $wrap);

    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}

// ABRIR Form cadastar Supervisor
async function open_form_Cad_Supervisor() {
    const $wrap = $('#form_cadSupervisor');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/cadastrar_supervisor.html');
        $wrap.empty().html(html);
        $('.cadSupervisor', $wrap).show();
        // espera preencher os combos
        await preencherCbxCliente($wrap);
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}


// ABRIR Form cadastar Cidade
async function open_form_Cad_Cidade() {
    const $wrap = $('#form_cadCidade');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/cadastrar_cidade.html');
        $wrap.empty().html(html);
        $('.cadCidade', $wrap).show();
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}