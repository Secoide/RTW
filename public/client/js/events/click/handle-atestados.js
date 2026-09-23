 
import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";
import {
    abrirModalJustificarFalta,
    decidirFaltaNaoJustificada
} from "../../services/sockets/socket-notifications.js";
 
 
 

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

$(document).on('click', '.atestar-pendente-acao', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const botao = this;
    const acao = botao.dataset.atestarAcao;
    const idAprovacao = botao.dataset.aprovacaoId;
    const idInterrupcao = botao.dataset.interrupcaoId;
    const $linha = $(botao).closest('tr');
    const idColaborador = $('.painel_todos').find('#form_atestar [name="idColab"], #id').first().val();

    if (!acao || $(botao).prop('disabled')) return;

    if (acao === 'com-atestado') {
        if (!idAprovacao) {
            Swal.fire('Atenção', 'Esta pendência não possui uma análise do RH vinculada.', 'warning');
            return;
        }

        abrirModalJustificarFalta(idAprovacao, () => preencherTabelaAtestar(idColaborador));
        return;
    }

    if (acao === 'nao-justificado' && !idAprovacao) {
        Swal.fire('Atenção', 'Esta pendência não possui uma análise do RH vinculada.', 'warning');
        return;
    }

    if (acao === 'excluir' && !idInterrupcao) return;

    const confirmacao = await Swal.fire({
        title: acao === 'excluir' ? 'Excluir pendência?' : 'Marcar como não justificada?',
        text: acao === 'excluir'
            ? 'A pendência será removida e deixará de aparecer para o RH.'
            : 'A falta será confirmada como não justificada.',
        icon: 'warning',
        theme: 'dark',
        showCancelButton: true,
        confirmButtonText: acao === 'excluir' ? 'Excluir' : 'Confirmar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacao.isConfirmed) return;

    $linha.find('.atestar-pendente-acao').prop('disabled', true);

    try {
        let data;

        if (acao === 'nao-justificado') {
            data = await decidirFaltaNaoJustificada(idAprovacao);
        } else {
            const resposta = await fetch(`/api/colaboradores/atestar-pendente/${encodeURIComponent(idInterrupcao)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            data = await resposta.json().catch(() => ({}));

            if (!resposta.ok || data.sucesso === false) {
                throw new Error(data.mensagem || 'Não foi possível excluir a pendência.');
            }
        }

        preencherTabelaAtestar(idColaborador);
        Swal.fire({
            icon: acao === 'excluir' ? 'success' : 'info',
            title: acao === 'excluir' ? 'Pendência excluída' : 'Falta analisada',
            text: data.mensagem || 'Registro atualizado com sucesso.',
            timer: 2200,
            showConfirmButton: false
        });
    } catch (erro) {
        $linha.find('.atestar-pendente-acao').prop('disabled', false);
        Swal.fire('Não foi possível atualizar', erro.message || 'Tente novamente.', 'error');
    }
});
