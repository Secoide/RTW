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


export function initAbrirInfoColabClick() {
    $(document).on("click", "#bt_perfilhome", function () {
        const idUsuario = sessionStorage.getItem("id_usuario");
        if (idUsuario) {

            get_carregarPerfilUsuario(idUsuario);
        } else {
            console.warn("⚠️ Nenhum usuário logado na sessão.");
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


    $(document).ready(function () {
        const $html = $('html');
        const $btn = $('#toggle-theme');
        const $icon = $btn.find('i');

        // Verifica tema salvo ou preferência do sistema
        let tema = localStorage.getItem('tema');
        if (!tema) {
            tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Define o tema inicial no <html>
        $html.attr('data-theme', tema);
        $icon.attr('class', tema === 'dark' ? 'fas fa-moon' : 'fas fa-sun');

        // Alterna ao clicar
        $btn.on('click', function () {
            const temaAtual = $html.attr('data-theme');
            const novoTema = temaAtual === 'dark' ? 'light' : 'dark';

            // Atualiza atributo e salva
            $html.attr('data-theme', novoTema);
            localStorage.setItem('tema', novoTema);

            // Animação e troca de ícone
            $icon.addClass('rotate');
            setTimeout(() => $icon.removeClass('rotate'), 400);
            $icon.attr('class', novoTema === 'dark' ? 'fas fa-moon' : 'fas fa-sun');
        });
    });

}

// ABRIR Form Colaborador com os dados do colaborador clicado
export async function get_carregarPerfilUsuario(funcId) {
    try {

        initColabForm();

        if (!funcId) {
            alert('ID do colaborador não encontrado!');
            throw new Error("ID não encontrado");
        }

        // 🔹 1 - Buscar dados do colaborador
        const response = await fetch(`/api/colaboradores/${funcId}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar colaborador");
        }

        const dados = await response.json();

        if (!dados || !dados.id) {
            alert("Colaborador não encontrado.");
            throw new Error("Colaborador não encontrado");
        }

        // 🔹 2 - Carregar HTML do formulário como Promise
        await carregarFormulario();

        // 🔹 3 - Preencher combobox setor
        const $wrap = $('#formColaboradorProfissional');
        await preencherCbxSetor($wrap);


        // 🔹 4 - Ajustar painéis
        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_estatistica, .painel_ferramentas, .painel_senha').hide();
        $('.painel_perfil').show();

        
        $('#btn_upload').addClass('hidden-inicial');
        $('#bt_cadColaborador').addClass('hidden-inicial');
        $('#bt_editColab').removeClass('hidden-inicial');;
        $('.bt_menu[data-target=".painel_atestar"]').show();

        // 🔹 5 - Resumo perfil
        const statusPerfil = dados.motivo?.toLowerCase() || "ativo";

        $('#nomeCompletoResumo').text(dados.nome);
        $('#cargoResumo').text(dados.nomeCargo);

        $('.painel_resumoColab .painel_foto .statusIcon')
            .removeClass()
            .addClass(`statusIcon ${statusPerfil}`);

        $('.painel_resumoColab .painel_foto')
            .removeClass('ativo inativo afastado')
            .addClass(statusPerfil);

        // 🔹 6 - Foto
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

        // 🔹 7 - Preencher campos
        preencherCamposBasicos(dados);

        // 🔹 8 - CNH
        preencherCNH(dados.cnh);

        // 🔹 9 - Profissional
        $('#empresacontrato').val(dados.empresaContrato);
        $('#idColaboradorPro').val(dados.id);
        $('#selectSetor').val(dados.setor).trigger('change');
        
        await preencherCbxCargo(dados.setor, $wrap)    
        setTimeout(() => {
            $('#selectCargo').val(dados.cargo);
        }, 100);

        initMaleta();
        preencherTabelaAtestar(dados.id);

        return dados;

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
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
                    reject(new Error("Erro ao carregar formulário"));
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
    $('#datainicio').val(formatDateToInput(dados.datainicio));
    $('#datafinal').val(formatDateToInput(dados.datafinal));
    $('#motivo').val(dados.motivo);

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
        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_estatistica, .painel_ferramentas, .painel_senha').hide();
        
        $('.painel_perfil').show();
        $('[data-target]').hide();     // esconde todos
        $('[data-target=".painel_perfil"]').show();  // mostra só o perfil
        
        
        $('#btn_upload').addClass('hidden-inicial');
        $('#bt_editColab').addClass('hidden-inicial');
        $('#bt_cadColaborador').removeClass('hidden-inicial');
    });
}