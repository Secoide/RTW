import { preencherTabelaColaboradoresRH } from "../../bootstrap/rh-init.js";

import {
  preencherCbxColaborador,
  preencherCbxEPI
} from "./populate-combobox.js";


async function open_form_AnexarEPI(idColab, idEPI) {
    const $wrap = $('#form_anexarEPI');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/anexarEPI.html');
        $wrap.empty().html(html);
        $('.anexoepi', $wrap).show();

        // espera preencher os combos
        await preencherCbxColaborador();
        await preencherCbxEPI();
        initSubmit();
        // agora seleciona o colaborador
        if (idColab != null) {
            $('#selectColaborador').val(String(idColab)).trigger('change');
        }
        if (idEPI != null) {
            $('#selectEPI').val(String(idEPI)).trigger('change');
        }
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}

function initSubmit() {    
    $(document).off("submit", "#formAnexarEPI");

    // delega o evento ao document
    $(document).on("submit", "#formAnexarEPI", function (e) {
        e.preventDefault();

        const form = this;
        const fd = new FormData(form);

        // Exibe a barra de progresso e reseta para 0%
        $('#uploadProgressWrapper').show();
        $('#uploadProgress')
            .css('width', '0%')
            .attr('aria-valuenow', 0)
            .text('0%');

        $.ajax({
            url: '/api/epi/upload',
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            dataType: 'json',

            xhr: function () {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            const pct = Math.round((e.loaded / e.total) * 100);
                            $('#uploadProgress')
                                .css('width', pct + '%')
                                .attr('aria-valuenow', pct)
                                .text(pct + '%');
                        }
                    });
                }
                return xhr;
            },

            success: function (res) {
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
                    title: res.message
                });
                form.reset();

                // Finaliza a barra em 100%
                $('#uploadProgress')
                    .css('width', '100%')
                    .attr('aria-valuenow', 100)
                    .text('100%');

                // Opcional: esconder a barra depois de 1s
                setTimeout(() => {
                    $('#uploadProgressWrapper').fadeOut();
                }, 1000);
                preencherTabelaColaboradoresRH();
                document.querySelector('.bt_menu[data-target=".painel_vestimentas"]').click();
            },

            error: function (xhr) {
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
                    icon: "error",
                    theme: 'dark',
                    title: xhr?.responseText || 'Erro ao anexar exame.'
                });
                // Esconde a barra em caso de erro
                $('#uploadProgressWrapper').fadeOut();
            }
        });
    });
};
export { open_form_AnexarEPI };
