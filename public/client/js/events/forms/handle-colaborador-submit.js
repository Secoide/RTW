import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";


export function initColabForm() {
    $(document).off("submit", "#form_atestar");

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
