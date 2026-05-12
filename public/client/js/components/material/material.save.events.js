import { getVal } from "../../utils/dom/getVal.js";
import { verificarDuplicado } from "../../utils/material/material.validation.js";
import { materialState as state } from "../../state/material.state.js";
import { resetModalMaterial } from "../forms/material.modal.js"
function normalizar(attr) {
    return attr?.replace(/"/g, "").trim();
}

export function initMaterialSave() {
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
    // ==============================
    // 🔥 HANDLER ÚNICO E SEGURO
    // ==============================
    $("#btnSalvarMaterial").off("click").on("click", async function () {

        const $btn = $(this);

        // 🔒 evita duplo clique
        if ($btn.data("loading")) return;
        $btn.data("loading", true);

        try {

            // ==============================
            // 🔹 DADOS INICIAIS
            // ==============================

            const nome = getVal("#nomeMaterial").trim();
            const categoria = getVal("#categoriaMaterial");
            const codigo = getVal("#codigo");
            const fabricante = getVal("#fabricante");

            if (!nome) {
                alert("Informe o nome");
                return;
            }

            const nomeNormalizado = nome.toUpperCase();

            if (verificarDuplicado(nomeNormalizado)) {
                $("#alertDuplicado").show();
                return;
            }

            $("#alertDuplicado").hide();

            // ==============================
            // 🔹 VALIDAR ATRIBUTOS
            // ==============================

            const atributos = Array.isArray(state.atributosSelecionados)
                ? state.atributosSelecionados
                : [];

            const atributosValidados = [];

            for (const attr of atributos) {

                if (!attr || typeof attr !== "string") continue;

                const attrLimpo = normalizar(attr);

                const $input = $(`[data-attr="${attrLimpo}"]:visible`).last();

                if (!$input.length) {
                    console.warn("❌ input não encontrado:", attrLimpo);
                    alert(`Erro no atributo: ${attrLimpo}`);
                    return;
                }

                $input.trigger("input").trigger("change");

                let valor = ($input.val() || "");
                valor = limparValor(valor);

                if (!valor) {
                    alert(`Preencha o atributo: ${attrLimpo}`);
                    return;
                }

                atributosValidados.push({
                    atributo: attrLimpo,
                    valor
                });
            }

            // ==============================
            // 🔹 BUSCAR OU CRIAR MATERIAL
            // ==============================

            let mat;

            const lista = await $.ajax({
                url: `/api/materiais?nome=${encodeURIComponent(nomeNormalizado)}`,
                method: "GET"
            });

            mat = lista.find(m => (m.nome || "").toUpperCase() === nomeNormalizado);

            // 🔒 evita corrida (race condition)
            if (!mat) {

                await $.ajax({
                    url: "/api/materiais",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ nome, categoria })
                });

                const listaAtualizada = await $.ajax({
                    url: `/api/materiais?nome=${encodeURIComponent(nomeNormalizado)}`,
                    method: "GET"
                });

                mat = listaAtualizada.find(m => (m.nome || "").toUpperCase() === nomeNormalizado);

                if (!mat) {
                    throw new Error("Material não encontrado após criação");
                }
            }

            if (!mat?.id) {
                alert("Erro: material sem ID");
                return;
            }

            // ==============================
            // 🔹 CRIAR VARIAÇÃO
            // ==============================

            const vari = await $.ajax({
                url: "/api/materiais/variacoes",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    id_material: mat.id,
                    codigo,
                    fabricante
                })
            });

            const idVariacao = vari?.insertId || vari?.id;

            if (!idVariacao) {
                throw new Error("ID da variação inválido");
            }

            // ==============================
            // 🔹 SALVAR ATRIBUTOS
            // ==============================

            await Promise.all(
                atributosValidados.map(attr =>
                    $.ajax({
                        url: "/api/materiais/variacoes/atributos",
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify({
                            id_variacao: idVariacao,
                            atributo: attr.atributo,
                            valor: attr.valor
                        })
                    })
                )
            );

            // ==============================
            // 🔹 SUCESSO
            // ==============================
            Toast.fire({
                icon: "success",
                theme: 'dark',
                title: "Material cadastrado com sucesso"
            });

            if (typeof resetModalMaterial === "function") {
                resetModalMaterial();
            }

            $("#modalMaterial").addClass("hidden");

            state.atributosSelecionados = [];

            // 🔄 atualizações (seguro rodar em paralelo)
            await Promise.all([
                typeof carregarCatalogoMateriais === "function" ? carregarCatalogoMateriais() : null,
                typeof carregarMateriais === "function" ? carregarMateriais() : null
            ]);

        } catch (err) {

            console.error("💥 ERRO AO SALVAR MATERIAL:", err);
            alert("Erro ao salvar material");

        } finally {

            // 🔓 libera botão
            $btn.data("loading", false);
        }

    });


    function limparValor(valor) {
        if (!valor) return "";

        return valor
            .replace(/\\"/g, '"')
            .replace(/^"(.*)"$/, '$1')
            .replace(/""+/g, '"') // evita "" duplicado
            .trim();
    }
}