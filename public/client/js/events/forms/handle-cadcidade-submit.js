
export function initFormCadCidade() {
    // garante que não cria duplicado
    $(document).off("submit", "#formCadCidade");

    // delega o evento ao document
    $(document).on("submit", "#formCadCidade", function (e) {
        e.preventDefault();

        const fd = new FormData(this);
        const payload = Object.fromEntries(fd.entries());

        $.ajax({
            url: '/api/cidade/cadastrar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function (res) {
                alert(res.message);
                e.target.reset();
            },
            error: function (xhr) {
                const msg = xhr?.responseJSON?.error || 'Erro ao cadastrar Cidade.';
                alert(msg);
            }
        });
    });
}

