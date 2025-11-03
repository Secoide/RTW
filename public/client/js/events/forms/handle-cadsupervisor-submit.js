import {
    preencherCbxSupervisor
} from "./populate-combobox.js";


export function initFormCadSupervisor() {
    // garante que não cria duplicado
    $(document).off("submit", "#formCadSupervisor");

    // delega o evento ao document
    $(document).on("submit", "#formCadSupervisor", function (e) {
        e.preventDefault();

        const fd = new FormData(this);
        const payload = Object.fromEntries(fd.entries());

        const $wrap = $('#frm_cadastrarOS');
        $.ajax({
            url: '/api/supervisor/cadastrar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function (res) {
                alert(res.message);
                e.target.reset();
                preencherCbxSupervisor('0', $wrap);
            },
            error: function (xhr) {
                const msg = xhr?.responseJSON?.error || 'Erro ao cadastrar Supervisor.';
                alert(msg);
            }
        });
    });
}

