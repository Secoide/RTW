import { validarCadastroMaterial } from "../../utils/dom/material-form-render.js";
import { getVal } from "../../utils/dom/getVal.js";
import { normalizarAtributo, parseAtributos } from "../../utils/material/material.utils.js";
import { materialState as state } from "../../state/material.state.js";
import { fecharModalMaterial, atualizarEstadoImagemMaterial, atualizarModoModalMaterial } from "../forms/material.modal.js";
import { carregarVariacoes } from "../../services/api/material.api.js";
import { aplicarImagemExistenteSelecionada } from "./material.form.events.js";
import { obterRelacionadosMaterial } from "./material.relacionados.js";

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
    $("#btnSalvarMaterial, #btnSalvarMaterialFoto").off("click.materialSalvar").on("click.materialSalvar", async function () {

        const adicionarFoto = this.id === "btnSalvarMaterialFoto";
        const $btn = $("#btnSalvarMaterial, #btnSalvarMaterialFoto");

        // 🔒 evita duplo clique
        if ($btn.data("loading")) return;
        $btn.data("loading", true);

        try {

            // ==============================
            // 🔹 DADOS INICIAIS
            // ==============================

            const nome = getVal("#nomeMaterial").trim();
            const categoria = getVal("#categoriaMaterial");
            const codigo = getVal("#codigo").trim();
            const fabricante = getVal("#fabricante").trim();
            const unidade = getVal("#unidadeMaterial") || "un";

            const { primeiroInvalido, atributos: atributosValidados } = validarCadastroMaterial();
            if (primeiroInvalido) {
                primeiroInvalido.focus();
                return;
            }

            const idEditando = $("#modoEdicaoMaterial").val() === "1" ? $("#idMaterial").val() : "";
            let relacionados;
            try {
                relacionados = obterRelacionadosMaterial();
            } catch (erro) {
                $("#materialAvisoCadastro").text(erro.message);
                return;
            }

            if (!idEditando) {
                const normalizar = valor => String(valor ?? "").trim().toLowerCase();
                const assinatura = registro => JSON.stringify(Object.entries(registro)
                    .map(([chave, valor]) => [normalizarAtributo(chave), normalizar(valor)])
                    .sort(([a], [b]) => a.localeCompare(b)));
                const atributosNovos = assinatura(Object.fromEntries(atributosValidados.map(a => [a.atributo, a.valor])));
                const duplicado = state.listaVariacoes.some(item =>
                    normalizar(item.nome) === normalizar(nome) &&
                    normalizar(item.fabricante) === normalizar(fabricante) &&
                    normalizar(item.codigo) === normalizar(codigo) &&
                    normalizar(item.unidade || "un") === normalizar(unidade) &&
                    assinatura(parseAtributos(item.atributos)) === atributosNovos
                );
                if (duplicado) {
                    $("#materialAvisoCadastro").text("Essa variação já existe.");
                    return;
                }
            }

            let idVariacao = idEditando;
            const salvarJson = (url, method, dados) => $.ajax({
                url, method, contentType: "application/json", data: JSON.stringify(dados)
            });
            if (idEditando) {
                await salvarJson("/api/materiais/variacoes/" + idEditando, "PUT", {
                    nome, categoria, codigo, fabricante, unidade, atributos: atributosValidados, relacionados
                });
            } else {
                const material = await salvarJson("/api/materiais", "POST", { nome, categoria });
                if (!material?.id) throw new Error("ID do material inválido");

                const variacao = await salvarJson("/api/materiais/variacoes", "POST", {
                    id_material: material.id, codigo, fabricante, unidade, atributos: atributosValidados,
                    imagem: getVal("#imagemMaterialImportada") || null, relacionados
                });
                idVariacao = variacao?.insertId || variacao?.id;
                if (!idVariacao) throw new Error("ID da variação inválido");

                $("#idMaterial").val(idVariacao);
                $("#imagemMaterialImportada").val("");
                $("#modoEdicaoMaterial").val("1");
                $("#btnSalvarMaterial").text("Salvar edição");
                $("#btnSalvarMaterialFoto, #materialEdicaoPainel").hide();
                atualizarModoModalMaterial("edicao", "Material cadastrado");
                atualizarEstadoImagemMaterial();
            }

            await aplicarImagemExistenteSelecionada(idVariacao);
            Toast.fire({
                icon: "success",
                theme: "dark",
                title: idEditando ? "Material atualizado com sucesso" : "Material cadastrado com sucesso"
            });

            if (adicionarFoto) {
                $("#btn_uploadImagem").trigger("focus");
            } else {
                fecharModalMaterial();
            }

            await Promise.allSettled([
                carregarVariacoes(),
                typeof carregarCatalogoMateriais === "function" ? carregarCatalogoMateriais() : null,
                typeof carregarMateriais === "function" ? carregarMateriais() : null
            ]);

        } catch (err) {

            console.error("💥 ERRO AO SALVAR MATERIAL:", err);
            $("#materialAvisoCadastro").text(err.responseJSON?.erro || "Não foi possível salvar o material. Tente novamente.");

        } finally {

            // 🔓 libera botão
            $btn.data("loading", false);
        }

    });

}
