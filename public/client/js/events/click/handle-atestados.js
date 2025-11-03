 
import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";
 
 
 

 $(document).on('click', '.bt_excluirHistoricoAtestar', function () {
        Swal.fire({
            title: "Deletar?",
            text: "Você não poderá reverter isso!",
            icon: "warning",
            theme: "dark",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, apagar!"
        }).then((result) => {
            if (result.isConfirmed) {
                const idatestar = $(this).closest('tr').data('idatestar');

                $.ajax({
                    url: `/api/atestado/deletar/${idatestar}`,   // agora vai no padrão REST
                    type: 'DELETE',
                    headers: { Authorization: 'meuToken123' }, // se usar autenticação
                    success: function (data) {
                        Swal.fire(
                            'Deletado!',
                            data.mensagem || 'Histórico foi excluído com sucesso.',
                            'success'
                        );
                        preencherTabelaAtestar($('.painel_todos').find('#id').val());
                    },
                    error: function (xhr) {
                        Swal.fire(
                            'Erro!',
                            xhr.responseJSON?.mensagem || xhr.responseText || 'Erro ao excluir histórico.',
                            'error'
                        );
                    }
                });
            }
        });
    });
