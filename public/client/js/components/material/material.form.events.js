import { getVal } from "../../utils/dom/getVal.js";
import { renderVariacoesExistentes } from "../../utils/dom/material-form-render.js";
import { materialState as state } from "../../state/material.state.js";
import { ATRIBUTOS_POR_MATERIAL, CATEGORIA_POR_MATERIAL } from "../../utils/material/material.config.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { atualizarEstadoImagemMaterial } from "../forms/material.modal.js";

export function initMaterialForm() {


    $("#nomeMaterial")
        .off("input.materialForm")
        .on("input.materialForm", async function () {

        const nome = getVal("#nomeMaterial").trim().toUpperCase();

        if (ATRIBUTOS_POR_MATERIAL[nome]) {
            state.atributosSelecionados = [...ATRIBUTOS_POR_MATERIAL[nome]];
            renderAtributos();
        }

        if (CATEGORIA_POR_MATERIAL[nome]) {
            $("#categoriaMaterial").val(CATEGORIA_POR_MATERIAL[nome]);
        }

        if (nome.length < 2) {
            $("#variacoesExistentes").empty();
            return;
        }

        try {

            const variacoes = await $.ajax({
                url: `/api/materiais/variacoes`,
                method: "GET"
            });

            const existentes = variacoes.filter(
                v => v.nome && v.nome.trim().toUpperCase().includes(nome)
            );

            renderVariacoesExistentes(existentes);

        } catch (err) {
            console.error("Erro ao buscar variações:", err);
        }

    });

    //SALVAR FOTO
    (function () {
        if (window.__imagemMaterialUploadInit) return;
        window.__imagemMaterialUploadInit = true;

        let croppie = null;

        function openCropModal() {
            document.getElementById('crop-modal').hidden = false;
            document.body.classList.add('modal-open');
            const el = document.getElementById('crop-area');
            if (croppie) { croppie.destroy(); croppie = null; }
            el.innerHTML = '';
            croppie = new Croppie(el, {
                viewport: { width: 220, height: 220 },
                boundary: { width: 280, height: 280 },
                enableExif: true,
                enableZoom: true
            });
        }
        function closeCropModal() {
            document.getElementById('crop-modal').hidden = true;
            document.body.classList.remove('modal-open');
            if (croppie) { croppie.destroy(); croppie = null; }
            $('#select_imagemmaterial').val('');
            $('#crop-area').empty();
        }

        // 1) Botão "Carregar..." -> abrir seletor
        $(document).on('click', '#btn_uploadImagem[type="button"]', function () {
            if (!$('#idMaterial').val()) {
                alert('Salve o material antes de adicionar imagem.');
                atualizarEstadoImagemMaterial();
                return;
            }
            limparImagemExistenteSelecionada();
            $('#select_imagemmaterial').trigger('click');
        });

        // 2) Selecionar arquivo -> abrir modal e carregar imagem
        $(document).on('change', '#select_imagemmaterial', function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (ev) {
                openCropModal();
                croppie.bind({ url: ev.target.result });
                // não mudar o #btn_upload; ele segue “Carregar...”
            };
            reader.readAsDataURL(file);
        });

        // 3) Controles do modal
        $(document).on('click', '#rotLeft', () => { if (croppie) croppie.rotate(-90); });
        $(document).on('click', '#rotRight', () => { if (croppie) croppie.rotate(90); });
        $(document).on('click', '#btn_cancel_crop', closeCropModal);

        // 4) SALVAR (dentro do modal)
        $(document).on('click', '#btn_save_crop', async function () {
            const userId = $('#idMaterial').val();
            if (!userId) { alert('ID do material não encontrado.'); return; }
            if (!$('#select_imagemmaterial')[0].files.length) { alert('Selecione uma imagem.'); return; }

            // feedback no botão
            const $btn = $(this);
            const prevText = $btn.text();
            $btn.prop('disabled', true).text('Enviando...');

            try {
                // 1) Obtém a imagem recortada em PNG
                const pngBlob = await croppie.result({
                    type: 'blob',
                    format: 'png',
                    size: 'viewport'
                });

                // 2) Converte PNG → WEBP usando Canvas (otimizado)
                const webpBlob = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;

                        const ctx = canvas.getContext('2d', { alpha: true });

                        // melhora a interpolação, evita serrilhado
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = "high";

                        ctx.drawImage(img, 0, 0);

                        // exporta com compressão otimizada
                        canvas.toBlob(
                            blob => resolve(blob),
                            'image/webp',
                            0.72 // qualidade ideal para avatar (70~75%)
                        );
                    };
                    img.onerror = reject;
                    img.src = URL.createObjectURL(pngBlob);
                });


                // FormData direto (não depende do <form> agora)
                const formData = new FormData();
                formData.append('imagemmaterial', webpBlob, 'imagemmaterial.webp');
                formData.append('id', userId);

                const resp = await $.ajax({
                    url: '/api/materiais/upload-imagem',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false
                });

                $('#imagemmaterial')
                    .attr('src', resp.novaFotoURL + '?t=' + Date.now())
                    .on('error', function () {
                        console.warn("⚠️ Imagem de material não encontrada, usando padrão.");
                        $(this).attr('src', '/imagens/imagemmaterial.webp');
                    });

                closeCropModal();
                limparImagemExistenteSelecionada();

                if (typeof window.carregarCatalogoMateriais === 'function') {
                    await window.carregarCatalogoMateriais();
                }
            } catch (err) {
                alert(err?.responseJSON?.error || err?.responseText || 'Erro no upload da imagem');
            } finally {
                $btn.prop('disabled', false).text(prevText);
            }
        });
    })();

    initSelecionarImagemExistente();

}

function initSelecionarImagemExistente() {
    if (window.__imagemMaterialExistenteInit) return;
    window.__imagemMaterialExistenteInit = true;

    let cache = [];
    let listaAtual = [];
    let paginaAtual = 1;
    const porPagina = 10;

    $(document).on('click', '#btn_usarImagemExistente', async function () {
        if (!$('#idMaterial').val()) {
            alert('Salve o material antes de usar uma imagem existente.');
            atualizarEstadoImagemMaterial();
            return;
        }

        const $painel = $('#materialImagemExistentePainel');
        $painel.prop('hidden', false);

        if (!cache.length) {
            $('#listaImagemMaterialExistente').html('<span>Carregando materiais com imagem...</span>');
            try {
                const variacoes = await $.get('/api/materiais/variacoes');
                cache = (variacoes || []).filter(item => item.imagem);
            } catch (err) {
                console.error('Erro ao buscar imagens existentes:', err);
                $('#listaImagemMaterialExistente').html('<span>Não foi possível carregar as imagens.</span>');
                return;
            }
        }

        listaAtual = cache;
        paginaAtual = 1;
        renderImagensExistentes(listaAtual, paginaAtual, porPagina);
        $('#buscaImagemMaterialExistente').trigger('focus');
    });

    $(document).on('click', '#btnFecharImagemExistente', function () {
        $('#materialImagemExistentePainel').prop('hidden', true);
    });

    $(document).on('input', '#buscaImagemMaterialExistente', function () {
        const termo = normalizarTextoImagem($(this).val());
        const filtrados = cache.filter(item => normalizarTextoImagem([
            item.nome,
            item.codigo,
            item.fabricante,
            item.atributos
        ].join(' ')).includes(termo));

        listaAtual = filtrados;
        paginaAtual = 1;
        renderImagensExistentes(listaAtual, paginaAtual, porPagina);
    });

    $(document).on('click', '.material-img-pagina', function () {
        const totalPaginas = Math.max(Math.ceil(listaAtual.length / porPagina), 1);
        const direcao = $(this).data('direcao');

        if (direcao === 'anterior') paginaAtual = Math.max(1, paginaAtual - 1);
        if (direcao === 'proxima') paginaAtual = Math.min(totalPaginas, paginaAtual + 1);

        renderImagensExistentes(listaAtual, paginaAtual, porPagina);
    });

    $(document).on('click', '.material-img-opcao', function () {
        const idOrigem = $(this).data('id');
        const imagem = $(this).data('imagem');
        const nome = $(this).data('nome') || 'material selecionado';

        $('#imagemMaterialOrigemId').val(idOrigem);
        $('#imagemMaterialOrigemTexto').text(`Usando imagem de: ${nome}`);
        $('#imagemmaterial').attr('src', `${imagem}?t=${Date.now()}`);
        $('#select_imagemmaterial').val('');
        $('#materialImagemExistentePainel').prop('hidden', true);
    });
}

function renderImagensExistentes(lista, pagina = 1, porPagina = 10) {
    if (!lista.length) {
        $('#listaImagemMaterialExistente').html('<span>Nenhum material com imagem encontrado.</span>');
        $('#paginacaoImagemMaterialExistente').empty();
        return;
    }

    const totalPaginas = Math.max(Math.ceil(lista.length / porPagina), 1);
    const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * porPagina;
    const itensPagina = lista.slice(inicio, inicio + porPagina);

    const html = itensPagina.map(item => {
        const detalhe = [item.codigo, item.fabricante, item.atributos].filter(Boolean).join(' | ');
        const img = `${item.imagem}?v=${item.versao_foto || ''}`;

        return `
            <button type="button" class="material-img-opcao"
                data-id="${escapeAttrImagem(item.id)}"
                data-imagem="${escapeAttrImagem(item.imagem)}"
                data-nome="${escapeAttrImagem(item.nome || 'Material')}">
                <img src="${escapeAttrImagem(img)}" alt="">
                <span>
                    <strong>${escapeHtmlImagem(item.nome || 'Material')}</strong>
                    <small>${escapeHtmlImagem(detalhe || 'Sem detalhes adicionais')}</small>
                </span>
            </button>
        `;
    }).join('');

    $('#listaImagemMaterialExistente').html(html);
    $('#paginacaoImagemMaterialExistente').html(`
        <button type="button" class="material-img-pagina" data-direcao="anterior" ${paginaSegura <= 1 ? 'disabled' : ''}>
            Anterior
        </button>
        <span>${paginaSegura}/${totalPaginas} - ${lista.length} imagem(ns)</span>
        <button type="button" class="material-img-pagina" data-direcao="proxima" ${paginaSegura >= totalPaginas ? 'disabled' : ''}>
            Próxima
        </button>
    `);
}

export async function aplicarImagemExistenteSelecionada(idVariacao) {
    const idOrigem = $('#imagemMaterialOrigemId').val();
    if (!idOrigem || !idVariacao) return null;

    return $.ajax({
        url: `/api/materiais/variacoes/${idVariacao}/imagem-existente`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ id_origem: idOrigem })
    });
}

export function limparImagemExistenteSelecionada() {
    $('#imagemMaterialOrigemId').val('');
    $('#imagemMaterialOrigemTexto').text('');
}

function normalizarTextoImagem(valor = '') {
    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function escapeHtmlImagem(valor = '') {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttrImagem(valor = '') {
    return escapeHtmlImagem(valor);
}
