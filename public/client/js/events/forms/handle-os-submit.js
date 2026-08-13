
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

    $(document).off("click.osForm", "#bt_cad_cliente");
    $(document).on('click.osForm', '#bt_cad_cliente', function (e) {
        open_form_Cad_Cliente();
    });
    $(document).off("click.osForm", "#bt_cad_supervisor");
    $(document).on('click.osForm', '#bt_cad_supervisor', function (e) {
        open_form_Cad_Supervisor();
    });
    $(document).off("click.osForm", "#bt_cad_cidade");
    $(document).on('click.osForm', '#bt_cad_cidade', function (e) {
        open_form_Cad_Cidade();
    });


    $(document).off("submit.osForm", "#formOS");
    $(document).on("submit.osForm", "#formOS", async function (e) {
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

            if (res.sucesso) {
                const msg = `OS ${botaoClicado === 'cadOS' ? 'cadastrada' : 'atualizada'} com sucesso!`;
                Toast.fire({
                    icon: "success",
                    theme: 'dark',
                    title: msg
                });

                try {
                    await Promise.all(
                        [...document.querySelectorAll(".painelDia")].map(async painel => {
                            await carregarOSComColaboradores(painel);
                        })
                    );
                } catch (refreshErr) {
                    console.error("OS salva, mas ocorreu erro ao atualizar a tela:", refreshErr);
                    Toast.fire({
                        icon: "warning",
                        theme: 'dark',
                        title: "OS salva, mas a tela não atualizou. Recarregue a página."
                    });
                }

            } else {
                const osDigitada = $("#idOS").val()?.trim();
                const duplicada = res.codigo === "OS_DUPLICADA";
                if (duplicada) {
                    Swal.fire({
                        icon: "warning",
                        title: "OS já cadastrada",
                        theme: "dark",
                        text: osDigitada
                            ? `A OS ${osDigitada} já existe no sistema. Verifique o número antes de cadastrar novamente.`
                            : "Essa OS já existe no sistema. Verifique o número antes de cadastrar novamente.",
                        confirmButtonText: "OK"
                    });
                } else {
                    Toast.fire({
                        icon: "warning",
                        theme: 'dark',
                        title: res.mensagem || "A OS não foi salva."
                    });
                }
            }

        } catch (err) {
            console.error(err);
            const resposta = err.responseJSON || {};
            const osDigitada = $("#idOS").val()?.trim();
            const duplicada = err.status === 409 || resposta.codigo === "OS_DUPLICADA";
            const mensagem = resposta.mensagem || resposta.erro || 'A OS não foi salva. Tente novamente.';
            Swal.fire({
                icon: duplicada ? 'warning' : 'error',
                title: duplicada ? 'OS já cadastrada' : 'OS não salva',
                theme: 'dark',
                text: duplicada && osDigitada
                    ? `A OS ${osDigitada} já existe no sistema. Verifique o número antes de cadastrar novamente.`
                    : mensagem,
                confirmButtonText: 'OK'
            });
        }
    });

    $(document).off("submit.osForm", "#formStatusOS");

    // delega o evento ao document
    $(document).on("submit.osForm", "#formStatusOS", function (e) {
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
