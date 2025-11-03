import { preencherTabelaColaboradoresRH } from "../../bootstrap/rh-init.js";

import {
    preencherCbxColaborador,
    preencherCbxCurso
} from "./populate-combobox.js";

// /public/client/js/events/forms/anexarCurso.js
async function open_form_AnexarCurso(idColab, idExame) {
    const $wrap = $('#form_anexarCurso');

    try {
        const html = await $.get('../html/forms/anexarCurso.html');
        $wrap.empty().html(html);
        $('.anexocurso', $wrap).show();

        await preencherCbxColaborador();
        await preencherCbxCurso();
        initSubmit()
        if (idColab != null) {
            $('#selectColaborador').val(String(idColab)).trigger('change');
        }
        if (idExame != null) {
            $('#selectCurso').val(String(idExame)).trigger('change'); // corrigido
        }
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}

function initSubmit() {
    $(document).off("submit", "#formAnexarCurso");

    // delega o evento ao document
    $(document).on("submit", "#formAnexarCurso", function (e) {
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
            url: '/api/curso/upload',
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
                document.querySelector('.bt_menu[data-target=".painel_cursos"]').click();
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
                    title: xhr?.responseText || 'Erro ao anexar Curso.'
                });
                // Esconde a barra em caso de erro
                $('#uploadProgressWrapper').fadeOut();
            }
        });
    });

}


// exporta (se usar ES modules)
export { open_form_AnexarCurso, initSubmit };
