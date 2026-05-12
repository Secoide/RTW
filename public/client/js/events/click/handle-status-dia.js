import { alterarStatusProgDia } from "../../services/sockets/status-dia-socket.js";



$(document).on('click', '.iconeStatusDia i', async function (event, data) {
    event.preventDefault();
    event.stopPropagation();
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
            ? "Deseja finalizar programção para lançamento?"
            : "Modificar programação novamente?";
        const btConfirm = indoFinalizar ? "Sim, finalizar!" : "Modificar!";
        if (!(await confirmarAcao(msg, btConfirm))) return false;
    }

    async function confirmarAcao(msg, btConfirm) {

        const result = await Swal.fire({
            text: msg,
            icon: "warning",
            theme: "dark",
            showCancelButton: true,
            confirmButtonColor: "#51d630",
            cancelButtonColor: "#d33",
            confirmButtonText: btConfirm
        });

        if (!result.isConfirmed) {
            $wrapper.data('busy', false);
            return false;
        }

        if (msg.includes("finalizar")) {
            Toast.fire({
                icon: "success",
                theme: 'dark',
                title: "Programação do dia finalizada!"
            });
        }

        return true;
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

$(document).on('keydown', '#anotacaoTexto', function (e) {

    if (e.key === 'Enter' && !e.shiftKey) {

        e.preventDefault();

        $('#btnAdicionarAnotacao').click();
    }
});

$(document).on(
    'click',
    '.iconeAnotacaoDia i',
    async function (event) {

        event.preventDefault();
        event.stopPropagation();

        const $icon = $(this);

        const $painel =
            $icon.closest('.painelDia');

        // data
        const dataDia =
            $painel.attr('data-dia');

        // salva hidden
        $('#datadiaAnot').val(dataDia);

        const [ano, mes, dia] =
            dataDia.split('-');

        $('#dataAnotacaoVisual').val(
            `${dia}/${mes}/${ano}`
        );

        // limpa lista anterior
        $('.lista-anotacoes').html('');

        try {

            // busca anotações
            const dados = await $.get(
                `/api/os/anotacoes/${dataDia}`
            );
            if (
                dados &&
                dados.anotacoes &&
                dados.anotacoes.length > 0
            ) {

                dados.anotacoes.forEach(
                    (texto, index) => {

                        const icone =
                            dados.icones?.[index] || '📝';

                        $('.lista-anotacoes')
                            .append(`
                                <div class="item-anotacao">

                                    <div class="anotacao-info">

                                        <span class="anotacao-icone">
                                            ${icone}
                                        </span>

                                        <span class="anotacao-texto">
                                            ${texto}
                                        </span>

                                    </div>

                                    <button class="btn-remover-anotacao">
                                        ✖
                                    </button>

                                </div>
                            `);
                    }
                );
            }

        } catch (err) {

            console.error(
                'Erro ao carregar anotações:',
                err
            );
        }

        // abre modal
        $('#modalAnotacao')
            .css('display', 'flex');
    }
);


// HOVER TOOLTIP

$(document).on(
    'mouseenter',
    '.iconeAnotacaoDia',
    async function () {

        const $box = $(this);

        const $painel =
            $box.closest('.painelDia');

        const dataDia =
            $painel.attr('data-dia');

        const $preview =
            $box.find('.preview-anotacoes');

        try {

            const dados = await $.get(
                `/api/os/anotacoes/${dataDia}`
            );

            $preview.html('');

            if (
                dados &&
                dados.anotacoes &&
                dados.anotacoes.length
            ) {

                dados.anotacoes.forEach(
                    (texto, index) => {

                        const icone =
                            dados.icones?.[index]
                            || '📝';

                        $preview.append(`
                            <div class="preview-anotacao-item">

                                <span class="preview-anotacao-icone">
                                    ${icone}
                                </span>

                                <span class="preview-anotacao-texto">
                                    ${texto}
                                </span>

                            </div>
                        `);
                    }
                );

            } else {

                $preview.html(`
                    <div class="preview-anotacao-item">

                        <span class="preview-anotacao-texto">
                            Sem anotações
                        </span>

                    </div>
                `);
            }

            $preview.css('display', 'flex');

        } catch (err) {

            console.error(err);
        }
    }
);

$(document).on(
    'mouseleave',
    '.iconeAnotacaoDia',
    function () {

        $(this)
            .find('.preview-anotacoes')
            .hide();
    }
);