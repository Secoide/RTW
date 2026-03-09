
import { preencherTabelaColaboradoresRH } from "../../bootstrap/rh-init.js";
import { carregarAvisos } from "../../bootstrap/home-init.js";

async function open_form_AgendarExame(idColab, idExame) {
    const $wrap = $('#form_agendarExame');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/agendarExame.html');
        $wrap.empty().html(html);
        $('.agendarexame', $wrap).show();
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        
        // espera preencher os combos
        $('#idColabAgendarExame').val(idColab);
        $('#idExameAgendarExame').val(idExame);
        initSubmit();
        // agora seleciona o colaborador
        if (idColab != null) {
            $('#selectColaborador').val(String(idColab)).trigger('change');
        }
        if (idExame != null) {
            $('#selectExame').val(String(idExame)).trigger('change');
        }
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}

function initSubmit() {
    $(document).off("submit", "#formAgendarExame");

    // delega o evento ao document
    $(document).on("submit", "#formAgendarExame", function (e) {
        e.preventDefault();

        const form = this;

        // Exibe a barra de progresso e reseta para 0%
        $('#uploadProgressWrapper').show();
        $('#uploadProgress')
            .css('width', '0%')
            .attr('aria-valuenow', 0)
            .text('0%');

        $.ajax({
            url: '/api/exame/agendar',
            type: 'PUT',
            data: $(form).serialize(),   // mantém
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
                carregarAvisos();
                document.querySelector('.bt_menu[data-target=".painel_exames"]').click();
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
                    title: xhr?.responseText || 'Erro ao agendar exame.'
                });
                // Esconde a barra em caso de erro
                $('#uploadProgressWrapper').fadeOut();
            }
        });
    });
};



// exporta (se usar ES modules)
export { open_form_AgendarExame, initSubmit };
