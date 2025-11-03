// /public/client/js/events/transferencia/handle-colaboradores-transferencia.js
import { transferirColaboradores } from "../../services/sockets/colaboradores-socket-service.js";

let fp; // instância global do flatpickr

function initCalendario() {
    if (fp) return;

    const el = document.getElementById("datasMultiHidden");
    if (!el) {
        console.warn("#datasMultiHidden não encontrado.");
        return;
    }
    if (typeof window.flatpickr !== "function") {
        console.warn("Flatpickr não carregado.");
        return;
    }

    fp = flatpickr(el, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        clickOpens: false,
        allowInput: false,
        locale: "pt",
        appendTo: document.querySelector("#modalDataTransferencia .modal-content-data"),
        static: true,
        onChange(selectedDates) {
            $("#abrirCalendario").attr("data-count", selectedDates.length || "");
        }
    });

    $(document).on("click", "#abrirCalendario", function () {
        fp.open();
    });
}

export function initColaboradoresTransferencia(socket) {
    // Ativar/confirmar seleção
    $(document).on("click", ".bt_transferirColabs", function () {
        const $btn = $(this);
        $("#abrirCalendario").attr("data-count", "");

        if ($btn.hasClass("fa-check-to-slot")) {
            // coletar selecionados
            const selecionados = [];
            $(".overlay-transferencia.selecionado").each(function () {
                const $painel = $(this).closest(".painel_OS");
                const idOS = $painel.find(".p_infoOS").data("os");
                $painel.find(".p_colabs [data-id]").each(function () {
                    const idColab = $(this).data("id");
                    const nome = $(this).find(".nome").text().trim(); // 👈 adiciona
                    selecionados.push({ idColab, idOS, nome });
                });
            });

            if (selecionados.length === 0) {
                $(".overlay-transferencia").remove();
                $btn.removeClass("fa-check-to-slot").addClass("fa-arrows-turn-right");
                return;
            }

            // abrir modal de datas
            initCalendario();
            $("#modalDataTransferencia").fadeIn();
            window.transferenciaColabs = selecionados;

        } else {
            // Ativar modo seleção
            window.modoTransferencia = true;
            $(".overlay-transferencia").remove();

            const painelDia = $btn.closest(".painelDia");
            painelDia.find(".painel_OS").each(function () {
                const $painel = $(this);
                if ($painel.find(".p_colabs .colaborador").length >= 1) {
                    const $overlay = $(`
            <div class="overlay-transferencia">
              <i class="fa-solid fa-circle"></i>
            </div>
          `);
                    $painel.css("position", "relative").append($overlay);
                }
            });

            $btn.removeClass("fa-arrows-turn-right").addClass("fa-check-to-slot");
        }
    });

    // Selecionar OS com overlay
    $(document).on("click", ".overlay-transferencia", function (e) {
        e.stopPropagation();
        $(this).toggleClass("selecionado");
        const $icon = $(this).find("i");
        $icon.toggleClass("fa-circle fa-circle-check");
    });

    // Fechar modal
    $(document).on("click", ".fechar-modal-data", function () {
        $(".overlay-transferencia").remove();
        $(".bt_transferirColabs").removeClass("fa-check-to-slot").addClass("fa-arrows-turn-right");
        $("#modalDataTransferencia").fadeOut();
        if (fp) {
            fp.clear();
            $("#abrirCalendario").attr("data-count", "");
        }
    });

    $(document).on('click', '#confirmarTransferencia', function () {
        const datas = fp ? fp.selectedDates.map(d => fp.formatDate(d, 'Y-m-d')) : [];
        if (!datas.length || !window.transferenciaColabs?.length) {
            alert('Selecione ao menos uma data e colaboradores.');
            return;
        }

        // já inclui nomes no payload
        const colaboradores = window.transferenciaColabs.map(c => {
            const nome = $(`.p_colabs [data-id="${c.idColab}"] .nome`).text().trim();
            return { ...c, nome };
        });

        // envia apenas uma vez via WS
        transferirColaboradores(colaboradores, datas);

        // Limpeza de UI
        $('.overlay-transferencia').remove();
        $('.bt_transferirColabs').removeClass('fa-check-to-slot').addClass('fa-arrows-turn-right');
        $('#modalDataTransferencia').fadeOut();
        if (fp) fp.clear();
        window.transferenciaColabs = [];
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
            title: "Colaboradores transferidos!"
        });
    });

}
