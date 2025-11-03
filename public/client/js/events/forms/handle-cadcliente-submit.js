import {
    preencherCbxCliente
} from "./populate-combobox.js";


export function initFormCadCliente() {
    // garante que não cria duplicado
    $(document).off("submit", "#formCadCliente");

    // delega o evento ao document
    $(document).on("submit", "#formCadCliente", function (e) {
        e.preventDefault();

        const fd = new FormData(this);
        const payload = Object.fromEntries(fd.entries());

        const $wrap = $('#frm_cadastrarOS');
        $.ajax({
            url: 'api/empresa/cadastrar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function (res) {
                alert(res.message);
                e.target.reset();
                preencherCbxCliente($wrap);
            },
            error: function (xhr) {
                const msg = xhr?.responseJSON?.error || xhr?.responseText || 'Erro ao cadastrar Cliente.';
                alert(msg);
            }
        });
    });
}
