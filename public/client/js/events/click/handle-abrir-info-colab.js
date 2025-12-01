import { formatDateToInput } from "../../utils/formatters/date-format.js";
import { preencherTabelaAtestar } from "../../utils/dom/preencher-tabela-atestar.js";
import { formatarCPF } from "../../utils/formatters/strings-format.js";
import { initColabForm } from "../forms/handle-colaborador-submit.js";
import { open_form_AnexarCurso } from "../forms/anexarCurso.js";
import { open_form_AnexarExame } from "../forms/anexarExame.js";

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
export function get_carregarPerfilUsuario(funcId) {
    return new Promise((resolve, reject) => {
        initColabForm();
        const id = funcId;

        if (!id) {
            alert('ID do colaborador não encontrado!');
            return reject("ID não encontrado");
        }

        $.ajax({
            url: `/api/colaboradores/${id}`,
            type: 'GET',
            contentType: 'application/json',

            success: function (res) {
                const dados = res;

                if (!dados || !dados.id) {
                    alert("Colaborador não encontrado.");
                    return reject("Colaborador não encontrado");
                }

                $('#form_cadColab').empty().load('../html/forms/cadastrocolaborador.html', function (response, status, xhr) {

                    if (status === "success") {

                        // 🔥 IMPORTANTE:
                        // Só chamaremos resolve() DEPOIS que TUDO estiver carregado.

                        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_estatistica, .painel_apoio, .painel_senha').hide();
                        $('.painel_perfil').show();
                        $('#bt_editColab').show();
                        $('#bt_cadColaborador').hide();
                        $('.bt_menu[data-target=".painel_atestar"]').show();

                        const statusPerfil = dados.motivo?.toLowerCase() || "ativo";
                        $('#nomeCompletoResumo').text(dados.nome);
                        $('#cargoResumo').text(dados.nomeCargo);
                        $('.painel_resumoColab .painel_foto .statusIcon').addClass(statusPerfil);
                        $('.painel_resumoColab .painel_foto').addClass(statusPerfil);

                        const fotoURL = dados.fotoperfil;

                        if (fotoURL && fotoURL.startsWith("http")) {
                            $('#fotoavatar').attr('src', fotoURL + '?t=' + Date.now());
                        } else {
                            $('#fotoavatar').attr('src', '/imagens/fotoperfil/user-default.jpg');
                        }

                        $('#fotoavatar').on('error', function () {
                            console.warn("⚠️ Foto do perfil não encontrada. Carregando padrão.");
                            $(this).attr('src', '/imagens/fotoperfil/user-default.jpg');
                        });

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

                        let arr = [];
                        if (Array.isArray(dados.cnh)) {
                            arr = dados.cnh;
                        } else if (typeof dados.cnh === 'string') {
                            arr = dados.cnh.split(/[,\s;]+/).filter(Boolean);
                        }
                        const validos = new Set(['A', 'B', 'C', 'D']);
                        arr = arr.filter(v => validos.has(v.toUpperCase())).map(v => v.toUpperCase());
                        $("input[name='vehicle']").prop("checked", false);
                        arr.forEach(v => {
                            $("input[name='vehicle'][value='" + v + "']").prop("checked", true);
                        });
                        $("#vehicles_selected").val(arr.join(','));

                        $('#empresacontrato').val(dados.empresaContrato);
                        $('#idColaboradorPro').val(dados.id);
                        $('#categoria').val(dados.setor).trigger('change');

                        setTimeout(() => { $('#cargo').val(dados.cargo); }, 100);

                        preencherTabelaAtestar(dados.id);

                        // 🔥 Tudo terminou, liberamos o resolve()
                        resolve(dados);

                    } else {
                        alert("Erro ao carregar formulário.");
                        reject("Erro ao carregar formulário");
                    }
                });
            },

            error: function (err) {
                alert('Erro ao logar. Tente novamente.');
                reject(err);
            }
        });
    });
}


export function open_form_cad_colaborador() {
    $('#form_cadColab').empty().load('../html/forms/cadastrocolaborador.html', function () {
        $('.painel_perfil, .painel_profissional, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_estatistica, .painel_apoio, .painel_senha').hide();

        $('.painel_perfil').show();
        $('[data-target]').hide();     // esconde todos
        $('[data-target=".painel_perfil"]').show();  // mostra só o perfil

    });
}