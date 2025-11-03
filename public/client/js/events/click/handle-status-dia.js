import { alterarStatusProgDia } from "../../services/sockets/status-dia-socket.js";

$(document).on('click', '.iconeStatusDia i', async function (event, data) {
    event.preventDefault();
    event.stopPropagation();

    const isProgramatico = !!(data && data.programatico);

    // Nível de acesso (parse explícito + default seguro)
    const rawNivel = sessionStorage.getItem('nivel_acesso');
    const nivelAcesso = Number.isFinite(Number(rawNivel)) ? Number(rawNivel) : Number.POSITIVE_INFINITY;

    // Regra atual: bloquear usuários com nível <= 5 quando NÃO for programático
    if (!isProgramatico && nivelAcesso <= 5) return false;

    const $icon = $(this);
    const $wrapper = $icon.closest('.iconeStatusDia'); // mais resiliente que .parent()
    const $painel = $icon.closest('.painelDia');

    if ($wrapper.length === 0 || $painel.length === 0) return false;

    // Evita cliques repetidos durante animação
    if ($wrapper.data('busy')) return false;
    $wrapper.data('busy', true);

    // Ícone bloqueado (zipper) => shake e sai
    if ($icon.hasClass('fa-file-zipper')) {
        $wrapper.addClass('shake');
        setTimeout(() => $wrapper.removeClass('shake'), 300);
        $wrapper.data('busy', false);
        return false;
    }

    // Confirmações (somente em ações não programáticas)
    if (!isProgramatico) {
        const indoFinalizar = $icon.hasClass('fa-file-signature');
        const msg = indoFinalizar
            ? "Programação finalizada para lançamento?"
            : "Modificar programação novamente?";
        if (!confirm(msg)) {
            $wrapper.data('busy', false);
            return false;
        }
    }

    

    // Define status desejado com base no estado atual do ícone
    // (ideal: ler/gravar em data-status no wrapper)
    let statusDesejado = $icon.hasClass('fa-file-signature') ? 1 : 0;

    // Animação (limpa fila antes)
    $wrapper.stop(true, true);

    // Se puder, prefira CSS com transform. Mantendo jQuery animate por compat:
    // Sobe 40px
    $wrapper.animate({ top: '-=40px' }, 150, function () {
        $wrapper.addClass('rotate');

        // Troca ícone no meio da rotação
        setTimeout(() => {
            if (statusDesejado === 1) {
                $icon.removeClass('fa-file-signature').addClass('fa-file-circle-check');
                $painel.addClass('iluminar_verde');
            } else {
                $painel.removeClass('iluminar_verde');
                $icon.removeClass('fa-file-circle-check').addClass('fa-file-signature');
            }
        }, 150);

        // Desce e conclui
        setTimeout(async () => {
            $wrapper.removeClass('rotate');

            $wrapper.animate({ top: '+=40px' }, 150, async function () {
                try {
                    if (!isProgramatico) {
                        // Aguarda backend e valida sucesso
                        const ok = await alterarStatusProgDia($icon, statusDesejado);
                        if (ok === false) throw new Error('Falha ao atualizar status no servidor.');
                    }
                } catch (err) {
                    // Reverte UI em caso de erro
                    if (statusDesejado === 1) {
                        $icon.removeClass('fa-file-circle-check').addClass('fa-file-signature');
                        $painel.removeClass('iluminar_verde');
                    } else {
                        $icon.removeClass('fa-file-signature').addClass('fa-file-circle-check');
                        $painel.addClass('iluminar_verde');
                    }
                    console.error(err);
                    alert('Não foi possível salvar a alteração. Tente novamente.');
                } finally {
                    $wrapper.data('busy', false);
                }
            });
        }, 300);
    });
});
