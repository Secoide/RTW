import { formatDateToInput } from "../../utils/formatters/date-format.js";
import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";
import { formatarCPF } from "../../utils/formatters/strings-format.js";
import { initColabForm } from "../forms/handle-colaborador-submit.js";
import { open_form_AnexarCurso } from "../forms/anexarCurso.js";
import { open_form_AnexarExame } from "../forms/anexarExame.js";
import { initMaleta } from "../../services/ui/maleta.js";
import {
    preencherCbxSetor,
    preencherCbxCargo
} from "../forms/populate-combobox.js";
import { carregarConquistasColaborador, initaddConquistas} from "./handle-conquistas.js"

function erroDeSessaoExpirada(error) {
    return error?.status === 401 || /401|sessao|session|nao autorizado|nÃ£o autorizado/i.test(error?.message || "");
}

export function initAbrirInfoColabClick() {
    initaddConquistas();
    $(document).on("click", "#bt_perfilhome", function () {
        const idUsuario = sessionStorage.getItem("id_usuario");
        if (idUsuario) {

            get_carregarPerfilUsuario(idUsuario);
        } else {
            console.warn("âš ï¸ Nenhum usuÃ¡rio logado na sessÃ£o.");
        }
    });
    $(document).on("click", ".bt_form_cad_colab", function () {
        open_form_cad_colaborador();
    });
    $(document).on("input", ".input_cpf", function () {
        this.value = formatarCPF(this.value);
    });

    $(document).on('click', '#bt_anexarExame_noPerfil', function () {
        const idFunc = $('#idColaborador').val();
        open_form_AnexarExame(idFunc);
    });
    $(document).on('click', '#bt_anexarCurso_noPerfil', function () {
        const idFunc = $('#idColaborador').val();
        open_form_AnexarCurso(idFunc);
    });

    $(document).on("change", "#selectSetor", async function () {
        const $wrap = $('#formColaboradorProfissional');
        const idSetor = $(this).val();
        if (!idSetor) {
            return;
        }
        await preencherCbxCargo(idSetor, $wrap);
    });

}

// ABRIR Form Colaborador com os dados do colaborador clicado
export async function get_carregarPerfilUsuario(funcId) {
    try {

        initColabForm();

        if (!funcId) {
            alert('ID do colaborador nÃ£o encontrado!');
            throw new Error("ID nÃ£o encontrado");
        }

        // ðŸ”¹ 1 - Buscar dados do colaborador
        const response = typeof window.apiFetch === "function"
            ? await window.apiFetch(`/api/colaboradores/${funcId}`)
            : await fetch(`/api/colaboradores/${funcId}`, { credentials: "include" });

        if (response.status === 401 || (response.redirected && response.url.includes("/login"))) {
            if (typeof window.tratarErro401 === "function") {
                await window.tratarErro401();
            }
            const erro = new Error("Sessao expirada");
            erro.status = 401;
            throw erro;
        }

        if (!response.ok) {
            throw new Error("Erro ao buscar colaborador");
        }

        const dados = await response.json();

        if (!dados || !dados.id) {
            alert("Colaborador nÃ£o encontrado.");
            throw new Error("Colaborador nÃ£o encontrado");
        }

        // ðŸ”¹ 2 - Carregar HTML do formulÃ¡rio como Promise
        await carregarFormulario();

        // ðŸ”¹ 3 - Preencher combobox setor
        const $wrap = $('#formColaboradorProfissional');
        await preencherCbxSetor($wrap);


        // ðŸ”¹ 4 - Ajustar painÃ©is
        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra,.painel_conquistas, .painel_atestar, .painel_nivel, .painel_estatistica, .painel_ferramentas, .painel_senha').hide();
        $('.painel_perfil').show();


        $('#btn_upload').removeClass('hidden-inicial');
        $('#bt_cadColaborador').addClass('hidden-inicial');
        $('#bt_editColab').removeClass('hidden-inicial');;
        $('.bt_menu[data-target=".painel_atestar"]').show();

        // ðŸ”¹ 5 - Resumo perfil
        const statusPerfil = dados.motivo?.toLowerCase() || "ativo";

        $('#nomeCompletoResumo').text(dados.nome);
        $('#cargoResumo').text(dados.nomeCargo);

        $('.painel_resumoColab .painel_foto .statusIcon')
            .removeClass()
            .addClass(`statusIcon ${statusPerfil}`);

        $('.painel_resumoColab .painel_foto')
            .removeClass('ativo inativo afastado')
            .addClass(statusPerfil);

        // ðŸ”¹ 6 - Foto
        const fotoURL = dados.fotoperfil
            ? `${dados.fotoperfil}?v=${dados.versao_foto}`
            : null;

        $('#fotoavatar')
            .attr('src', fotoURL?.startsWith('http')
                ? fotoURL
                : '/imagens/user-default.webp')
            .on('error', function () {
                $(this).attr('src', '/imagens/user-default.webp');
            });

        // ðŸ”¹ 7 - Preencher campos
        preencherCamposBasicos(dados);

        // ðŸ”¹ 8 - CNH
        preencherCNH(dados.cnh);

        // ðŸ”¹ 9 - Profissional
        $('#empresacontrato').val(dados.empresaContrato);
        $('#idColaboradorPro').val(dados.id);
        $('#selectSetor').val(dados.setor).trigger('change');

        await preencherCbxCargo(dados.setor, $wrap)
        setTimeout(() => {
            $('#selectCargo').val(dados.cargo);
        }, 100);

        initMaleta();
        preencherTabelaAtestar(dados.id);
        await carregarConquistasColaborador(
            dados.id
        );
        return dados;

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        if (erroDeSessaoExpirada(error)) return null;

        alert("Erro ao carregar perfil do colaborador.");
        throw error;
    }
}

function carregarFormulario() {
    return new Promise((resolve, reject) => {

        $('#form_cadColab')
            .empty()
            .load('../html/forms/cadastrocolaborador.html', function (response, status) {

                if (status === "success") {
                    resolve();
                } else {
                    reject(new Error("Erro ao carregar formulÃ¡rio"));
                }

            });

    });
}


function preencherCamposBasicos(dados) {

    $('#id').val(dados.id);
    $('#idColaborador').val(dados.id);
    $('#nome').val(dados.nome);
    $('#sexo').val(dados.sexo);
    $('#nascimento').val(formatDateToInput(dados.nascimento));
    $('#endereco').val(dados.endereco);
    $('#telefone').val(dados.telefone);
    $('#mail').val(dados.mail);
    $('#sobremim').val(dados.sobre || "");
    $('#cpf').val(dados.cpf);
    $('#rg').val(dados.rg);
    $('#dataExperiencia').val(formatDateToInput(dados.data_experiencia));
    $('#datainicio').val(formatDateToInput(dados.datainicio));
    $('#datafinal').val(formatDateToInput(dados.datafinal));
    $('#motivo').val(dados.motivo);
    preencherGestorObras(dados);

}

function preencherGestorObras(dados) {
    const pendente = dados.gestor_obras_pendente !== null
        && dados.gestor_obras_pendente !== undefined;
    const valorVisivel = pendente
        ? Number(dados.gestor_obras_pendente || 0)
        : Number(dados.responsavelOSs || 0);

    $('#gestorObras').prop('checked', valorVisivel === 1);
    $('#gestorObrasStatus')
        .text(pendente
            ? 'Aguardando aprovação da Engenharia.'
            : 'Alteração exige aprovação da Engenharia.')
        .toggleClass('pendente', pendente);
}


function preencherCNH(cnh) {

    let arr = [];

    if (Array.isArray(cnh)) {
        arr = cnh;
    } else if (typeof cnh === 'string') {
        arr = cnh.split(/[,\s;]+/).filter(Boolean);
    }

    const validos = new Set(['A', 'B', 'C', 'D']);

    arr = arr
        .map(v => v.toUpperCase())
        .filter(v => validos.has(v));

    $("input[name='vehicle']").prop("checked", false);

    arr.forEach(v => {
        $(`input[name='vehicle'][value='${v}']`)
            .prop("checked", true);
    });

    $("#vehicles_selected").val(arr.join(','));
}



export function open_form_cad_colaborador() {
    $('#form_cadColab').empty().load('../html/forms/cadastrocolaborador.html', function () {
        initColabForm();
        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar,.painel_conquistas, .painel_nivel, .painel_estatistica, .painel_ferramentas, .painel_senha').hide();

        $('.painel_perfil').show();
        $('[data-target]').hide();     // esconde todos
        $('[data-target=".painel_perfil"]').show();  // mostra sÃ³ o perfil


        $('#btn_upload').addClass('hidden-inicial');
        $('#bt_editColab').addClass('hidden-inicial');
        $('#bt_cadColaborador').removeClass('hidden-inicial');
    });
}

