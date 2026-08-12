export function initGuia() {

    carregarGuia(
        'introducao'
    );

    $('.submenuGuia')
        .removeClass(
            'aberto'
        );

    $(document).off(
        'click',
        '.itemGuia'
    );

    $(document).on(
        'click',
        '.itemGuia',
        async function () {

            const guia =
                $(this)
                    .data(
                        'guia'
                    );

            const jaAberto =
                $(this)
                    .hasClass(
                        'ativo'
                    )
                &&
                $(
                    `.submenuGuia[data-menu="${guia}"]`
                )
                    .hasClass(
                        'aberto'
                    );

            if (
                jaAberto
            ) {

                $(this)
                    .removeClass(
                        'ativo'
                    );

                $(
                    `.submenuGuia[data-menu="${guia}"]`
                )
                    .removeClass(
                        'aberto'
                    );

                return;

            }

            $('.itemGuia')
                .removeClass(
                    'ativo'
                );
            $(this)
                .addClass(
                    'ativo'
                );

            $('.itemSubGuia')
                .removeClass(
                    'ativo'
                );

            $('.submenuGuia')
                .removeClass(
                    'aberto'
                );

            $(
                `.submenuGuia[data-menu="${guia}"]`
            )
                .addClass(
                    'aberto'
                );

            await carregarGuia(
                guia
            );

            $('#conteudoGuia')
                .scrollTop(
                    0
                );

        }
    );

    $(document).off(
        'click',
        '.itemSubGuia'
    );

    $(document).on(
        'click',
        '.itemSubGuia',
        function () {

            $('.itemSubGuia')
                .removeClass(
                    'ativo'
                );

            $(this)
                .addClass(
                    'ativo'
                );

            const anchor =
                $(this)
                    .data(
                        'anchor'
                    );

            const destino =
                document.getElementById(
                    anchor
                );

            if (
                !destino
            ) {

                console.warn(
                    'Anchor não encontrado:',
                    anchor
                );

                return;

            }

            destino.scrollIntoView({

                behavior: 'smooth',

                block: 'start'

            });

        }
    );

}

function carregarGuia(
    secao
) {

    const html = {

        introducao: getIntroducao(),

        programacao: getProgramacao(),

        'ordem-servico': getOrdemServicoOS(),

        ferias: getFerias(),

        colaboradores: getColaboradores(),

        rh: getRH(),

        //cursos: getCursos(),

        //integracoes: getIntegracoes(),

        // maletas: getMaletas(),

        conquistas: getConquistas(),

        ia: getIA(),

        ferramentas: getFerramentas(),

        gestao: getGestao(),

        materiais: getMateriais(),

        'chat-online': getChatOnline(),

        faq: getFAQ()

    };

    $('#conteudoGuia')
        .html(
            html[secao]
        );

}


function getIntroducao() {

    return `

<div id="introducao-principal"
     class="guiaTitulo">

    📖 Guia Geral ConnectPear

</div>

<div class="guiaCard">

    <h4>Bem-vindo ao Sistema ConnectPear</h4>

    <p>

        Este guia foi desenvolvido para auxiliar usuários,
        gestores e administradores na utilização das funcionalidades
        disponíveis na plataforma.

    </p>

    <p>

        Aqui você encontrará explicações detalhadas sobre os módulos,
        recursos, boas práticas e procedimentos recomendados para o uso
        do sistema.

    </p>

</div>

<div class="guiaCard guiaInfo">

    💡 <b>Dica:</b><br>

    Utilize o menu lateral para navegar rapidamente entre os módulos e
    acessar os tópicos desejados.

</div>

<div class="guiaSubtitulo">

    📚 Como utilizar este guia

</div>

<div class="guiaCard">

    <ul>

        <li>Selecione um módulo no menu lateral.</li>

        <li>Utilize os submenus para navegar pelos tópicos.</li>

        <li>Clique em qualquer item do submenu para ir diretamente à seção desejada.</li>

        <li>Consulte as boas práticas ao final de cada módulo.</li>

        <li>Utilize a IA Operacional para tirar dúvidas rápidas sobre o sistema.</li>

    </ul>

</div>


<div class="guiaCard guiaInfo">

    📖 Este guia é atualizado constantemente conforme novas funcionalidades
    são adicionadas ao sistema ConnectPear.

</div>

`;

}

function getMateriais() {

    return `

<div id="materiais-topo" class="guiaTitulo">
📦 Controle de Fluxo e Materiais
</div>

<div id="mat-visao-geral" class="guiaSubtitulo">
📋 Vis&atilde;o Geral
</div>

<div class="guiaCard">
<p>
A &aacute;rea de materiais foi dividida em tr&ecirc;s rotinas principais:
<b>Controle de Fluxo</b>, <b>Estoque</b> e <b>Materiais</b>.
</p>

<ul>
<li><b>Controle de Fluxo:</b> acompanha listas de materiais por OS, est&aacute;gios, separa&ccedil;&atilde;o, compras, fornecedores, cota&ccedil;&otilde;es e custos.</li>
<li><b>Estoque:</b> recebe listas liberadas para separa&ccedil;&atilde;o e tamb&eacute;m listas finalizadas que precisam de confer&ecirc;ncia.</li>
<li><b>Materiais:</b> concentra o cadastro geral dos materiais, fotos, categorias, varia&ccedil;&otilde;es, valores de or&ccedil;amento e m&eacute;dia de fornecedores.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
💡 <b>Dica:</b><br>
Selecione a OS correta antes de criar listas, adicionar materiais, cotar fornecedores ou exportar relat&oacute;rios.
Tudo que aparece na lista pertence &agrave; OS selecionada e &agrave; lista atual.
</div>

<div id="mat-os" class="guiaSubtitulo">
🧾 Sele&ccedil;&atilde;o da OS e Exporta&ccedil;&otilde;es
</div>

<div class="guiaCard">
<ul>
<li>Use o campo <b>Selecione uma OS</b> para carregar o fluxo e as listas de materiais daquela ordem de servi&ccedil;o.</li>
<li>O bot&atilde;o <b>Atualizar</b> recarrega os dados da OS selecionada.</li>
<li>O bot&atilde;o <b>Exportar</b> gera uma planilha da tabela atual.</li>
<li>O bot&atilde;o <b>PDF</b> abre um submenu com duas op&ccedil;&otilde;es: <b>Dados completo</b> e <b>Somente lista cliente</b>.</li>
<li><b>Dados completo:</b> exporta OS, lista, resumo financeiro, foto, material, categoria, quantidade, observa&ccedil;&atilde;o, fornecedor, pre&ccedil;o, total e OC.</li>
<li><b>Somente lista cliente:</b> exporta uma vers&atilde;o limpa com foto, descri&ccedil;&atilde;o, c&oacute;digo, fabricante, observa&ccedil;&atilde;o, quantidade e unidade.</li>
</ul>
</div>

<div id="mat-fluxo-listas" class="guiaSubtitulo">
🧭 Fluxo das Listas
</div>

<div class="guiaCard">
<p>
O Controle de Fluxo organiza cada lista em est&aacute;gios, permitindo que cada setor avance a lista somente quando sua parte estiver conclu&iacute;da.
</p>

<ul>
<li><b>Or&ccedil;amento:</b> in&iacute;cio da lista quando a necessidade nasce pelo or&ccedil;amento.</li>
<li><b>Engenharia:</b> revis&atilde;o t&eacute;cnica, confer&ecirc;ncia e ajuste dos itens.</li>
<li><b>Estoque:</b> separa&ccedil;&atilde;o dos materiais dispon&iacute;veis internamente.</li>
<li><b>Compras:</b> cota&ccedil;&atilde;o, escolha de fornecedor, OC e registro de compra.</li>
<li><b>Finalizado:</b> lista conclu&iacute;da, pronta para hist&oacute;rico, confer&ecirc;ncia e acompanhamento.</li>
<li>Os cards mostram OS, descri&ccedil;&atilde;o, prioridade e barra de progresso.</li>
<li>&Eacute; poss&iacute;vel avan&ccedil;ar, voltar est&aacute;gio com motivo, duplicar, editar, excluir e consultar hist&oacute;rico.</li>
</ul>
</div>

<div class="guiaCard">
<h4>Criar ou editar lista</h4>
<ul>
<li>Informe nome da lista, est&aacute;gio inicial, prioridade, respons&aacute;vel e prazo.</li>
<li>Se n&atilde;o houver prazo definido, marque <b>Sem prazo definido</b>.</li>
<li>Use descri&ccedil;&atilde;o e observa&ccedil;&atilde;o r&aacute;pida para orientar o pr&oacute;ximo setor.</li>
<li>Listas com prazo mudam de apar&ecirc;ncia conforme urg&ecirc;ncia; listas sem prazo usam indica&ccedil;&atilde;o neutra.</li>
</ul>
</div>

<div id="mat-lista" class="guiaSubtitulo">
📦 Lista de Materiais da OS
</div>

<div class="guiaCard">
<p>A tabela mostra os materiais vinculados &agrave; lista atual.</p>

<ul>
<li><b>ID:</b> identifica&ccedil;&atilde;o interna do item na lista.</li>
<li><b>Categoria:</b> classifica&ccedil;&atilde;o do material.</li>
<li><b>Material:</b> nome, foto e atributos da varia&ccedil;&atilde;o.</li>
<li><b>C&oacute;digo e Fabricante:</b> dados t&eacute;cnicos cadastrados na varia&ccedil;&atilde;o.</li>
<li><b>Qtde e Und:</b> quantidade solicitada e unidade correspondente.</li>
<li><b>Observa&ccedil;&atilde;o:</b> informa&ccedil;&atilde;o complementar do material na OS.</li>
<li><b>Or&ccedil;ado:</b> valor unit&aacute;rio e total baseados no cadastro geral do material.</li>
<li><b>Separa&ccedil;&atilde;o:</b> barra visual de separado, comprado e faltante.</li>
<li><b>Fornecedor:</b> fornecedor selecionado ou bot&atilde;o para abrir cota&ccedil;&otilde;es.</li>
<li><b>Pre&ccedil;o, Total R$ e OC:</b> aparecem nas etapas de compra/finaliza&ccedil;&atilde;o, conforme o est&aacute;gio da lista.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
📌 <b>Colunas por est&aacute;gio:</b><br>
Em <b>Or&ccedil;amento</b> e <b>Engenharia</b>, a tabela foca dados t&eacute;cnicos.
No <b>Estoque</b>, aparece a separa&ccedil;&atilde;o.
Em <b>Compras</b> e <b>Finalizado</b>, aparecem fornecedor, pre&ccedil;os, total e OC.
</div>

<div class="guiaCard">
<h4>A&ccedil;&otilde;es da lista</h4>
<ul>
<li><b>Novo Material:</b> adiciona uma linha para inserir material na OS.</li>
<li><b>Editar:</b> altera quantidade e observa&ccedil;&atilde;o do item j&aacute; lan&ccedil;ado.</li>
<li><b>Separar item:</b> abre controles de diminuir, aumentar, total, salvar e cancelar.</li>
<li><b>Apagar:</b> remove o material da lista.</li>
<li>Durante a separa&ccedil;&atilde;o, os bot&otilde;es de editar e apagar ficam ocultos para evitar conflito.</li>
</ul>
</div>

<div id="mat-fornecedores" class="guiaSubtitulo">
💰 Fornecedores e Cota&ccedil;&otilde;es
</div>

<div class="guiaCard">
<p>
Na coluna <b>Fornecedor</b>, o bot&atilde;o de cota&ccedil;&atilde;o abre os fornecedores cadastrados para aquele material da OS.
</p>

<ul>
<li>Ao adicionar fornecedor, informe valor, prazo, or&ccedil;amento e observa&ccedil;&atilde;o.</li>
<li>O <b>ICMS</b> fica travado, pois vem do cadastro do fornecedor na Gest&atilde;o.</li>
<li>A <b>quantidade</b> j&aacute; vem preenchida com a quantidade total do material.</li>
<li>O checkbox <b>OK</b> j&aacute; vem marcado, podendo ser desmarcado se a cota&ccedil;&atilde;o n&atilde;o atender.</li>
<li>A coluna <b>Valor R$</b> mostra o valor unit&aacute;rio ajustado pelo ICMS.</li>
<li>A coluna <b>Total R$</b> mostra o total da cota&ccedil;&atilde;o daquele fornecedor.</li>
<li>&Eacute; poss&iacute;vel selecionar, deselecionar, editar ou excluir fornecedores da cota&ccedil;&atilde;o.</li>
<li>O menor e maior valor s&atilde;o destacados dentro da tabela de fornecedores.</li>
</ul>
</div>

<div class="guiaCard">
<h4>Bot&atilde;o Infos Fornecedor</h4>
<p>
O bot&atilde;o <b>Fornecedores</b>, acima da tabela de materiais, abre um painel de resumo da lista atual.
</p>
<ul>
<li>Mostra o <b>Total R$ geral</b> cotado por fornecedor e o <b>Valor R$ selecionado</b> nos cards.</li>
<li>Exibe quantidade total, n&uacute;mero de cota&ccedil;&otilde;es e fornecedores selecionados.</li>
<li>Mostra gr&aacute;fico de participa&ccedil;&atilde;o por fornecedor.</li>
<li>Indica maior volume cotado, ticket m&eacute;dio por cota&ccedil;&atilde;o, materiais marcados como OK e trata empate quando dois fornecedores possuem o mesmo total.</li>
<li>Ajuda Compras a enxergar concentra&ccedil;&atilde;o de valores, total selecionado e validar se falta selecionar fornecedor.</li>
</ul>
</div>

<div id="mat-status" class="guiaSubtitulo">
📊 Status, Resumo e Progresso
</div>

<div class="guiaCard">
<ul>
<li><b>Itens:</b> quantidade de linhas de materiais.</li>
<li><b>Qtd:</b> soma das quantidades solicitadas.</li>
<li><b>Fornecedores:</b> quantidade de fornecedores selecionados nos materiais.</li>
<li><b>Comprado:</b> quantidade j&aacute; comprada.</li>
<li><b>Separado:</b> quantidade j&aacute; separada.</li>
<li><b>Faltante:</b> quantidade ainda pendente.</li>
<li><b>Barra inferior:</b> mostra percentuais de separado, comprado e faltante.</li>
<li>O progresso dos cards considera materiais/itens adicionados, n&atilde;o somente soma de quantidades.</li>
</ul>
</div>

<div id="mat-filtros" class="guiaSubtitulo">
🔎 Busca e Filtros
</div>

<div class="guiaCard">
<ul>
<li>Use <b>Buscar material</b> para localizar por nome, c&oacute;digo, atributos, observa&ccedil;&atilde;o ou fabricante.</li>
<li>Use o filtro de <b>Categoria</b> para visualizar apenas uma classe de material.</li>
<li>Use filtros de status para ver <b>Todos</b>, <b>Faltante</b>, <b>Parcial</b>, <b>Separado</b> ou <b>Comprado</b>.</li>
<li>O bot&atilde;o <b>Mostrar imagens</b> exibe ou oculta fotos dos materiais na tabela.</li>
<li>No autocomplete, digitar medidas como <b>100x50</b> ajuda a encontrar materiais por largura e altura.</li>
</ul>
</div>

<div id="mat-estoque" class="guiaSubtitulo">
📦 Tela Estoque
</div>

<div class="guiaCard">
<p>
A tela Estoque mostra listas liberadas para separa&ccedil;&atilde;o e listas finalizadas que podem precisar de confer&ecirc;ncia.
</p>
<ul>
<li><b>Listas pendentes:</b> cards compactos com OS, descri&ccedil;&atilde;o, prioridade e barra de progresso.</li>
<li><b>Busca:</b> localiza por OS, cliente, descri&ccedil;&atilde;o, material, refer&ecirc;ncia ou fabricante.</li>
<li><b>Lista completa:</b> ao selecionar um card, os materiais aparecem na tabela.</li>
<li><b>Separar:</b> registra a quantidade separada usando menos, mais, total, salvar e cancelar.</li>
<li><b>Enviar para compras:</b> confirma a etapa do estoque e avan&ccedil;a para Compras.</li>
<li><b>PDF do Estoque:</b> exporta categoria, foto, descri&ccedil;&atilde;o, refer&ecirc;ncia, fabricante, observa&ccedil;&atilde;o, quantidade, unidade e campos para preenchimento manual.</li>
<li>Materiais comprados s&atilde;o abatidos da necessidade do Estoque; materiais apenas separados continuam vis&iacute;veis quando necess&aacute;rio.</li>
</ul>
</div>

<div class="guiaCard">
<h4>Modo confer&ecirc;ncia</h4>
<ul>
<li>Listas finalizadas podem aparecer para confer&ecirc;ncia no Estoque.</li>
<li>O bot&atilde;o de confer&ecirc;ncia abre uma janela item por item, com foto maior, descri&ccedil;&atilde;o, quantidade e unidade.</li>
<li>Use <b>OK</b>, <b>Faltando</b> ou <b>N&atilde;o encontrado</b> para registrar a confer&ecirc;ncia.</li>
<li>A barra fixa mostra o avan&ccedil;o da confer&ecirc;ncia at&eacute; concluir todos os itens.</li>
</ul>
</div>

<div id="mat-catalogo" class="guiaSubtitulo">
🧰 Tela Materiais
</div>

<div class="guiaCard">
<p>
A tela <b>Materiais</b> &eacute; o cadastro geral usado por Or&ccedil;amento e Compras como base de consulta e atualiza&ccedil;&atilde;o de pre&ccedil;os.
</p>
<ul>
<li>A tabela carrega at&eacute; 50 materiais por p&aacute;gina e possui pagina&ccedil;&atilde;o.</li>
<li>A busca carrega materiais conforme o usu&aacute;rio digita.</li>
<li>As colunas mostram ID, categoria, foto, descri&ccedil;&atilde;o, c&oacute;digo, fabricante, unidade, valor de or&ccedil;amento atual e m&eacute;dia dos &uacute;ltimos fornecedores.</li>
<li>O bot&atilde;o <b>Cadastrar Material</b> abre o cadastro para criar novo material.</li>
<li>O bot&atilde;o de abrir no cadastro permite editar ou aproveitar dados de um material existente.</li>
<li>&Eacute; poss&iacute;vel apagar material quando permitido pelo sistema.</li>
</ul>
</div>

<div id="mat-cadastro" class="guiaSubtitulo">
➕ Cadastro de Material
</div>

<div class="guiaCard">
<ul>
<li>Informe nome, categoria, unidade, c&oacute;digo, fabricante e atributos t&eacute;cnicos.</li>
<li>O modo <b>Editar</b> aparece direto quando o cadastro &eacute; aberto pela tabela de materiais.</li>
<li>A imagem s&oacute; &eacute; carregada depois que o material existe, pois depende do ID.</li>
<li>&Eacute; poss&iacute;vel selecionar uma imagem j&aacute; cadastrada em outro material, usando busca e pagina&ccedil;&atilde;o de imagens.</li>
<li>Varia&ccedil;&otilde;es existentes ficam vis&iacute;veis para consulta e ajudam a evitar duplicidade.</li>
<li>O valor de or&ccedil;amento atual serve como base para custos previstos nas listas.</li>
</ul>
</div>

<div id="mat-imagens" class="guiaSubtitulo">
🖼️ Imagens dos Materiais
</div>

<div class="guiaCard">
<ul>
<li>Use imagens para facilitar a identifica&ccedil;&atilde;o visual do item.</li>
<li>Ao editar imagem de um material, a tabela deve atualizar a foto mais recente.</li>
<li>Quando n&atilde;o houver imagem cadastrada, o sistema usa imagem padr&atilde;o.</li>
<li>Reaproveitar imagens evita uploads repetidos para itens parecidos, como cabos de cores ou bitolas diferentes.</li>
</ul>
</div>

<div id="mat-boas-praticas" class="guiaSubtitulo">
🚀 Boas Pr&aacute;ticas
</div>

<div class="guiaCard">
<ul>
<li>Crie uma lista por conjunto de materiais ou etapa relevante da OS.</li>
<li>Use categorias e observa&ccedil;&otilde;es para facilitar busca, estoque e compra.</li>
<li>Preencha c&oacute;digo, fabricante e unidade sempre que poss&iacute;vel.</li>
<li>Atualize o valor de or&ccedil;amento no cadastro geral para manter o custo previsto confi&aacute;vel.</li>
<li>Registre cota&ccedil;&otilde;es com valor, prazo, observa&ccedil;&atilde;o e fornecedor correto.</li>
<li>Selecione o fornecedor escolhido antes de lan&ccedil;ar OC ou finalizar compra.</li>
<li>Use o painel de fornecedores para conferir concentra&ccedil;&atilde;o de compras e totais por fornecedor.</li>
<li>Exporte PDF completo para confer&ecirc;ncia interna e PDF cliente para compartilhamento simplificado.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
📦 <b>Resumo:</b><br>
O Controle de Fluxo acompanha a jornada dos materiais da OS; Estoque separa e confere; Materiais mant&eacute;m o cadastro t&eacute;cnico e financeiro que alimenta todo o processo.
</div>

`;

};

function getColaboradores() {

    return `

<div id="colaboradores-topo" class="guiaTitulo">

👤 Cadastro e Perfil de Colaboradores

</div>

<div class="guiaCard">

<h4>O que é o Cadastro de Colaboradores?</h4>

<p>

O Cadastro de Colaboradores é o módulo responsável por armazenar todas as informações individuais dos profissionais da empresa.

</p>

<p>

Nele é possível cadastrar, editar, consultar e acompanhar toda a trajetória do colaborador dentro da empresa, incluindo documentos, exames, cursos, integrações, EPIs, conquistas, histórico profissional e muito mais.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Quanto mais completo estiver o cadastro do colaborador, mais precisas serão as análises da IA Operacional, Programação, RH e Hall da Experiência.

</div>

<div id="colab-dados-pessoais" class="guiaSubtitulo">
👤 Dados Pessoais
</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📋</div>

<div>

<div class="guiaMedalhaTitulo">

Informações Básicas

</div>

<div class="guiaMedalhaDescricao">

Cadastro das informações pessoais do colaborador utilizadas em todo o sistema.

</div>

</div>

</div>

<div class="guiaCard">

<ul>

<li>Nome completo</li>

<li>Foto de perfil</li>

<li>Sexo</li>

<li>Data de nascimento</li>

<li>Telefone</li>

<li>E-mail</li>

<li>Endereço</li>

<li>Sobre mim</li>

<li>CPF</li>

<li>RG</li>

</ul>

</div>

<div id="colab-foto-perfil" class="guiaSubtitulo">
📸 Foto de Perfil
</div>

<div class="guiaCard">

<p>

Cada colaborador pode possuir uma foto personalizada utilizada em diversos módulos do sistema.

</p>

<ul>

<li>RH</li>

<li>Programação</li>

<li>Hall da Experiência</li>

<li>Central IA</li>

<li>Perfil do Usuário</li>

</ul>

</div>

<div class="guiaCard">

<p>

O sistema possui ferramentas automáticas de:

</p>

<ul>

<li>Corte da imagem</li>

<li>Rotação</li>

<li>Compressão</li>

<li>Conversão para WebP</li>

</ul>

</div>


<div id="colab-dados-profissionais" class="guiaSubtitulo">
💼 Dados Profissionais
</div>

<div class="guiaCard">

<p>

Área destinada às informações profissionais e organizacionais do colaborador.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Empresa contratante</li>

<li>Setor</li>

<li>Cargo</li>

<li>Categoria CNH</li>

<li>Data de admiss&atilde;o usada nos c&aacute;lculos de f&eacute;rias, programa&ccedil;&atilde;o e experi&ecirc;ncia</li>

<li>Op&ccedil;&atilde;o <b>Gestor de Obras</b>, usada para liberar o colaborador como respons&aacute;vel de OS ap&oacute;s aprova&ccedil;&atilde;o da Engenharia</li>

<li>Histórico profissional</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

&#128274; <b>Aprova&ccedil;&atilde;o de Gestor de Obras:</b><br>
Ao marcar ou desmarcar <b>Gestor de Obras</b>, o sistema n&atilde;o altera o respons&aacute;vel da OS imediatamente.
Uma solicita&ccedil;&atilde;o &eacute; enviada para o <b>Gerente de Engenharia</b> pelo sininho de notifica&ccedil;&otilde;es.
Somente ap&oacute;s aprova&ccedil;&atilde;o o colaborador passa a aparecer, ou deixa de aparecer, no campo de respons&aacute;vel ao cadastrar uma OS.
Na notifica&ccedil;&atilde;o tamb&eacute;m aparece o nome do usu&aacute;rio que solicitou a altera&ccedil;&atilde;o.

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🚗</div>

<div>

<div class="guiaMedalhaTitulo">

Categorias CNH

</div>

<div class="guiaMedalhaDescricao">

O sistema permite registrar categorias A, B, C e D, sendo utilizadas em Programação, IA Operacional e Hall da Experiência.

</div>

</div>

</div>

<div id="colab-epis" class="guiaSubtitulo">
🦺 Vestimentas e EPIs
</div>

<div class="guiaCard">

<p>

Controle completo dos Equipamentos de Proteção Individual entregues ao colaborador.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Entrega de EPIs</li>

<li>Histórico de entregas</li>

<li>Controle de trocas</li>

<li>Situação atual</li>

<li>Ficha de entrega</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📄 O sistema permite gerar automaticamente a ficha completa de EPIs do colaborador.

</div>

<div id="colab-exames" class="guiaSubtitulo">
🩺 Exames Ocupacionais
</div>

<div class="guiaCard">

<p>

Controle de todos os exames ocupacionais obrigatórios do colaborador.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Admissional</li>

<li>Periódico</li>

<li>Mudança de Função</li>

<li>Retorno ao Trabalho</li>

<li>Demissional</li>

</ul>

</div>

<div class="guiaCard">

<p>

Além dos exames é possível:

</p>

<ul>

<li>Agendar exames futuros</li>

<li>Anexar documentos PDF</li>

<li>Controlar vencimentos</li>

<li>Identificar exames configurados como <b>não vence</b></li>

<li>Consultar histórico completo</li>

</ul>

</div>

<div class="guiaCard">

<h4>Menu de ações dos exames</h4>

<p>

Na aba Exames do colaborador, clique com o botão direito sobre um exame para acessar as ações disponíveis.

</p>

<ul>

<li><b>Atualizar Exame:</b> registra uma nova realização para o exame selecionado.</li>

<li><b>Editar Exame:</b> abre a tabela com todos os registros anexados daquele tipo de exame.</li>

<li><b>Agendar Exame:</b> registra data e horário para um exame futuro.</li>

<li><b>Visualizar Exame:</b> abre o PDF anexado, quando existir.</li>

<li><b>Apagar Exame:</b> remove o registro selecionado do colaborador.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Edição dos registros anexados</h4>

<p>

A opção <b>Editar Exame</b> exibe uma tabela com todos os registros daquele exame para o colaborador.
Essa tela permite corrigir dados sem precisar apagar e cadastrar tudo novamente.

</p>

<ul>

<li>Editar a data realizada.</li>

<li>Editar a data de vencimento.</li>

<li>Quando o cadastro do exame estiver marcado como <b>não vence</b>, o sistema mostra essa informação e não calcula alerta de vencimento.</li>

<li>Adicionar um novo PDF ao registro.</li>

<li>Substituir o PDF já anexado.</li>

<li>Remover somente o PDF, mantendo o registro do exame.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Use <b>Atualizar Exame</b> quando houver uma nova realização.
Use <b>Editar Exame</b> quando precisar corrigir uma data ou trocar/remover o anexo de um registro existente.

</div>

<div id="colab-cursos" class="guiaSubtitulo">
🎓 Cursos e Treinamentos
</div>

<div class="guiaCard">

<p>

Gerenciamento de cursos, treinamentos e certificações obrigatórias.

</p>

</div>

<div class="guiaCard">

<ul>

<li>NR-01</li>

<li>NR-06</li>

<li>NR-10</li>

<li>NR-10 SEP</li>

<li>NR-12</li>

<li>NR-18</li>

<li>NR-33</li>

<li>NR-35</li>

<li>PTA</li>

<li>Brigadista</li>

</ul>

</div>

<div class="guiaCard">

<p>

Cada curso pode possuir:

</p>

<ul>

<li>Data de realização</li>

<li>Validade</li>

<li>Anexo PDF</li>

<li>Histórico de renovações</li>

<li>Controle para cursos que vencem ou não vencem</li>

</ul>

</div>

<div class="guiaCard">

<h4>Menu de ações dos cursos</h4>

<p>

Na aba Cursos do colaborador, clique com o botão direito sobre um curso para acessar as ações disponíveis.

</p>

<ul>

<li><b>Atualizar Curso:</b> registra uma nova realização ou renovação para o curso selecionado.</li>

<li><b>Editar Curso:</b> abre a tabela com todos os registros anexados daquele tipo de curso.</li>

<li><b>Visualizar Curso:</b> abre o PDF anexado, quando existir.</li>

<li><b>Apagar Curso:</b> remove o registro selecionado do colaborador.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Edição dos registros anexados</h4>

<p>

A opção <b>Editar Curso</b> exibe uma tabela com todos os registros daquele curso para o colaborador.
Essa tela permite corrigir dados, trocar anexos e manter o histórico de renovações organizado.

</p>

<ul>

<li>Editar a data realizada.</li>

<li>Editar o vencimento em meses.</li>

<li>Quando o cadastro do curso estiver marcado como <b>não vence</b>, o sistema mantém o histórico sem gerar alerta de vencimento.</li>

<li>Adicionar um novo PDF ao registro.</li>

<li>Substituir ou remover o PDF já anexado.</li>

<li>Excluir o registro completo do curso quando necessário.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Use <b>Atualizar Curso</b> para lançar uma nova realização.
Use <b>Editar Curso</b> para corrigir informações de um registro já existente.

</div>

<div id="colab-integracoes" class="guiaSubtitulo">
🏭 Integrações
</div>

<div class="guiaCard">

<p>

Controle das integrações exigidas pelos clientes para atuação em suas unidades.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Cadastro de integrações</li>

<li>Controle de validade</li>

<li>Histórico completo</li>

<li>Integrações vencidas</li>

<li>Integrações pendentes</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🏭 As integrações são utilizadas automaticamente pela Programação e pela IA Operacional para validação das equipes.

</div>

<div id="colab-atestados" class="guiaSubtitulo">
📅 Atestados e Licenças
</div>

<div class="guiaCard">

<p>

Controle dos afastamentos e situações especiais dos colaboradores.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Férias</li>

<li>Atestado Médico</li>

<li>Licença Maternidade</li>

<li>Licença Paternidade</li>

<li>Afastamentos</li>

<li>Questões de Saúde</li>

</ul>

</div>

<div class="guiaCard">

<p>

Cada registro pode conter:

</p>

<ul>

<li>Data inicial</li>

<li>Data final</li>

<li>Motivo</li>

<li>Observações</li>

</ul>

</div>





`;

}

function getProgramacao() {

    return `

<div id="prog-topo" class="guiaTitulo">

📅 Programação Operacional

</div>

<div class="guiaCard">

<h4>O que é a Programação?</h4>

<p>

A Programação Operacional é o centro de planejamento diário da empresa.
Nela são distribuídos colaboradores, organizadas Ordens de Serviço,
definidas prioridades e acompanhada toda a operação em tempo real.

</p>

<p>

Através desta tela é possível visualizar disponibilidade das equipes,
situação documental, integrações, exames, supervisores, prioridades e
andamento das atividades programadas.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Mantenha a programação atualizada diariamente.
Ela é utilizada como referência para gestão operacional,
alocação de equipes e indicadores de produtividade.

</div>


<div id="prog-topbar" class="guiaSubtitulo">

🔎 Topo, Busca Global e Filtros

</div>

<div class="guiaCard">

<h4>Barra superior da Programação</h4>

<p>

O topo da Programação reúne os principais comandos para localizar, filtrar e atualizar a agenda operacional.
Ele foi pensado para reduzir cliques e permitir análise rápida de todas as OS exibidas na semana.

</p>

<ul>

<li><b>Nova OS:</b> abre o cadastro de Ordem de Serviço.</li>
<li><b>Atualizar:</b> recarrega a programação da data selecionada.</li>
<li><b>Data:</b> define o dia base da visualização semanal.</li>
<li><b>Busca global:</b> pesquisa em todas as OS carregadas, considerando número da OS, descrição, cliente, cidade, colaborador e status.</li>
<li><b>Busca avançada:</b> permite filtrar separadamente por OS, cliente, cidade, colaborador e status.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Filtros rápidos globais</h4>

<p>

Os filtros do topo atuam sobre todos os painéis da programação. Quando um filtro global está ativo,
os painéis encontrados recebem destaque com sombra amarela e os demais painéis são ocultados para facilitar a leitura.

</p>

<ul>

<li><b>Prioridade:</b> mostra apenas OS marcadas como prioridade alta.</li>
<li><b>Com equipe:</b> mostra apenas OS com colaboradores alocados.</li>
<li><b>Sem equipe:</b> mostra OS ainda sem colaboradores.</li>
<li><b>Sem responsável:</b> mostra OS sem responsável definido.</li>
<li><b>Limpar filtros:</b> remove busca global, busca avançada e filtros rápidos.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Atalhos úteis:</b><br>

Dentro do campo <b>Buscar colaborador</b> de cada OS, use <b>#</b> para listar responsáveis/líderes e <b>$</b> para listar terceiros.
Exemplo: <b>#gui</b> busca responsáveis com esse nome; <b>$jo</b> busca terceiros com esse nome.

</div>

<div id="prog-gestao-colaboradores" class="guiaSubtitulo">

👷 Gestão de Colaboradores

</div>

<div class="guiaCard">

<h4>Colaboradores Disponíveis</h4>

<p>

Na parte superior de cada dia são exibidos os colaboradores disponíveis
para alocação em Ordens de Serviço.

</p>

<ul>

<li>Visualização rápida da equipe disponível.</li>

<li>Status de exames e integrações.</li>

<li>Identificação de aniversariantes.</li>

<li>Situações especiais (férias, afastamentos e licenças).</li>

</ul>

</div>

<div class="guiaCard">

<h4>Adicionar colaboradores em uma OS</h4>

<ol>

<li>Localize o colaborador desejado.</li>

<li>Clique e arraste para a Ordem de Serviço.</li>

<li>Solte dentro da OS desejada.</li>

<li>O sistema atualizará automaticamente a programação.</li>

</ol>

<p>

Também é possível adicionar colaboradores usando o campo <b>Buscar colaborador</b> dentro da própria OS.
Esse campo aceita busca normal e atalhos por tipo de colaborador.

</p>

<ul>

<li><b>Busca normal:</b> digite parte do nome para localizar colaboradores disponíveis.</li>
<li><b>#</b> lista responsáveis/líderes.</li>
<li><b>$</b> lista terceiros.</li>
<li>Use as setas do teclado para navegar nas sugestões e <b>Enter</b> ou <b>Tab</b> para selecionar.</li>
<li>A alocação é enviada em tempo real para os demais usuários conectados.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Remover colaboradores de uma OS</h4>

<ol>

<li>Localize o colaborador dentro da OS.</li>

<li>Clique no ícone de remoção.</li>

<li>Confirme a ação quando solicitado.</li>

<li>O colaborador retornará para a lista de disponíveis.</li>

</ol>

<p class="guiaMedalhaDescricao">

A remoção é sincronizada automaticamente para todos os usuários conectados.

</p>

</div>

<div id="prog-indicadores-exames" class="guiaSubtitulo">

🚦 Indicadores de Exames

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🟢</div>

<div>

<div class="guiaMedalhaTitulo">

Exames em Dia

</div>

<div class="guiaMedalhaDescricao">

Todos os exames obrigatórios encontram-se válidos.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🟠</div>

<div>

<div class="guiaMedalhaTitulo">

Exames Próximos do Vencimento

</div>

<div class="guiaMedalhaDescricao">

Um ou mais exames estão próximos do vencimento.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔵</div>

<div>

<div class="guiaMedalhaTitulo">

Exame Agendado

</div>

<div class="guiaMedalhaDescricao">

Existe exame agendado para o colaborador.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔴</div>

<div>

<div class="guiaMedalhaTitulo">

Exame Vencido

</div>

<div class="guiaMedalhaDescricao">

O colaborador possui exames vencidos que exigem atenção.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">⚪</div>

<div>

<div class="guiaMedalhaTitulo">

Exames Pendentes

</div>

<div class="guiaMedalhaDescricao">

Documentação ocupacional incompleta ou faltante.

</div>

</div>

</div>

<div id="prog-integracoes" class="guiaSubtitulo">

📜 Indicadores de Integração

</div>

<div class="guiaCard">

<p>

Além dos exames, o sistema monitora automaticamente as integrações dos colaboradores.

</p>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🟢</div>

<div>

<div class="guiaMedalhaTitulo">

Integrado

</div>

<div class="guiaMedalhaDescricao">

Integrações válidas e aptas para execução das atividades.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🟠</div>

<div>

<div class="guiaMedalhaTitulo">

Integração Próxima do Vencimento

</div>

<div class="guiaMedalhaDescricao">

Integrações que exigirão renovação em breve.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔴</div>

<div>

<div class="guiaMedalhaTitulo">

Integração Vencida

</div>

<div class="guiaMedalhaDescricao">

Pode impedir o acesso ou atuação em determinados clientes.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">⚫</div>

<div>

<div class="guiaMedalhaTitulo">

Integração Pendente

</div>

<div class="guiaMedalhaDescricao">

Ainda não existe integração cadastrada para o cliente correspondente.

</div>

</div>

</div>

<div id="prog-situacoes-especiais" class="guiaSubtitulo">

🎂 Situações Especiais

</div>

<div class="guiaCard">

🎂 <b>Aniversariante</b><br>
Colaborador aniversariante recebe destaque visual especial.

</div>

<div class="guiaCard">

🏖️ <b>Férias</b><br>
Indica colaboradores em período de férias.

</div>

<div class="guiaCard">

🏥 <b>Saúde</b><br>
Afastamentos relacionados à saúde.

</div>

<div class="guiaCard">

👨‍👧 <b>Licença Paternidade</b><br>
Colaborador afastado por licença paternidade.

</div>

<div class="guiaCard">

👩‍👧 <b>Licença Maternidade</b><br>
Colaboradora afastada por licença maternidade.

</div>

<div class="guiaCard">

🚫 <b>Falta Indevida</b><br>
Registro de ausência não justificada.

</div>

<div class="guiaCard">

⛔ <b>Afastamento</b><br>
Colaborador temporariamente indisponível.

</div>

<div id="prog-hierarquia" class="guiaSubtitulo">

⭐ Hierarquia Operacional

</div>
<div class="guiaCard">

<p>

A Programação ConnectPear utiliza uma estrutura hierárquica para organizar as equipes e facilitar a identificação das responsabilidades de cada profissional durante a execução dos serviços.

</p>

</div>
<div class="guiaCard">

👑 <b>Líder</b><br>
Responsável técnico ou operacional da equipe.

</div>

<div class="guiaCard">

👷 <b>Encarregado</b><br>
Coordena a execução das atividades em campo.

</div>

<div class="guiaCard">

⭐ <b>Supervisor da OS</b><br>
Definido diretamente na programação para coordenar uma Ordem de Serviço específica.

</div>

<div class="guiaCard">

🤝 <b>Terceiro</b><br>
Profissional externo vinculado à operação.

</div>

<div id="prog-pesquisa" class="guiaSubtitulo">

🔎 Pesquisa Inteligente

</div>

<div class="guiaCard">

<p>

O campo de pesquisa permite localizar rapidamente:

</p>

<ul>

<li>Número da OS;</li>

<li>Descrição da OS;</li>

<li>Cliente;</li>

<li>Cidade;</li>

</ul>

<p>

Os resultados encontrados recebem destaque visual automaticamente.

</p>

</div>

<div id="prog-prioridades" class="guiaSubtitulo">

🚩 Prioridades e Filtros

</div>

<div class="guiaCard">

🚩 <b>Prioridade Alta</b><br>

Utilizada para destacar atividades críticas ou urgentes.

</div>

<div class="guiaCard">

🎯 <b>Modo Foco</b><br>

Exibe apenas Ordens de Serviço com colaboradores efetivamente alocados.

Ideal para reuniões operacionais e acompanhamento diário.

</div>

<div id="prog-acoes-rapidas" class="guiaSubtitulo">

🖱️ Ações Rápidas

</div>

<div class="guiaCard">

<h4>Botão Direito do Mouse</h4>

<p>

Ao clicar com o botão direito sobre um colaborador é possível acessar ações rápidas.

</p>

<ul>

<li>👤 Abrir Perfil</li>

<li>⭐ Tornar Supervisor</li>

<li>⭐ Remover Supervisor</li>

<li>📜 Verificar Integração</li>

<li>🚫 Registrar Falta Indevida</li>

<li>❌ Remover da OS</li>

</ul>

</div>

<div id="prog-drag-drop" class="guiaSubtitulo">

🔄 Arrastar e Soltar

</div>

<div class="guiaCard">

<p>

A programação utiliza sistema Drag & Drop para agilizar movimentações.

</p>

<ul>

<li>Movimentação rápida de colaboradores.</li>

<li>Seleção múltipla.</li>

<li>Troca entre OS do mesmo dia.</li>

<li>Atualização automática da ocupação.</li>

<li>Validação automática dos destinos.</li>

<li>Bloqueio de movimentações entre dias diferentes.</li>

</ul>

</div>

<div id="prog-recursos" class="guiaSubtitulo">

📋 Recursos Adicionais

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">📝</div>

<div>

<div class="guiaMedalhaTitulo">

Anotações por Dia

</div>

<div class="guiaMedalhaDescricao">

Permite registrar informações importantes para uma data específica da programação.
As anotações podem ser utilizadas para avisos operacionais, orientações de RH, segurança, treinamentos, transporte, saúde ou qualquer informação relevante para as equipes.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">📌</div>

<div>

<div class="guiaMedalhaTitulo">

Checklist por OS

</div>

<div class="guiaMedalhaDescricao">

Cada Ordem de Serviço pode possuir um checklist próprio para controle das atividades.
Ideal para verificar pendências, etapas executadas, liberações, materiais e validações necessárias antes da conclusão do serviço.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">📤</div>

<div>

<div class="guiaMedalhaTitulo">

Exportação de Colaboradores

</div>

<div class="guiaMedalhaDescricao">

Permite exportar rapidamente informações dos colaboradores vinculados à programação,
facilitando integrações de clientes, controle de portarias, listas de acesso e envio de documentação.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">👁️</div>

<div>

<div class="guiaMedalhaTitulo">

Mostrar / Ocultar Equipes

</div>

<div class="guiaMedalhaDescricao">

Permite expandir ou recolher a lista de colaboradores de uma Ordem de Serviço,
facilitando a navegação quando existem muitas equipes programadas no mesmo dia.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">📅</div>

<div>

<div class="guiaMedalhaTitulo">

Controle de Status Diário

</div>

<div class="guiaMedalhaDescricao">

Cada dia da programação possui um status operacional próprio.
O sistema identifica se a programação está aberta para edição, liberada para lançamento ou bloqueada para alterações.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔒</div>

<div>

<div class="guiaMedalhaTitulo">

Bloqueio Automático

</div>

<div class="guiaMedalhaDescricao">

Dias já encerrados podem ser bloqueados automaticamente pelo sistema,
impedindo alterações indevidas após o fechamento da programação.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔄</div>

<div>

<div class="guiaMedalhaTitulo">

Reativação de OS Ocultadas

</div>

<div class="guiaMedalhaDescricao">

Ordens de Serviço ocultadas podem ser reativadas quando necessário,
permitindo recuperar rapidamente atividades removidas da visualização principal.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">👥</div>

<div>

<div class="guiaMedalhaTitulo">

Contador Automático de Colaboradores

</div>

<div class="guiaMedalhaDescricao">

O sistema contabiliza automaticamente a quantidade de colaboradores alocados em cada Ordem de Serviço,
facilitando o dimensionamento das equipes e a análise rápida da distribuição operacional.

</div>

</div>

</div>
<!--
<div id="prog-boas-praticas" class="guiaSubtitulo">
🚀 Boas Práticas
</div>

<div class="guiaCard">

<ul>

<li>Mantenha a programação atualizada diariamente.</li>

<li>Defina supervisores para equipes maiores.</li>

<li>Utilize prioridade alta apenas quando necessário.</li>

<li>Use o modo foco durante reuniões operacionais.</li>

<li>Acompanhe os indicadores de exames e integrações.</li>

<li>Evite deixar colaboradores sem alocação quando houver atividades programadas.</li>

<li>Utilize a pesquisa para localizar rapidamente clientes e OS.</li>

<li>Revise as anotações e checklists diariamente.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📅 <b>Importante:</b><br>

A Programação Operacional é a principal ferramenta de planejamento do sistema.
Todas as alocações, movimentações e indicadores operacionais são refletidos automaticamente nesta tela.

</div>

`;

}


function getOrdemServicoOS() {

    return `

<div id="os-topo" class="guiaTitulo">
&#128196; Ordem de Servi&ccedil;o - OS
</div>

<div id="os-visao-geral" class="guiaSubtitulo">
&#128203; Vis&atilde;o Geral
</div>

<div class="guiaCard">
<p>
O formul&aacute;rio de <b>Ordem de Servi&ccedil;o</b> centraliza o cadastro, edi&ccedil;&atilde;o e consulta dos dados principais da OS.
Ele &eacute; usado para registrar informa&ccedil;&otilde;es do cliente, local, respons&aacute;veis, status, complementos, materiais e documentos anexados.
</p>
<ul>
<li>Ao cadastrar uma OS nova, o sistema valida se o n&uacute;mero j&aacute; existe antes de salvar.</li>
<li>Ao editar uma OS existente, os dados s&atilde;o carregados no mesmo formul&aacute;rio.</li>
<li>As abas laterais separam informa&ccedil;&otilde;es, status, complementos, materiais, anexos e estat&iacute;sticas.</li>
<li>As altera&ccedil;&otilde;es importantes devem ser salvas antes de fechar o formul&aacute;rio.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
&#128204; <b>Dica:</b><br>
Sempre confira cliente, cidade e respons&aacute;vel antes de usar a OS na Programa&ccedil;&atilde;o. Esses dados ajudam nos filtros, exporta&ccedil;&otilde;es e relat&oacute;rios.
</div>

<div id="os-informacoes" class="guiaSubtitulo">
&#128221; Informa&ccedil;&otilde;es da OS
</div>

<div class="guiaCard">
<h4>Campos principais</h4>
<ul>
<li><b>N&ordm; OS:</b> n&uacute;mero identificador da Ordem de Servi&ccedil;o.</li>
<li><b>Descri&ccedil;&atilde;o do servi&ccedil;o:</b> resumo objetivo do trabalho que ser&aacute; executado.</li>
<li><b>Cliente:</b> empresa contratante vinculada &agrave; OS.</li>
<li><b>Cidade:</b> local de execu&ccedil;&atilde;o do servi&ccedil;o.</li>
<li><b>Supervisor do cliente:</b> contato relacionado ao cliente ou &agrave; unidade.</li>
<li><b>Telefone e e-mail do supervisor:</b> informa&ccedil;&otilde;es exibidas apenas para consulta.</li>
<li><b>Valor or&ccedil;ado:</b> valor previsto ou aprovado para a OS.</li>
<li><b>Previs&atilde;o:</b> data prevista de conclus&atilde;o ou refer&ecirc;ncia do servi&ccedil;o.</li>
<li><b>Respons&aacute;vel:</b> colaborador respons&aacute;vel pela OS. Pode ser deixado em branco quando ainda n&atilde;o estiver definido.</li>
<li>A lista de respons&aacute;veis exibe apenas colaboradores liberados como <b>Gestor de Obras</b>. Essa libera&ccedil;&atilde;o depende de aprova&ccedil;&atilde;o da Engenharia pelo sininho.</li>
<li><b>Observa&ccedil;&otilde;es:</b> campo livre para informa&ccedil;&otilde;es gerais da OS.</li>
</ul>
</div>

<div class="guiaCard">
<h4>Cadastro e edi&ccedil;&atilde;o</h4>
<ul>
<li><b>Cadastrar:</b> cria uma nova OS ap&oacute;s validar campos obrigat&oacute;rios e duplicidade.</li>
<li><b>Editar:</b> atualiza os dados de uma OS j&aacute; existente.</li>
<li><b>Cancelar/Fechar:</b> fecha o formul&aacute;rio sem continuar a edi&ccedil;&atilde;o.</li>
<li>Se a OS j&aacute; estiver cadastrada, o sistema deve informar a duplicidade e impedir grava&ccedil;&atilde;o duplicada.</li>
</ul>
</div>

<div id="os-status" class="guiaSubtitulo">
&#128681; Status da OS
</div>

<div class="guiaCard">
<p>
A aba de status permite atualizar a situa&ccedil;&atilde;o operacional da OS sem alterar os demais dados cadastrais.
</p>
<ul>
<li><b>Sem respons&aacute;vel:</b> OS ainda sem lideran&ccedil;a definida.</li>
<li><b>Aguardando:</b> OS aberta, aguardando programa&ccedil;&atilde;o ou execu&ccedil;&atilde;o.</li>
<li><b>Em execu&ccedil;&atilde;o:</b> servi&ccedil;o em andamento.</li>
<li><b>Parado:</b> execu&ccedil;&atilde;o interrompida temporariamente.</li>
<li><b>Conclu&iacute;do:</b> OS finalizada.</li>
<li><b>Em espera:</b> aguardando libera&ccedil;&atilde;o, cliente, material ou outra condi&ccedil;&atilde;o.</li>
<li><b>Cancelado:</b> OS cancelada.</li>
</ul>
</div>

<div id="os-complementos" class="guiaSubtitulo">
&#129513; Complementos da OS
</div>

<div class="guiaCard">
<p>
A aba <b>Complementos</b> adiciona informa&ccedil;&otilde;es operacionais que ajudam no planejamento antes da execu&ccedil;&atilde;o.
Ela n&atilde;o substitui a Programa&ccedil;&atilde;o; ela melhora os dados da OS para consultas, filtros e integra&ccedil;&otilde;es.
</p>
<ul>
<li><b>Categoria do servi&ccedil;o:</b> separa o tipo geral, como Instala&ccedil;&atilde;o, Manuten&ccedil;&atilde;o, SPDA, Engenharia, Solar, Automa&ccedil;&atilde;o, Inc&ecirc;ndio ou Telecom.</li>
<li><b>Servi&ccedil;o:</b> lista op&ccedil;&otilde;es filtradas conforme a categoria escolhida.</li>
<li><b>Adicionar servi&ccedil;o:</b> permite registrar mais de um servi&ccedil;o na mesma OS.</li>
<li><b>Cards de servi&ccedil;o:</b> exibem os servi&ccedil;os adicionados e possuem bot&atilde;o para remover quando necess&aacute;rio.</li>
<li><b>Ter&aacute; PTA alocada:</b> marca que a OS precisa de PTA.</li>
<li><b>Ter&aacute; painel para montar/instalar:</b> indica que a OS possui necessidade de painel el&eacute;trico.</li>
<li><b>Observa&ccedil;&atilde;o complementar:</b> registra detalhes r&aacute;pidos para consulta operacional.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
&#9889; <b>Painel el&eacute;trico vinculado:</b><br>
Depois que a OS possui n&uacute;mero salvo, &eacute; poss&iacute;vel vincular pain&eacute;is cadastrados em Ferramentas. O card mostra n&uacute;mero de s&eacute;rie e atua&ccedil;&atilde;o, permitindo abrir a tela de detalhes do painel.
</div>

<div id="os-materiais" class="guiaSubtitulo">
&#128230; Materiais da OS
</div>

<div class="guiaCard">
<p>
A aba <b>Materiais</b> da OS resume as listas vinculadas &agrave; ordem de servi&ccedil;o usando dados do Controle de Fluxo.
</p>
<ul>
<li>Exibe as listas de materiais vinculadas &agrave; OS selecionada.</li>
<li>Mostra t&iacute;tulo, descri&ccedil;&atilde;o, status, quantidade de itens e progresso.</li>
<li>Indica quantidades compradas, separadas e faltantes.</li>
<li>Ao clicar em uma lista, o sistema abre a tela de Controle de Fluxo/Materiais j&aacute; direcionada para a OS e lista correspondente.</li>
<li>Quando n&atilde;o houver materiais, a aba informa que nenhuma lista foi lan&ccedil;ada para aquela OS.</li>
</ul>
</div>

<div id="os-anexos" class="guiaSubtitulo">
&#128206; Anexos da OS
</div>

<div class="guiaCard">
<p>
A aba <b>Anexos</b> permite guardar documentos PDF diretamente vinculados &agrave; OS.
</p>
<ul>
<li><b>Anexar documento:</b> informe o nome do PDF e selecione o arquivo correspondente.</li>
<li><b>Visualizar:</b> abre o PDF salvo para confer&ecirc;ncia.</li>
<li><b>Excluir:</b> remove o documento anexado quando necess&aacute;rio.</li>
<li><b>Limite:</b> arquivos PDF podem ter at&eacute; 15 MB.</li>
<li>O sistema valida a OS antes de anexar, evitando envio para OS inexistente ou n&atilde;o carregada.</li>
</ul>
</div>

<div id="os-analise" class="guiaSubtitulo">
&#128202; An&aacute;lise e Hist&oacute;rico
</div>

<div class="guiaCard">
<p>
O formul&aacute;rio da OS tamb&eacute;m pode abrir visualiza&ccedil;&otilde;es de hist&oacute;rico e gr&aacute;fico relacionados aos colaboradores que participaram da OS.
</p>
<ul>
<li>Use a an&aacute;lise para conferir participa&ccedil;&atilde;o de colaboradores na OS.</li>
<li>Quando n&atilde;o houver dados, o sistema informa que a OS n&atilde;o possui hist&oacute;rico dispon&iacute;vel.</li>
<li>Esse recurso ajuda a entender volume de m&atilde;o de obra e distribui&ccedil;&atilde;o por colaborador.</li>
</ul>
</div>

<div id="os-boas-praticas" class="guiaSubtitulo">
&#128640; Boas Pr&aacute;ticas
</div>

<div class="guiaCard">
<ul>
<li>Cadastre a OS com descri&ccedil;&atilde;o clara e objetiva.</li>
<li>Evite deixar cliente, cidade e supervisor incorretos, pois esses dados afetam relat&oacute;rios e filtros.</li>
<li>Defina respons&aacute;vel sempre que poss&iacute;vel para facilitar gest&atilde;o e exporta&ccedil;&atilde;o da Programa&ccedil;&atilde;o.</li>
<li>Use Complementos para registrar PTA, painel e servi&ccedil;os adicionais.</li>
<li>Anexe documentos importantes diretamente na OS para manter rastreabilidade.</li>
<li>Confira Materiais da OS antes de liberar execu&ccedil;&atilde;o de servi&ccedil;os dependentes de compra ou estoque.</li>
<li>Atualize o status da OS conforme a realidade operacional.</li>
</ul>
</div>

<div class="guiaCard guiaInfo">
&#128196; <b>Resumo:</b><br>
A OS &eacute; a base do fluxo operacional: alimenta Programa&ccedil;&atilde;o, Materiais, Estoque, Ferramentas, relat&oacute;rios e hist&oacute;rico. Quanto mais completo o cadastro, melhor a gest&atilde;o.
</div>

`;

}
function getFerias() {

    return `

<div id="ferias-topo" class="guiaTitulo">

🏖️ Sistema de Férias

</div>

<div class="guiaCard">

<h4>O que é o sistema de Férias?</h4>

<p>

O módulo de Férias centraliza o planejamento, visualização e controle dos períodos de férias dos colaboradores.
Ele foi criado para ajudar o usuário a enxergar rapidamente quem está de férias, quais períodos estão em avaliação,
quais já foram aprovados e qual é a situação do saldo de cada ciclo.

</p>

<p>

A tela trabalha com calendário visual, cálculo automático de ciclo aquisitivo, prazo concessivo, saldo utilizado,
dias restantes, sugestões automáticas e controle de status.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Use a tela de Férias como apoio ao RH e à Programação. Quando um colaborador está em férias, essa informação impacta
diretamente a disponibilidade operacional.

</div>

<div id="ferias-visao-geral" class="guiaSubtitulo">

📋 Visão Geral

</div>

<div class="guiaCard">

<ul>

<li>Exibe colaboradores com férias cadastradas ou sugeridas.</li>
<li>Mostra períodos diretamente em uma linha de calendário.</li>
<li>Permite cadastrar novos períodos de férias.</li>
<li>Permite aprovar, reprovar ou apagar períodos pelo menu de contexto.</li>
<li>Calcula automaticamente saldo, ciclo aquisitivo e prazo concessivo.</li>
<li>Aponta períodos vencidos ou fora do prazo esperado.</li>

</ul>

</div>

<div id="ferias-calendario" class="guiaSubtitulo">

📅 Calendário de Férias

</div>

<div class="guiaCard">

<p>

O calendário mostra os períodos de férias em barras horizontais, alinhadas aos dias do mês.
Cada barra representa um período vinculado a um colaborador.

</p>

<ul>

<li>A barra mostra a foto e o nome do colaborador.</li>
<li>A posição da barra indica a data de início e fim do período.</li>
<li>A cor/borda da barra ajuda a identificar o status.</li>
<li>Ao passar o mouse, o sistema exibe uma tooltip detalhada.</li>
<li>Períodos aprovados e sugestões possuem regras próprias de edição.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Cadastro de férias</h4>

<ol>

<li>Clique no botão para abrir o cadastro de férias.</li>
<li>Selecione o colaborador.</li>
<li>Informe a data inicial e a data final.</li>
<li>Escolha o status inicial, quando disponível.</li>
<li>Salve para registrar o período.</li>

</ol>

<p class="guiaMedalhaDescricao">

O sistema valida datas obrigatórias, ordem das datas, períodos sobrepostos e limite de dias.

</p>

</div>

<div id="ferias-ciclos" class="guiaSubtitulo">

🔁 Ciclos, Saldos e Prazo

</div>

<div class="guiaCard">

<p>

O sistema calcula os ciclos a partir da data de entrada na empresa informada em Dados Profissionais do colaborador.
Cada ciclo possui um período aquisitivo, um período concessivo e um saldo de até 30 dias.

</p>

<ul>

<li><b>Ciclo aquisitivo:</b> período em que o colaborador adquire direito às férias.</li>
<li><b>Prazo concessivo:</b> período limite para gozar as férias adquiridas.</li>
<li><b>Dias usados:</b> quantidade já lançada no ciclo.</li>
<li><b>Dias restantes:</b> saldo ainda disponível.</li>
<li><b>Quantidade de períodos:</b> controle de quantos períodos já foram usados.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📌 <b>Importante:</b><br>

As férias aprovadas consomem saldo do ciclo correspondente. Férias reprovadas e sugestões não consomem saldo definitivo.

</div>

<div id="ferias-status" class="guiaSubtitulo">

🚦 Status das Férias

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔓</div>
<div>
<div class="guiaMedalhaTitulo">Avaliar</div>
<div class="guiaMedalhaDescricao">Período cadastrado, mas ainda aguardando conferência ou aprovação.</div>
</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">🔒</div>
<div>
<div class="guiaMedalhaTitulo">Aprovado</div>
<div class="guiaMedalhaDescricao">Férias confirmadas e consideradas no saldo do colaborador.</div>
</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">❌</div>
<div>
<div class="guiaMedalhaTitulo">Reprovado</div>
<div class="guiaMedalhaDescricao">Período recusado ou desconsiderado para o planejamento.</div>
</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">💡</div>
<div>
<div class="guiaMedalhaTitulo">Sugerida</div>
<div class="guiaMedalhaDescricao">Sugestão automática criada pelo sistema com base no saldo disponível.</div>
</div>

</div>

<div class="guiaMedalha">

<div class="guiaIconesProgramacao">⚠️</div>
<div>
<div class="guiaMedalhaTitulo">Alerta</div>
<div class="guiaMedalhaDescricao">Indica prazo crítico, período fora da regra esperada ou férias vencidas.</div>
</div>

</div>

<div id="ferias-tooltip" class="guiaSubtitulo">

📊 Tooltip e Indicadores

</div>

<div class="guiaCard">

<p>

Ao passar o mouse sobre uma barra de férias, o sistema exibe uma tooltip personalizada com informações úteis para análise.

</p>

<ul>

<li>Nome do colaborador.</li>
<li>Período lançado.</li>
<li>Dias do período.</li>
<li>Ciclo aquisitivo.</li>
<li>Prazo concessivo.</li>
<li>Saldo de férias usado e restante.</li>
<li>Quantidade de períodos utilizados.</li>
<li>Tempo limite para gozar férias.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Barras de progresso</h4>

<ul>

<li><b>Saldo de férias:</b> mostra quantos dias do ciclo já foram utilizados.</li>
<li><b>Tempo limite:</b> mostra a proximidade do fim do prazo concessivo.</li>
<li>A barra de prazo troca de cor por estágio: verde, amarelo, laranja, vermelho e vermelho escuro quando vencido.</li>

</ul>

</div>

<div id="ferias-acoes" class="guiaSubtitulo">

🖱️ Ações e Menu de Contexto

</div>

<div class="guiaCard">

<p>

O menu de contexto é aberto com o botão direito do mouse sobre uma barra de férias.

</p>

<ul>

<li><b>Aprovar:</b> confirma o período e atualiza o saldo.</li>
<li><b>Reprovar:</b> marca o período como reprovado.</li>
<li><b>Apagar:</b> remove o período selecionado.</li>
<li><b>Aprovar sugestão:</b> transforma uma sugestão automática em férias reais.</li>

</ul>

</div>

<div class="guiaCard guiaAlerta">

⚠️ <b>Atenção:</b><br>

Ao apagar ou alterar férias, confira se a mudança está correta. Essas informações afetam RH, disponibilidade do colaborador
e planejamento da Programação.

</div>

<div id="ferias-boas-praticas" class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Cadastre férias assim que forem combinadas ou aprovadas.</li>
<li>Use o status <b>Avaliar</b> quando ainda houver pendência de validação.</li>
<li>Aprove apenas períodos realmente confirmados.</li>
<li>Confira saldo, ciclo aquisitivo e prazo concessivo antes de aprovar.</li>
<li>Use a tooltip para verificar rapidamente se há risco de vencimento.</li>
<li>Evite lançar períodos sobrepostos para o mesmo colaborador.</li>
<li>Revise colaboradores com férias vencidas ou próximas do limite.</li>
<li>Alinhe as férias com a Programação para evitar alocação indevida.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🏖️ <b>Resumo:</b><br>

O sistema de Férias ajuda a controlar saldo, prazos e aprovações, reduzindo risco de erros manuais e melhorando a
visibilidade operacional da equipe.

</div>

`;

}

function getRH() {

    return `

<div id="rh-topo" class="guiaTitulo">

👥 Recursos Humanos (RH)

</div>

<div class="guiaCard">

<h4>O que é o RH?</h4>

<p>

O módulo RH é o painel central de acompanhamento dos colaboradores da empresa.

</p>

<p>

Diferente do módulo Cadastro de Colaboradores, que possui foco no gerenciamento individual de cada profissional, o RH possui foco operacional e gerencial, permitindo visualizar rapidamente a situação de toda a equipe em uma única tela.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

O RH é o melhor local para identificar rapidamente vencimentos, pendências, integrações, exames, cursos e situações especiais dos colaboradores.

</div>

<div id="rh-visao-geral" class="guiaSubtitulo">

📋 Visão Geral da Equipe

</div>

<div class="guiaCard">

<p>

A tela principal apresenta todos os colaboradores cadastrados em formato de tabela, permitindo uma consulta rápida e organizada.

</p>

</div>

<div class="guiaCard">

<ul>

<li>ID do colaborador</li>

<li>Foto de perfil</li>

<li>Nome completo</li>

<li>Data de nascimento</li>

<li>Idade</li>

<li>Cargo</li>

<li>Setor</li>

<li>Situação dos EPIs</li>

<li>Integrações</li>

<li>Exames</li>

<li>Cursos</li>

<li>Status</li>

</ul>

</div>

<div id="rh-pesquisa" class="guiaSubtitulo">

🔎 Pesquisa e Filtros

</div>

<div class="guiaCard">

<p>

O sistema permite localizar rapidamente qualquer colaborador utilizando o campo de pesquisa localizado no topo da tela.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Nome completo</li>

<li>Parte do nome</li>

<li>Cargo</li>

<li>Setor</li>

</ul>

</div>

<div class="guiaCard">

<p>

Também é possível ativar o filtro:

</p>

<b>☑ Mostrar desligados</b>

<p>

Permitindo alternar entre:

</p>

<ul>

<li>Somente colaboradores ativos</li>

<li>Todos os colaboradores (ativos e desligados)</li>

</ul>

</div>

<div class="guiaCard">

<h4>Busca avançada e filtros rápidos</h4>

<p>

O topo do RH possui busca rápida, filtros rápidos e busca avançada. A busca principal pesquisa em várias informações da tabela,
como nome, ID, cargo, setor e status. A busca avançada permite refinar por cargo, setor e status específico.

</p>

<ul>

<li><b>Todos:</b> volta para a visão completa dos colaboradores visíveis.</li>
<li><b>Vencidos:</b> mostra colaboradores com itens vencidos ou críticos.</li>
<li><b>A vencer:</b> mostra colaboradores com alertas próximos do vencimento.</li>
<li><b>Agendados:</b> mostra colaboradores com exame agendado.</li>
<li><b>Férias:</b> mostra colaboradores em período de férias.</li>
<li><b>Afastados:</b> mostra colaboradores em afastamento, saúde, maternidade ou paternidade.</li>
<li><b>EPI:</b> mostra colaboradores com atenção ou avaliação necessária em EPI.</li>
<li><b>Mostrar desligados:</b> exibe colaboradores desligados, mantendo o histórico disponível para consulta.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Leitura rápida do topo:</b><br>

O resumo mostra quantos colaboradores estão visíveis depois dos filtros, quantos precisam de atenção e quantos estão em ausência.
No RH, <b>ausência</b> significa que o colaborador está fora da disponibilidade normal, como férias, afastamento, saúde,
maternidade, paternidade ou exame agendado.

</div>

<div id="rh-indicadores" class="guiaSubtitulo">

🚦 Indicadores Visuais

</div>

<div class="guiaCard">

<p>

A tela utiliza indicadores visuais para identificar rapidamente situações que exigem atenção.

</p>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🔴</div>

<div>

<div class="guiaMedalhaTitulo">

Atenção Necessária

</div>

<div class="guiaMedalhaDescricao">

Indica vencimentos, pendências ou situações que exigem ação imediata.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🟡</div>

<div>

<div class="guiaMedalhaTitulo">

Próximo do Vencimento

</div>

<div class="guiaMedalhaDescricao">

Documentos, cursos ou integrações que vencerão em breve.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🟢</div>

<div>

<div class="guiaMedalhaTitulo">

Situação Regular

</div>

<div class="guiaMedalhaDescricao">

Todos os requisitos encontram-se válidos.

</div>

</div>

</div>

<div id="rh-exames" class="guiaSubtitulo">

🩺 Coluna de Exames

</div>

<div class="guiaCard">

<p>

A coluna de exames apresenta visualmente todos os exames vinculados ao colaborador.

</p>

</div>

<div class="guiaCard">

<p>

Permite identificar rapidamente:

</p>

<ul>

<li>Exames realizados</li>

<li>Exames vencidos</li>

<li>Exames agendados</li>

<li>Pendências ocupacionais</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🩺 Ao clicar no colaborador é possível consultar o histórico completo de exames e documentos anexados.

</div>

<div id="rh-cursos" class="guiaSubtitulo">

🎓 Coluna de Cursos

</div>

<div class="guiaCard">

<p>

Apresenta os treinamentos e certificações vinculados ao colaborador.

</p>

</div>

<div class="guiaCard">

<p>

Exemplos:

</p>

<ul>

<li>NR-10</li>

<li>NR-35</li>

<li>NR-33</li>

<li>PTA</li>

<li>Brigadista</li>

<li>Primeiros Socorros</li>

</ul>

</div>

<div class="guiaCard">

<p>

Os indicadores visuais permitem identificar rapidamente treinamentos vencidos ou próximos do vencimento.

</p>

</div>

<div id="rh-integracoes" class="guiaSubtitulo">

🏭 Coluna de Integrações

</div>

<div class="guiaCard">

<p>

Exibe a quantidade de integrações válidas e disponíveis para o colaborador.

</p>

</div>

<div class="guiaCard">

<p>

Exemplo:

</p>

<b>14P (em 140)</b>

<p>

Indicando a quantidade de integrações disponíveis em relação ao total cadastrado no sistema.

</p>

</div>

<div class="guiaCard">

<p>

Também permite identificar rapidamente:

</p>

<ul>

<li>Integrações vencidas</li>

<li>Integrações pendentes</li>

<li>Integrações próximas do vencimento</li>

</ul>

</div>

<div id="rh-epis" class="guiaSubtitulo">

🦺 Coluna de EPIs

</div>

<div class="guiaCard">

<p>

Monitora a situação dos Equipamentos de Proteção Individual dos colaboradores.

</p>

</div>

<div class="guiaCard">

<ul>

<li>EPIs pendentes</li>

<li>Necessidade de substituição</li>

<li>Fichas incompletas</li>

<li>Controle de entrega</li>

</ul>

</div>

<div id="rh-operacional" class="guiaSubtitulo">

📊 Situação Operacional

</div>

<div class="guiaCard">

<p>

O RH auxilia diretamente no planejamento operacional da empresa.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Identificação de pendências</li>

<li>Controle documental</li>

<li>Planejamento de equipes</li>

<li>Controle de conformidade</li>

<li>Preparação para mobilizações</li>

<li>Auditorias internas</li>

</ul>

</div>

<div id="rh-vencimentos" class="guiaSubtitulo">

📅 Monitoramento de Vencimentos

</div>

<div class="guiaCard">

<p>

O RH foi desenvolvido para funcionar como um painel de monitoramento contínuo.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Exames vencidos</li>

<li>Exames próximos do vencimento</li>

<li>Cursos vencidos</li>

<li>Cursos próximos do vencimento</li>

<li>Integrações vencidas</li>

<li>Integrações próximas do vencimento</li>

<li>Pendências de EPIs</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📌 <b>Controle de vencimento:</b><br>

Exames e cursos cadastrados na tela <b>Gestão</b> possuem a coluna <b>Vencimento</b>.
Quando essa opção estiver desmarcada, o item continua aparecendo no histórico do colaborador,
mas não entra nos indicadores de vencido, próximo do vencimento ou alerta do RH.

</div>

<div id="rh-acoes" class="guiaSubtitulo">

⚙️ Ações Disponíveis

</div>

<div class="guiaCard">

<p>

Através da tela RH é possível:

</p>

<ul>

<li>➕ Cadastrar Colaborador</li>

<li>📋 Registrar / Anexar documentos</li>

<li>🔄 Atualizar a tabela</li>

<li>👤 Abrir perfil completo do colaborador</li>

<li>🔍 Pesquisar colaboradores</li>

<li>👀 Exibir desligados</li>

</ul>

</div>

<div id="rh-boas-praticas" class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Consulte o RH diariamente para verificar pendências.</li>

<li>Acompanhe vencimentos antes das datas limite.</li>

<li>Mantenha exames e cursos atualizados.</li>

<li>Monitore integrações antes de mobilizações.</li>

<li>Utilize os indicadores visuais para priorizar ações.</li>

<li>Revise periodicamente a situação dos EPIs.</li>

<li>Mantenha os dados cadastrais atualizados no perfil do colaborador.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

👥 <b>Importante:</b><br>

O RH é o principal painel de monitoramento da equipe. Ele consolida informações de Cadastro de Colaboradores, Exames, Cursos, Integrações, EPIs, Conquistas e Programação, permitindo uma visão rápida e estratégica de toda a força de trabalho da empresa.

</div>

`;

}

function getCursos() {
    return '<div class="guiaTitulo">🎓 Cursos</div>';
}

function getIntegracoes() {
    return '<div class="guiaTitulo">🏭 Integrações</div>';
}

function getMaletas() {
    return '<div class="guiaTitulo">🎒 Maletas</div>';
}

function getIA() {

    return `

<div id="ia-topo" class="guiaTitulo">

🧠 Central IA

</div>

<div id="ia-o-que-e"
     class="guiaSubtitulo">

O que é a IA Operacional?

</div>

<div class="guiaCard">

<p>

A IA Operacional é uma assistente inteligente integrada ao sistema,
capaz de localizar informações operacionais, consultar programações,
analisar históricos e responder perguntas utilizando os dados já cadastrados.

</p>

<p>

Seu objetivo é reduzir o tempo gasto procurando informações
e auxiliar gestores, encarregados e colaboradores na tomada de decisões.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

A IA entende perguntas feitas em linguagem natural.
Não é necessário utilizar comandos específicos.

</div>

<div id="ia-consultas" class="guiaSubtitulo">

🔎 O que a IA consegue consultar?

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">👷</div>

<div>

<div class="guiaMedalhaTitulo">

Colaboradores

</div>

<div class="guiaMedalhaDescricao">

Localização, histórico operacional,
dados cadastrais e informações disponíveis no sistema.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📅</div>

<div>

<div class="guiaMedalhaTitulo">

Programações

</div>

<div class="guiaMedalhaDescricao">

Consultar quem trabalhou,
quem irá trabalhar e programações futuras.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📋</div>

<div>

<div class="guiaMedalhaTitulo">

Ordens de Serviço

</div>

<div class="guiaMedalhaDescricao">

Consultar equipes, responsáveis e histórico de execução.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🏭</div>

<div>

<div class="guiaMedalhaTitulo">

Empresas

</div>

<div class="guiaMedalhaDescricao">

Consultas e estatísticas relacionadas aos clientes cadastrados.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📊</div>

<div>

<div class="guiaMedalhaTitulo">

Rankings e Indicadores

</div>

<div class="guiaMedalhaDescricao">

Produtividade, quantidade de trabalhos e estatísticas operacionais.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🔔</div>

<div>

<div class="guiaMedalhaTitulo">

Alertas Inteligentes

</div>

<div class="guiaMedalhaDescricao">

Exames vencidos e exames próximos do vencimento.

</div>

</div>

</div>

<div id="ia-perguntas" class="guiaSubtitulo">

💬 Exemplos de perguntas

</div>

<div class="guiaCard">

<b>Colaboradores</b>

<ul>

<li>Onde Marcos está trabalhando?</li>

<li>Quem trabalhou hoje?</li>

<li>Quem vai trabalhar amanhã?</li>

<li>Quem trabalhou esta semana?</li>

</ul>

</div>

<div class="guiaCard">

<b>Empresas</b>

<ul>

<li>Quem trabalhou mais na PMB?</li>

<li>Quem atuou na JTI este mês?</li>

<li>Quantas vezes Marcos trabalhou na FEMSA?</li>

<li>Quem trabalhou na UTC este ano?</li>

</ul>

</div>

<div class="guiaCard">

<b>Ordens de Serviço</b>

<ul>

<li>Quem participou da OS 1523?</li>

<li>Equipe da OS 845</li>

<li>Quem executou a OS 654?</li>

</ul>

</div>

<div class="guiaCard">

<b>Estatísticas</b>

<ul>

<li>Quem trabalhou mais este mês?</li>

<li>Ranking da PMB</li>

<li>Quem possui mais dias trabalhados?</li>

<li>Quantas vezes João trabalhou na JTI?</li>

</ul>

</div>

<div class="guiaCard">

<b>Datas Inteligentes</b>

<ul>

<li>Quem trabalhou hoje?</li>

<li>Quem trabalhou ontem?</li>

<li>Quem vai trabalhar amanhã?</li>

<li>Quem trabalhou mês passado?</li>

<li>Quem trabalhou este ano?</li>

</ul>

</div>

<div id="ia-capacidades" class="guiaSubtitulo">

⚙️ Recursos da IA

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🧮</div>

<div>

<div class="guiaMedalhaTitulo">

Análises Automáticas

</div>

<div class="guiaMedalhaDescricao">

Transforma dados operacionais em informações úteis para gestão.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📈</div>

<div>

<div class="guiaMedalhaTitulo">

Rankings

</div>

<div class="guiaMedalhaDescricao">

Geração automática de rankings de produtividade e indicadores.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📍</div>

<div>

<div class="guiaMedalhaTitulo">

Localização Operacional

</div>

<div class="guiaMedalhaDescricao">

Identifica onde colaboradores estão ou estiveram alocados.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🎂</div>

<div>

<div class="guiaMedalhaTitulo">

Aniversariantes

</div>

<div class="guiaMedalhaDescricao">

Consulta aniversariantes do dia e do mês.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🩺</div>

<div>

<div class="guiaMedalhaTitulo">

Alertas de Exames

</div>

<div class="guiaMedalhaDescricao">

Monitora exames vencidos e próximos do vencimento.

</div>

</div>

</div>

<div id="ia-boas-praticas" class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Faça perguntas completas.</li>

<li>Informe o nome do colaborador quando possível.</li>

<li>Informe a empresa para filtros mais precisos.</li>

<li>Utilize datas e períodos nas consultas.</li>

<li>Utilize a IA para localizar informações rapidamente.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🧠 <b>Importante:</b><br>

A IA responde utilizando exclusivamente os dados cadastrados no sistema.
Quanto mais completos e atualizados estiverem os registros,
mais precisas serão as respostas fornecidas.

</div>

`;

}

function getConquistas() {

    return `

<div id="med-topo" class="guiaTitulo">

🏅 Medalhas e Conquistas

</div>
<div id="med-visualizacao"
     class="guiaSubtitulo">
👀 Visualização
</div>
<div class="guiaCard">

<h4>Como visualizar minhas medalhas?</h4>

<p>

Todas as medalhas e conquistas ficam disponíveis:

</p>

<ul>

<li>Na aba <b>Conquistas</b> do perfil do colaborador.</li>

<li>No <b>Hall da Experiência</b>.</li>

<li>Em rankings e dashboards futuros de reconhecimento.</li>

</ul>

</div>

<div id="med-card" class="guiaSubtitulo">

⭕ Entendendo o Card do Colaborador

</div>

<div class="guiaCard">

O Hall da Experiência apresenta um resumo visual da trajetória e evolução de cada colaborador dentro da RTW.
<br><br>
Cada elemento do cartão possui uma função específica e é atualizado automaticamente conforme a experiência, conquistas e participação do colaborador na empresa.

</div>
<img
    src="/imagens/guias/guia_card_colab.png"
    alt="Entendendo o Card do Colaborador"
    class="guiaImagem"
/>

<div id="med-faixa" class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏳️</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Faixa de Destaque

        </div>

        <div class="guiaMedalhaDescricao">

            Exibida no canto superior esquerdo do cartão. Identifica funções especiais e reconhecimentos importantes:<br>
            🟨 Primeiro Destaque do Ano,<br>
            🟥 Brigadista,<br>
            🟩 CIPA,<br>
            🟦 Brigadista e CIPA simultaneamente.<br>

        </div>

    </div>

</div>


<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

O Hall da Experiência considera diversos fatores para evolução dos colaboradores, incluindo tempo de empresa, clientes atendidos, cidades visitadas, Ordens de Serviço executadas, conquistas recebidas e participação em atividades especiais da RTW.

</div>


<div class="guiaCard">
<div id="med-adicionar"
     class="guiaSubtitulo">

➕ Como Adicionar

</div>
<h4>Como conceder uma conquista?</h4>

<p>

As conquistas especiais podem ser concedidas manualmente pelos responsáveis.

</p>

<ol>

<li>Acesse o perfil do colaborador.</li>

<li>Abra a aba <b>Conquistas</b>.</li>

<li>Selecione a conquista desejada.</li>

<li>Clique em <b>Adicionar</b>.</li>

</ol>

<p class="guiaMedalhaDescricao">

A data de concessão é registrada automaticamente pelo sistema.

</p>

</div>


<div id="med-manuais" class="guiaSubtitulo">
🏆 Conquistas Manuais
</div>
<div class="guiaMedalha">
    <div class="guiaMedalhaIcone">💡</div>
<div>
<div class="guiaMedalhaTitulo">
    Inovador
</div>
<div class="guiaMedalhaDescricao">
    Concedida a colaboradores que criaram melhorias, automações ou processos que geraram resultados positivos.
</div>
</div>
</div>

<div class="guiaMedalha">
    <div class="guiaMedalhaIcone">🤝</div>
<div>
<div class="guiaMedalhaTitulo">
    Espírito de Equipe
</div>
<div class="guiaMedalhaDescricao">
    Reconhece colaboradores que promovem colaboração, respeito e ajudam seus colegas constantemente.
</div>
</div>
</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🚨</div>

<div>

<div class="guiaMedalhaTitulo">

Herói da Segurança

</div>

<div class="guiaMedalhaDescricao">

Concedida por atitudes relevantes de prevenção de acidentes e promoção da segurança.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🎓</div>

<div>

<div class="guiaMedalhaTitulo">

Mentor

</div>

<div class="guiaMedalhaDescricao">

Reconhece profissionais que compartilham conhecimento e desenvolvem outros colaboradores.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🌎</div>

<div>

<div class="guiaMedalhaTitulo">

Embaixador

</div>

<div class="guiaMedalhaDescricao">

Representa a empresa de forma exemplar perante clientes, fornecedores e parceiros.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">💬</div>

<div>

<div class="guiaMedalhaTitulo">

Elogiado pelo Cliente

</div>

<div class="guiaMedalhaDescricao">

Conquista recebida através de elogios e reconhecimentos formais dos clientes.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🧩</div>

<div>

<div class="guiaMedalhaTitulo">

Resolve Tudo

</div>

<div class="guiaMedalhaDescricao">

Reconhece profissionais que encontram soluções para desafios complexos do dia a dia.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">👔</div>

<div>

<div class="guiaMedalhaTitulo">

Liderança Inspiradora

</div>

<div class="guiaMedalhaDescricao">

Concedida a líderes que influenciam positivamente suas equipes pelo exemplo.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🏔️</div>

<div>

<div class="guiaMedalhaTitulo">

Superação

</div>

<div class="guiaMedalhaDescricao">

Reconhece colaboradores que superaram desafios importantes durante sua trajetória.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">❤️</div>

<div>

<div class="guiaMedalhaTitulo">

Orgulho RTW

</div>

<div class="guiaMedalhaDescricao">

Uma das maiores honrarias concedidas pela empresa.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🧠</div>

<div>

<div class="guiaMedalhaTitulo">

Solução Inteligente

</div>

<div class="guiaMedalhaDescricao">

Reconhece soluções criativas e eficientes para problemas complexos.
</div>
</div>
</div>



<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🦉</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Coruja

        </div>

        <div class="guiaMedalhaDescricao">

            Reconhece colaboradores que demonstram dedicação excepcional em atividades realizadas durante períodos noturnos, paradas de manutenção ou atendimentos fora do horário convencional.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🎯</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Precisão

        </div>

        <div class="guiaMedalhaDescricao">

            Concedida a profissionais que executam suas atividades com elevado padrão de qualidade, baixa incidência de retrabalho e atenção aos detalhes.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">📋</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Organização Exemplar

        </div>

        <div class="guiaMedalhaDescricao">

            Reconhecimento destinado aos colaboradores que mantêm documentação, materiais, ferramentas e informações organizadas de forma exemplar.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">⚡</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Resposta Rápida

        </div>

        <div class="guiaMedalhaDescricao">

            Concedida a profissionais que demonstram agilidade no atendimento de demandas urgentes, emergências e situações críticas.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">📡</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Comunicador

        </div>

        <div class="guiaMedalhaDescricao">

            Reconhece colaboradores que mantêm comunicação clara, objetiva e eficiente com clientes, colegas e lideranças.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🦾</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Alta Performance

        </div>

        <div class="guiaMedalhaDescricao">

            Destinada aos profissionais que mantêm desempenho acima da média, entregando resultados consistentes e de alto impacto para a empresa.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">⏱️</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Pontualidade de Ouro

        </div>

        <div class="guiaMedalhaDescricao">

            Concedida aos colaboradores que demonstram elevado compromisso com horários, prazos e compromissos assumidos.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🔐</div>

    <div>

        <div class="guiaMedalhaTitulo">

            Guardião da Qualidade

        </div>

        <div class="guiaMedalhaDescricao">

            Reconhece profissionais que contribuem continuamente para a excelência dos serviços, mantendo elevados padrões de qualidade e confiabilidade.

        </div>

    </div>

</div>

<div id="med-seguranca" class="guiaSubtitulo">

🦺 Medalhas por Função e Segurança

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">♻️</div>

<div>

<div class="guiaMedalhaTitulo">

Membro da CIPA

</div>

<div class="guiaMedalhaDescricao">

Participa da Comissão Interna de Prevenção de Acidentes.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">⛑️</div>

<div>

<div class="guiaMedalhaTitulo">

Brigadista

</div>

<div class="guiaMedalhaDescricao">

Integrante da Brigada de Emergência da empresa.

</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🛡️</div>

<div>

<div class="guiaMedalhaTitulo">

Guardião da Segurança

</div>

<div class="guiaMedalhaDescricao">

Obtida automaticamente quando o colaborador é simultaneamente CIPA e Brigadista.

</div>

</div>

</div>

<div id="med-automaticas" class="guiaSubtitulo">

⚙️ Medalhas Automáticas

</div>

<div class="guiaCard guiaInfo">

💡 <b>Importante</b>

<br><br>

Estas medalhas são calculadas automaticamente pelo sistema com base em:

<ul>

<li>Tempo de empresa.</li>

<li>Clientes atendidos.</li>

<li>Cidades visitadas.</li>

<li>Ordens de Serviço executadas.</li>

<li>Cargos especiais.</li>

<li>Participação na CIPA e Brigada.</li>

</ul>

Não é necessário cadastrá-las manualmente.

</div>
<div id="med-viagens" class="guiaSubtitulo">

🌎 Experiência em Viagens

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🚁</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Viajante
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao atuar em mais de 10 cidades diferentes.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">✈️</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Explorador
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao atuar em mais de 20 cidades diferentes.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🚀</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Desbravador
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao atuar em mais de 50 cidades diferentes.

        </div>

    </div>

</div>


<div id="med-clientes" class="guiaSubtitulo">

🏢 Experiência com Clientes

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏗️</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Multifunção
        </div>

        <div class="guiaMedalhaDescricao">

            Atendeu mais de 10 clientes diferentes.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏭</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Especialista Multifunção
        </div>

        <div class="guiaMedalhaDescricao">

            Atendeu mais de 50 clientes diferentes.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏢</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Mestre Multifunção
        </div>

        <div class="guiaMedalhaDescricao">

            Atendeu mais de 100 clientes diferentes.

        </div>

    </div>

</div>


<div id="med-operacional" class="guiaSubtitulo">

📋 Experiência Operacional

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">⚒️</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Especialista Operacional
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao participar de mais de 50 Ordens de Serviço.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🔥</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Centurião
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao participar de mais de 100 Ordens de Serviço.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🛠️</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Veterano de Campo
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao participar de mais de 500 Ordens de Serviço.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🧰</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Mestre das OS
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada ao participar de mais de 1000 Ordens de Serviço.

        </div>

    </div>

</div>


<div id="med-tempo-casa" class="guiaSubtitulo">

⏳ Tempo de Empresa

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">💎</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Mestre RTW
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada após completar 5 anos de empresa.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">⭐</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Pilar RTW
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada após completar 10 anos de empresa.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏛️</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Fundação RTW
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada após completar 15 anos de empresa.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">👑</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Lenda RTW
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada após completar 20 anos de empresa.

        </div>

    </div>

</div>

<div class="guiaMedalha">

    <div class="guiaMedalhaIcone">🏰</div>

    <div>

        <div class="guiaMedalhaTitulo">
            Patrimônio RTW
        </div>

        <div class="guiaMedalhaDescricao">

            Conquistada após completar 25 anos de dedicação à empresa.

        </div>

    </div>

</div>
`;

}

function getFerramentas() {

    return `

<div id="ferramentas-topo" class="guiaTitulo">

🧰 Ferramentas

</div>

<div class="guiaCard">

<p>

A tela <b>Ferramentas</b> reúne recursos auxiliares do sistema. Ela foi criada para concentrar funções que ajudam no trabalho técnico,
administrativo e operacional, sem misturar essas rotinas com Programação, RH ou Materiais.

</p>

<p>

Atualmente a tela possui duas ferramentas principais: <b>Numeração de Documentos</b> e <b>Registros de Painel Elétrico</b>.
Cada ferramenta fica em uma aba própria; ao clicar no submenu, somente a ferramenta escolhida é exibida.

</p>

</div>

<div id="ferramentas-visao-geral" class="guiaSubtitulo">

📌 Visão Geral

</div>

<div class="guiaCard">

<ul>

<li>As ferramentas são organizadas por abas internas.</li>
<li>Ferramentas não contratadas podem aparecer bloqueadas, conforme o pacote da empresa.</li>
<li>Os dados de ferramentas podem ser usados por outras telas, como Complementos da OS.</li>
<li>Algumas ferramentas salvam dados no banco e outras geram resultados rápidos para copiar e utilizar fora do sistema.</li>

</ul>

</div>

<div id="ferramentas-numdocs" class="guiaSubtitulo">

🔢 Numeração de Documentos

</div>

<div class="guiaCard">

<p>

A ferramenta <b>Numeração de Documentos</b> monta o nome padronizado de arquivos técnicos, ajudando o usuário a copiar o resultado
e renomear documentos com o mesmo formato.

</p>

<ul>

<li><b>OS:</b> número da Ordem de Serviço.</li>
<li><b>Contratada:</b> empresa responsável pela execução.</li>
<li><b>Contratante:</b> cliente selecionado entre os cadastros existentes.</li>
<li><b>Tipo de documento:</b> sigla selecionada na lista, como ART, LM, IO, RT, PE, DE e outras.</li>
<li><b>Sequência:</b> número sequencial do documento; se ficar em branco, essa parte não entra no resultado.</li>
<li><b>Área/Nome:</b> complemento livre para identificar área, setor ou nome do documento.</li>
<li><b>Mês/Ano:</b> competência usada no padrão do arquivo.</li>
<li><b>Revisão:</b> revisão do documento, como REV00.</li>
<li><b>Motivo da revisão:</b> observação opcional para controle interno.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📋 <b>Resultado:</b><br>

Após preencher os campos, o sistema gera o texto final para copiar e colar no nome do arquivo.
A tabela abaixo do formulário permite copiar, editar ou apagar os registros adicionados.

</div>

<div id="ferramentas-paineis" class="guiaSubtitulo">

⚡ Registros de Painel Elétrico

</div>

<div class="guiaCard">

<p>

A ferramenta <b>Registros de Painel Elétrico</b> controla os painéis cadastrados, seus dados técnicos, responsáveis e andamento de montagem.
Esses registros também podem ser vinculados em uma OS pela aba Complementos.

</p>

<ul>

<li><b>Cliente:</b> selecionado a partir dos clientes cadastrados.</li>
<li><b>Atuação do painel:</b> descreve onde ou para qual finalidade o painel será usado.</li>
<li><b>Nº de série:</b> gerado seguindo o padrão do ano e o próximo número disponível, como 26.123.</li>
<li><b>Tensão:</b> selecionada em combo, com opções como 12V, 24V, 110V, 220V, 380V e combinações.</li>
<li><b>Frequência:</b> selecionada entre 50Hz e 60Hz.</li>
<li><b>Tamanho:</b> selecionado pela lista de dimensões, com opção de dimensão personalizada.</li>
<li><b>Projetista:</b> selecionado entre os responsáveis cadastrados.</li>
<li><b>Montador:</b> responsável pela montagem do painel.</li>
<li><b>ART, senha, peso e link externo:</b> campos complementares para rastreabilidade.</li>

</ul>

</div>

<div id="ferramentas-checklist" class="guiaSubtitulo">

✅ Checklist e Progresso

</div>

<div class="guiaCard">

<p>

Cada painel possui um checklist com etapas de acompanhamento. A barra de progresso muda conforme os itens marcados,
indo de tons de alerta até tons de conclusão.

</p>

<ul>

<li><b>Material separado:</b> indica que os materiais necessários já foram separados.</li>
<li><b>Montagem realizada:</b> indica que a montagem física foi concluída.</li>
<li><b>Testado:</b> indica que o painel passou por teste.</li>
<li><b>Embalado para envio:</b> indica que está pronto para transporte ou entrega.</li>

</ul>

</div>

<div id="ferramentas-imagens" class="guiaSubtitulo">

🖼️ Imagens, Link Externo e QR Code

</div>

<div class="guiaCard">

<ul>

<li>Após cadastrar o painel, é possível adicionar imagens do painel montado.</li>
<li>Mais de uma imagem pode ser vinculada ao mesmo painel.</li>
<li>As imagens podem ser visualizadas na própria tela, em uma galeria com navegação.</li>
<li>O link externo pode ser aberto por botão rápido.</li>
<li>Quando houver link, o sistema pode gerar QR Code para facilitar acesso externo.</li>

</ul>

</div>

<div id="ferramentas-boas-praticas" class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Cadastre painéis com cliente, atuação e responsáveis bem definidos.</li>
<li>Use a sequência automática para evitar número de série repetido.</li>
<li>Atualize o checklist conforme o painel avançar na produção.</li>
<li>Adicione imagens somente depois do painel estar cadastrado.</li>
<li>Use o resultado da numeração de documentos para manter os arquivos com padrão único.</li>
<li>Vincule o painel na OS quando a montagem ou instalação fizer parte do serviço.</li>

</ul>

</div>

`;

}

function getGestao() {

    return `

<div id="gestao-topo"
     class="guiaTitulo">

⚙️ Tela Gestão

</div>

<div id="gestao-visao-geral"
     class="guiaSubtitulo">

📋 Visão Geral

</div>

<div class="guiaCard">

<p>

A tela <b>Gestão</b> é o painel central para administrar cadastros estruturais do sistema.
Ela concentra tabelas de OS, empresas, supervisores, cidades, setores, cargos, exames, cursos,
EPIs e fornecedores em uma única interface.

</p>

<p>

O objetivo da tela é permitir manutenção rápida dos cadastros base que alimentam outros módulos,
como Programação, RH, Colaboradores, Materiais e indicadores operacionais.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Ideia principal:</b><br>

Use a Gestão para manter os cadastros mestres corretos. Quando empresa, cidade, supervisor,
cargo, setor, exame, curso ou EPI estão bem cadastrados, as demais telas passam a carregar
opções mais consistentes e com menos retrabalho.

</div>

<div class="guiaCard">

<h4>O que a tela permite fazer</h4>

<ul>

<li>Consultar listas de cadastros em formato de tabela.</li>

<li>Criar novos registros diretamente na tabela ou abrir formulário específico, como no caso de OS.</li>

<li>Editar registros existentes com edição inline.</li>

<li>Excluir registros com confirmação de segurança.</li>

<li>Filtrar dados digitando qualquer texto no campo de busca.</li>

<li>Ordenar colunas clicando no cabeçalho da tabela.</li>

<li>Atualizar os dados manualmente pelo botão de recarregar.</li>

<li>Gerenciar vínculos de Empresa com Cidades e Supervisores.</li>

<li>Gerenciar vínculos de Setor com Cargos.</li>

<li>Alterar status de OS e acompanhar indicadores operacionais.</li>

<li>Visualizar gráficos de OS por período, responsável e taxa de conclusão.</li>

</ul>

</div>

<div id="gestao-acesso"
     class="guiaSubtitulo">

🚪 Acesso e Permissões

</div>

<div class="guiaCard">

<p>

O acesso ao módulo Gestão é feito pelo menu lateral através do item <b>Gestão</b>.
No menu principal, esse item está configurado para usuários com os níveis permitidos pelo atributo
<code>data-roles="6,7,99"</code>.

</p>

<ul>

<li><b>Nível 6 e 7:</b> podem acessar a tela conforme a regra atual do menu.</li>

<li><b>Nível 99:</b> possui acesso administrativo e também visualiza abas restritas.</li>

<li><b>Aba Fornecedor:</b> aparece com <code>data-roles="99"</code>, ou seja, fica restrita a usuários autorizados.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🔐 <b>Atenção:</b><br>

A visibilidade no menu ajuda a controlar acesso visual, mas as rotas de API também usam autenticação.
Isso evita que uma chamada direta seja aceita sem sessão válida.

</div>

<div id="gestao-abas"
     class="guiaSubtitulo">

🧭 Abas e Cadastros

</div>

<div class="guiaCard">

<p>

No topo da tela existem abas. Cada aba troca a entidade em edição e recarrega a tabela com os dados
correspondentes.

</p>

<table>
<thead>
<tr>
<th>Aba</th>
<th>Uso principal</th>
<th>Campos/Detalhes exibidos</th>
</tr>
</thead>
<tbody>
<tr>
<td><b>OS</b></td>
<td>Consultar e acompanhar ordens de serviço cadastradas.</td>
<td>Status, descrição, empresa, supervisor, cidade, responsável, orçamento, criação e conclusão.</td>
</tr>
<tr>
<td><b>Empresa</b></td>
<td>Manter empresas/clientes usados na programação e cadastros.</td>
<td>Nome, cidades vinculadas, supervisores vinculados e flags de integração/liberação/segurança.</td>
</tr>
<tr>
<td><b>Supervisor</b></td>
<td>Manter contatos de supervisores.</td>
<td>Nome, email e telefone.</td>
</tr>
<tr>
<td><b>Cidade</b></td>
<td>Manter cidades utilizadas por empresas e OS.</td>
<td>Nome e estado.</td>
</tr>
<tr>
<td><b>Setor</b></td>
<td>Organizar áreas internas e relacionar cargos.</td>
<td>Nome, cargos vinculados e nível de acesso.</td>
</tr>
<tr>
<td><b>Cargo</b></td>
<td>Definir cargos usados nos colaboradores.</td>
<td>Nome, nível de acesso e disponibilidade para colaborador.</td>
</tr>
<tr>
<td><b>Exame</b></td>
<td>Cadastrar tipos de exames ocupacionais.</td>
<td>Nome, descrição e controle de vencimento.</td>
</tr>
<tr>
<td><b>Curso</b></td>
<td>Cadastrar tipos de cursos/treinamentos.</td>
<td>Nome, descrição e controle de vencimento.</td>
</tr>
<tr>
<td><b>EPI</b></td>
<td>Cadastrar itens de EPI controlados no sistema.</td>
<td>Nome e obrigatoriedade.</td>
</tr>
<tr>
<td><b>Fornecedor</b></td>
<td>Manter fornecedores usados em materiais/cotações.</td>
<td>Nome, email, telefone e ICMS.</td>
</tr>
</tbody>
</table>

</div>

<div class="guiaCard guiaInfo">

📌 <b>Importante:</b><br>

Alguns cadastros são base para outros. Por exemplo: uma OS depende de empresa, cidade,
supervisor e responsável. Um colaborador depende de cargo e setor. Um EPI, exame ou curso
mal cadastrado pode afetar listas, anexos e vencimentos.

</div>

<div class="guiaCard">

<h4>Vencimento em Exames e Cursos</h4>

<p>

Nas abas <b>Exame</b> e <b>Curso</b>, a coluna <b>Vencimento</b> define se aquele cadastro deve gerar controle de validade.

</p>

<ul>

<li><b>Marcado:</b> o sistema calcula vencimento, alerta e status vencido normalmente.</li>

<li><b>Desmarcado:</b> o item fica como <b>não vence</b> no histórico do colaborador.</li>

<li>Itens desmarcados não entram nos alertas do RH, da Programação ou do Form do colaborador.</li>

<li>A alteração é aplicada para novos registros e também para históricos já vinculados ao mesmo exame ou curso.</li>

</ul>

</div>

<div id="gestao-toolbar"
     class="guiaSubtitulo">

🧰 Barra de Ferramentas

</div>

<div class="guiaCard">

<p>

A barra de ferramentas fica acima da tabela e concentra as ações rápidas da tela.

</p>

<ul>

<li><b>+ Novo:</b> cria um novo registro para a aba atual. Na aba OS, abre o formulário completo de cadastro de OS.</li>

<li><b>Atualizar:</b> recarrega a lista da aba atual a partir da API.</li>

<li><b>📉 Mostrar Gráfico:</b> disponível na aba OS; exibe os gráficos operacionais.</li>

<li><b>📈 Ocultar Gráfico:</b> aparece quando o gráfico está aberto; recolhe a área gráfica.</li>

<li><b>Buscar em qualquer coluna:</b> filtra as linhas da tabela pelo texto digitado.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Ícones e botões usados</h4>

<ul>

<li><b>+</b> indica inclusão de novo registro ou inclusão de vínculo.</li>

<li><b>📉</b> indica abertura da área de gráficos.</li>

<li><b>📈</b> indica recolhimento da área de gráficos.</li>

<li><b>Lápis</b> indica editar registro.</li>

<li><b>Lixeira</b> indica apagar registro.</li>

<li><b>Disquete</b> indica salvar alteração ou novo registro.</li>

<li><b>X</b> indica cancelar edição ou remover vínculo de chip.</li>

<li><b>Checkbox</b> indica campos booleanos, como obrigatório, disponível, integração, liberação, segurança e vencimento.</li>

</ul>

</div>

<div id="gestao-tabela"
     class="guiaSubtitulo">

📊 Tabela

</div>

<div class="guiaCard">

<p>

A tabela é montada dinamicamente conforme a aba selecionada. O cabeçalho é criado a partir dos campos
retornados para aquela entidade, e a coluna <b>Ações</b> é adicionada ao final.

</p>

<ul>

<li><b>Cabeçalho fixo:</b> permanece visível durante a rolagem da tabela.</li>

<li><b>Ordenação:</b> clique em uma coluna para ordenar crescente ou decrescente.</li>

<li><b>Busca:</b> filtra qualquer texto visível da linha.</li>

<li><b>Total:</b> em abas que não são OS, o contador mostra quantos registros estão visíveis.</li>

<li><b>Linhas em edição:</b> ficam destacadas visualmente para evitar confusão.</li>

<li><b>Novo registro:</b> aparece no topo da tabela com destaque azul/verde.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🔎 <b>Busca rápida:</b><br>

A pesquisa não filtra apenas uma coluna. Ela procura o termo em toda a linha renderizada.
Isso permite buscar por nome, cidade, supervisor, status, telefone, descrição ou qualquer informação visível.

</div>

<div id="gestao-crud"
     class="guiaSubtitulo">

✏️ Criar, Editar e Excluir

</div>

<div class="guiaCard">

<h4>Criar novo registro</h4>

<ul>

<li>Clique em <b>+ Novo</b>.</li>

<li>Nas abas comuns, uma linha nova aparece no topo da tabela.</li>

<li>Preencha os campos necessários.</li>

<li>Clique no ícone de <b>salvar</b> para gravar.</li>

<li>Clique no <b>X</b> para cancelar antes de gravar.</li>

<li>Na aba <b>OS</b>, o botão abre o formulário completo de cadastro de OS, pois a OS possui regras e campos dependentes.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Editar registro</h4>

<ul>

<li>Clique no ícone de <b>lápis</b> na coluna Ações.</li>

<li>Os campos editáveis da linha viram inputs ou selects.</li>

<li>O sistema bloqueia múltiplas edições ao mesmo tempo.</li>

<li>Depois de alterar, clique em <b>salvar</b>.</li>

<li>Para desistir, clique em <b>cancelar</b> e os dados originais voltam para a linha.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Excluir registro</h4>

<ul>

<li>Clique no ícone de <b>lixeira</b>.</li>

<li>O sistema abre confirmação antes de excluir.</li>

<li>Ao confirmar, a rota de exclusão é chamada e a tabela é recarregada.</li>

<li>Quando houver vínculos com outros registros, a exclusão pode falhar por segurança ou regra do banco.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

⚠️ <b>Cuidado:</b><br>

Excluir cadastros base pode afetar telas que dependem deles. Antes de apagar empresa, cidade,
supervisor, cargo, exame, curso, EPI ou fornecedor, verifique se o registro não está sendo usado.

</div>

<div id="gestao-vinculos"
     class="guiaSubtitulo">

🔗 Vínculos entre Cadastros

</div>

<div class="guiaCard">

<p>

Algumas abas possuem relações com outros cadastros. Elas são exibidas em formato de <b>chips</b>,
permitindo adicionar e remover itens sem abrir outro formulário.

</p>

<ul>

<li><b>Empresa → Cidades:</b> define em quais cidades aquela empresa atua.</li>

<li><b>Empresa → Supervisores:</b> define quais supervisores pertencem ou atendem aquela empresa.</li>

<li><b>Setor → Cargos:</b> define quais cargos fazem parte daquele setor.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Como adicionar vínculo</h4>

<ul>

<li>Clique no botão <b>+</b> dentro da célula de chips.</li>

<li>Escolha uma opção no seletor exibido.</li>

<li>Clique no ícone de <b>salvar</b>.</li>

<li>O vínculo é enviado para a API e a tabela é recarregada.</li>

</ul>

<h4>Como remover vínculo</h4>

<ul>

<li>Clique no <b>x</b> dentro do chip.</li>

<li>O sistema remove a associação e recarrega a tabela.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🧩 <b>Por que vínculos importam?</b><br>

Eles alimentam seletores dependentes. Ao editar uma OS, por exemplo, a escolha da empresa influencia
as opções de cidade e supervisor disponíveis para aquela OS.

</div>

<div id="gestao-os"
     class="guiaSubtitulo">

🧾 Gestão de OS

</div>

<div class="guiaCard">

<p>

A aba <b>OS</b> é especial porque trabalha com dados operacionais e possui indicadores próprios.
Ela permite consultar, editar status e acompanhar a evolução das ordens de serviço.

</p>

<ul>

<li><b>Status:</b> pode ser alterado diretamente por select na tabela.</li>

<li><b>Empresa:</b> ao editar, influencia supervisor e cidade.</li>

<li><b>Supervisor:</b> pode aparecer como select quando a empresa possui mais de um supervisor.</li>

<li><b>Cidade:</b> pode aparecer como select quando a empresa possui mais de uma cidade.</li>

<li><b>Responsável:</b> usa a lista de responsáveis carregada em <code>/api/colaboradores/responsavel/cbx</code>.</li>

<li><b>Orçado:</b> é exibido formatado como moeda brasileira.</li>

<li><b>Criado e concluído:</b> são formatados para facilitar leitura por mês/data.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Status disponíveis na OS</h4>

<ul>

<li>⚪ <b>Sem responsável:</b> OS sem liderança definida.</li>

<li>🟠 <b>Aguardando:</b> OS ainda em espera para iniciar.</li>

<li>🔵 <b>Em execução:</b> OS em andamento.</li>

<li>🔴 <b>Parado:</b> OS interrompida ou bloqueada.</li>

<li>🟢 <b>Concluído:</b> OS finalizada.</li>

<li>🟡 <b>Em espera:</b> OS em pausa planejada ou aguardando condição.</li>

<li>⚫ <b>Cancelado:</b> OS cancelada.</li>

</ul>

</div>

<div id="gestao-graficos"
     class="guiaSubtitulo">

📈 Gráficos e Indicadores

</div>

<div class="guiaCard">

<p>

Na aba OS, o botão <b>Mostrar Gráfico</b> abre uma área com dois gráficos.
Eles ajudam a acompanhar volume, conclusão e distribuição por responsável.

</p>

<ul>

<li><b>Gráfico de barras/linhas:</b> mostra OS criadas, OS concluídas, taxa de conclusão mensal e taxa acumulada.</li>

<li><b>Gráfico de pizza:</b> mostra quantidade de OS por responsável.</li>

<li><b>Mês atual:</b> recebe destaque visual para facilitar análise do período em andamento.</li>

<li><b>Legendas:</b> ajudam a diferenciar quantidade e percentuais.</li>

<li><b>Tooltip:</b> ao passar o mouse, mostra valores detalhados.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📊 <b>Como interpretar:</b><br>

Se muitas OS foram criadas e poucas concluídas no mesmo período, a taxa mensal cai.
A taxa acumulada mostra a eficiência geral ao longo dos meses e evita analisar apenas um mês isolado.

</div>


<div id="gestao-boas-praticas"
     class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Evite criar cadastros duplicados. Pesquise antes de clicar em <b>+ Novo</b>.</li>

<li>Padronize nomes de empresas, cargos, setores, exames, cursos e EPIs.</li>

<li>Use nomes claros em exames e cursos, pois eles aparecem em vencimentos, anexos e histórico do colaborador.</li>

<li>Antes de excluir um cadastro, confirme se ele não está sendo usado por OS, colaboradores, materiais ou relatórios.</li>

<li>Ao cadastrar empresas, vincule cidades e supervisores para facilitar cadastro e edição de OS.</li>

<li>Ao cadastrar setores, vincule os cargos corretos para manter a estrutura profissional organizada.</li>

<li>Em OS, mantenha status atualizado para que gráficos e resumos reflitam a operação real.</li>

<li>Use o botão <b>Atualizar</b> quando outra pessoa alterar dados ao mesmo tempo.</li>

<li>Conclua ou cancele uma edição antes de iniciar outra, evitando alterações incompletas.</li>

<li>Use o gráfico de OS para identificar acúmulo, gargalos e distribuição por responsável.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

✅ <b>Resumo rápido:</b><br>

Gestão é a tela de manutenção dos cadastros centrais. Ela não substitui os módulos operacionais,
mas garante que eles tenham dados confiáveis para funcionar bem.

</div>

`;

}

function getMateriaisLegacy() {

    return `

<div id="materiais-topo"
     class="guiaTitulo">

📦 Materiais

</div>

<div id="mat-visao-geral"
     class="guiaSubtitulo">

📋 Visão Geral

</div>

<div class="guiaCard">

<p>

A tela Materiais é usada para controlar os materiais vinculados a uma OS, acompanhar quantidades,
separação, compra, fornecedores, cotações e custo estimado ou comprado.

</p>

<p>

Ela reúne o controle operacional da lista de materiais e o controle financeiro básico das cotações.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Antes de incluir materiais, selecione a OS correta no topo da tela. A lista carregada sempre pertence à OS selecionada.

</div>

<div id="mat-os"
     class="guiaSubtitulo">

🧾 Seleção da OS

</div>

<div class="guiaCard">

<ul>

<li>Use o campo <b>Selecione uma OS</b> para carregar a lista de materiais daquela ordem de serviço.</li>

<li>O botão <b>Atualizar</b> recarrega os dados da OS selecionada.</li>

<li>O botão <b>Exportar</b> gera uma planilha da tabela atual de materiais.</li>
<li>A opção <b>PDF</b> gera uma lista completa para conferência, com dados da OS, cabeçalho, materiais e imagens quando o link da imagem permitir carregamento.</li>

<li>Os cards do topo mostram custo total, comprado, estimado, economia e percentual comprado.</li>

</ul>

</div>

<div id="mat-fluxo-listas"
     class="guiaSubtitulo">

🧭 Fluxo das Listas

</div>

<div class="guiaCard">

<p>

A tela Materiais também possui uma visão por listas, organizada em estágios para acompanhar o andamento até a finalização.

</p>

<ul>

<li><b>Orçamento:</b> início da lista quando a necessidade nasce pelo orçamento.</li>
<li><b>Engenharia:</b> revisão técnica, conferência e ajuste dos itens.</li>
<li><b>Estoque:</b> separação dos materiais disponíveis internamente.</li>
<li><b>Compras:</b> cotação, escolha de fornecedor e registro de compra.</li>
<li><b>Finalizado:</b> lista concluída e pronta para histórico/acompanhamento.</li>
<li>Os cards exibem OS, descrição, prioridade, prazo e barra de progresso por material.</li>
<li>É possível avançar, voltar estágio com motivo, duplicar, editar, excluir e consultar histórico da lista.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Criar ou editar lista</h4>

<ul>

<li>Selecione a OS antes de criar uma nova lista.</li>
<li>Informe nome da lista, estágio inicial, prioridade, responsável, prazo ou marque <b>Sem prazo definido</b>.</li>
<li>Use descrição e observação rápida para orientar quem vai receber a lista nos próximos setores.</li>
<li>Listas com prazo acompanham indicadores visuais de vencimento; listas sem prazo usam indicação neutra.</li>

</ul>

</div>

<div id="mat-lista"
     class="guiaSubtitulo">

📦 Lista de Materiais da OS

</div>

<div class="guiaCard">

<p>

A tabela apresenta os materiais vinculados à OS com suas principais informações:

</p>

<ul>

<li><b>ID:</b> identificação interna do item na lista.</li>

<li><b>Material:</b> nome do material e atributos da variação.</li>

<li><b>Categoria:</b> classificação do material.</li>

<li><b>Qtde:</b> quantidade solicitada para a OS.</li>

<li><b>Código e Fabricante:</b> dados técnicos da variação cadastrada.</li>

<li><b>Separação:</b> barra visual com separado, comprado e faltante.</li>

<li><b>Fornecedor:</b> fornecedor selecionado ou botão para cotação.</li>

<li><b>Preço e Total R$:</b> menor preço encontrado e valor escolhido quando houver cotação selecionada.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Ações da lista</h4>

<ul>

<li><b>Novo Material:</b> adiciona uma linha para inserir material na OS.</li>

<li><b>Editar:</b> altera o material ou a quantidade de um item já lançado.</li>

<li><b>Separar item:</b> abre controles de quantidade com botões de diminuir, aumentar, total, salvar e cancelar.</li>
<li>Enquanto o item está em separação, as ações de editar e apagar ficam ocultas para evitar alteração conflitante.</li>

<li><b>Apagar:</b> remove o material da lista da OS.</li>

</ul>

</div>

<div id="mat-cadastro"
     class="guiaSubtitulo">

➕ Cadastro de Material

</div>

<div class="guiaCard">

<p>

O botão <b>Cadastrar Material</b> abre o cadastro completo para criar materiais e variações.

</p>

<ul>

<li>Informe o nome do material e a categoria.</li>

<li>Cadastre código, fabricante e atributos técnicos.</li>

<li>Use os atributos para diferenciar variações do mesmo material, como cor, modelo, bitola, tamanho, tensão, corrente, aplicação e outros.</li>

<li>O sistema mostra variações existentes para evitar duplicidade.</li>

<li>Alguns materiais podem sugerir categoria e atributos automaticamente.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📌 <b>Importante:</b><br>

Material é o cadastro principal. Variação é a combinação de código, fabricante e atributos.
Ao lançar na OS, normalmente é a variação que identifica exatamente o item usado.

</div>

<div id="mat-fornecedores"
     class="guiaSubtitulo">

💰 Fornecedores e Cotações

</div>

<div class="guiaCard">

<p>

Na coluna Fornecedor, o botão de cotação abre os fornecedores cadastrados para aquele material da OS.

</p>

<ul>

<li>Adicione um fornecedor quando ainda não houver cotação.</li>

<li>Informe valor, ICMS, quantidade, prazo, orçamento e observação.</li>

<li>Marque <b>OK</b> quando o material do fornecedor estiver validado.</li>

<li>O sistema calcula valor em reais considerando ICMS, score e comparação entre fornecedores.</li>

<li>É possível selecionar o fornecedor escolhido para refletir no preço da lista principal.</li>
<li>Quando um fornecedor já está selecionado, a própria linha permite desmarcar/deselecionar.</li>
<li>Acima da lista, cards de resumo mostram somente fornecedores selecionados, somando quantidade de materiais e valor total por fornecedor.</li>

<li>Fornecedores podem ser removidos quando a cotação não for mais necessária.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Preço menor e preço escolhido</h4>

<p>

Quando existem cotações, a tela pode mostrar o menor valor encontrado e o valor do fornecedor escolhido.
Isso ajuda a comparar economia, custo estimado e custo comprado.
O menor valor considera o valor final calculado com ICMS, evitando escolher uma cotação aparentemente menor que fique mais cara no total.

</p>

</div>

<div id="mat-status"
     class="guiaSubtitulo">

📊 Status, Resumo e Progresso

</div>

<div class="guiaCard">

<p>

A tela possui indicadores para acompanhar a evolução dos materiais da OS.

</p>

<ul>

<li><b>Itens:</b> quantidade de linhas de materiais.</li>

<li><b>Qtd:</b> soma das quantidades solicitadas.</li>

<li><b>Fornecedores:</b> quantidade de fornecedores vinculados aos materiais.</li>

<li><b>Comprado:</b> quantidade já comprada.</li>

<li><b>Separado:</b> quantidade já separada.</li>

<li><b>Faltante:</b> quantidade ainda pendente.</li>

<li><b>Barra inferior:</b> mostra percentuais de separado, comprado e faltante.</li>
<li>Nas listas e cards de fluxo, o progresso principal considera materiais/itens adicionados, não apenas a soma de quantidades.</li>
<li>Materiais já comprados deixam de aparecer como pendência para separação no Estoque; materiais apenas separados continuam visíveis quando necessário.</li>

</ul>

</div>

<div id="mat-filtros"
     class="guiaSubtitulo">

🔎 Busca e Filtros

</div>

<div class="guiaCard">

<ul>

<li>Use o campo <b>Buscar material</b> para localizar itens por nome, código, atributos ou fabricante.</li>

<li>Use os filtros de status para visualizar <b>Todos</b>, <b>Faltante</b>, <b>Parcial</b>, <b>Separado</b> ou <b>Comprado</b>.</li>

<li>Os filtros atualizam a tabela e os resumos exibidos.</li>

<li>O botão <b>Mostrar imagens</b> exibe ou oculta imagens dos materiais na tabela.</li>

</ul>

</div>

<div id="mat-estoque"
     class="guiaSubtitulo">

📦 Tela Estoque

</div>

<div class="guiaCard">

<p>

A tela Estoque mostra somente listas que chegaram ao estágio de separação. Ela foi criada para facilitar a rotina de quem separa materiais antes da etapa de Compras.

</p>

<ul>

<li><b>Listas pendentes:</b> exibe cards compactos com OS, descrição, prioridade e barra de progresso.</li>
<li><b>Busca:</b> permite localizar por OS, cliente, descrição, material, referência ou fabricante.</li>
<li><b>Filtros:</b> ajudam a visualizar prioridade, ordem das listas e situação dos itens.</li>
<li><b>Lista completa:</b> ao selecionar um card, os materiais aparecem na tabela ao lado/detalhe.</li>
<li><b>Separação:</b> use os botões de quantidade, total, salvar e cancelar para registrar a separação.</li>
<li><b>Enviar para compras:</b> confirma que a etapa do Estoque foi concluída e avança a lista para Compras.</li>
<li>Materiais comprados são abatidos da necessidade do Estoque; se tudo foi comprado, deixam de aparecer como pendência.</li>
<li>Em telas menores e tablets, o layout reduz cards e mantém a tabela com rolagem para facilitar toque nos botões de separação.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Use a tela Estoque para separar o que existe internamente antes de enviar a lista para Compras. Assim, Compras recebe apenas o que ainda precisa ser comprado ou tratado.

</div>

<div id="mat-imagens"
     class="guiaSubtitulo">

🖼️ Imagens dos Materiais

</div>

<div class="guiaCard">

<p>

No cadastro de material, é possível carregar uma imagem para facilitar a identificação visual do item.

</p>

<ul>

<li>Use o botão de carregar imagem dentro do cadastro de material.</li>

<li>A imagem pode ser recortada antes de salvar.</li>

<li>O sistema converte a imagem para WebP para manter o carregamento mais leve.</li>

<li>Quando não há imagem cadastrada, o sistema usa a imagem padrão de material.</li>

</ul>

</div>

<div id="mat-boas-praticas"
     class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Selecione a OS antes de lançar, editar ou exportar materiais.</li>

<li>Cadastre materiais com nomes padronizados para evitar duplicidade.</li>

<li>Use atributos para diferenciar variações parecidas.</li>

<li>Preencha código e fabricante sempre que possível.</li>

<li>Registre cotações com valor, ICMS, quantidade e prazo para melhorar a comparação.</li>

<li>Selecione o fornecedor escolhido quando a compra for definida.</li>

<li>Use os filtros de status para acompanhar pendências de compra e separação.</li>

<li>Exporte a lista quando precisar compartilhar ou arquivar a relação de materiais da OS.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

📦 <b>Resumo:</b><br>

A tela Materiais conecta cadastro técnico, lista da OS, cotações de fornecedores e acompanhamento de compra/separação em uma única visão.

</div>

`;

}

function getChatOnline() {

    return `

<div id="chat-online-topo"
     class="guiaTitulo">

💬 Chat Online

</div>

<div class="guiaCard">

<h4>O que é o Chat Online?</h4>

<p>

O Chat Online é uma ferramenta rápida de comunicação entre usuários conectados ao sistema.
Ele fica integrado ao painel Online, no canto inferior direito da tela, com conversa em Grupo geral e conversa Privada.

</p>

<p>

As mensagens podem ficar salvas somente no navegador do usuário, conforme a preferência configurada.
O histórico local pode ser desativado ou mantido por 5, 10, 15 ou 30 dias.

</p>

</div>

<div id="chat-online-acesso"
     class="guiaSubtitulo">

👥 Como acessar

</div>

<div class="guiaCard">

<ul>

<li>Clique no botão <b>ONLINE</b>, localizado no canto inferior direito.</li>

<li>O painel mostra o <b>Chat</b> à esquerda e os usuários <b>Onlines</b> à direita.</li>

<li>Use <b>Grupo geral</b> para conversar com todos os usuários conectados.</li>

<li>Ao clicar em um usuário da lista Online, o chat muda para <b>Privado</b> com aquele usuário.</li>

<li>Quando o painel estiver minimizado, o botão ONLINE mostra contador de usuários e contador de mensagens não vistas.</li>

</ul>

</div>

<div id="chat-online-mensagens"
     class="guiaSubtitulo">

💬 Envio de mensagens

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">✍️</div>

<div>

<div class="guiaMedalhaTitulo">
Digitar
</div>

<div class="guiaMedalhaDescricao">
Escreva a mensagem no campo inferior do chat. O limite atual é de 300 caracteres.
</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">📨</div>

<div>

<div class="guiaMedalhaTitulo">
Enviar
</div>

<div class="guiaMedalhaDescricao">
No Grupo geral, a mensagem é enviada para todos os usuários conectados.
No Privado, a mensagem é enviada somente para o usuário selecionado.
</div>

</div>

</div>

<div class="guiaMedalha">

<div class="guiaMedalhaIcone">🔔</div>

<div>

<div class="guiaMedalhaTitulo">
Mensagens não lidas
</div>

<div class="guiaMedalhaDescricao">
Quando o chat estiver minimizado, o sistema mostra aviso visual e contador de mensagens não vistas no botão ONLINE.
No privado, o nome de quem chamou também recebe badge e destaque piscando.
</div>

</div>

</div>

<div id="chat-online-mencoes"
     class="guiaSubtitulo">

@ Usuários online e # colaboradores

</div>

<div class="guiaCard">

<p>

Para chamar uma pessoa que está online no momento, digite <b>@</b> e comece a escrever o nome.
O sistema exibe os usuários online disponíveis para menção.

</p>

<p>

Para citar um colaborador cadastrado e liberar o atalho de informações, digite <b>#</b> e comece a escrever o nome.
O sistema exibe os colaboradores cadastrados e insere a referência pelo botão <b>#</b>.

</p>

<p>

Quando alguém menciona seu usuário online com <b>@</b>, o sistema exibe uma notificação visual no painel Online.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Use <b>@</b> para recados direcionados a quem está conectado, como <b>@Andrei</b>.
Use <b>#</b> para vincular um colaborador cadastrado à mensagem, como <b>#Guilherme Augusto Schvaickardt</b>.

</div>

<div id="chat-online-emoticons"
     class="guiaSubtitulo">

🙂 Emoticons

</div>

<div class="guiaCard">

<p>

O botão de emoticons fica ao lado do campo de mensagem.
Ao clicar nele, o sistema abre uma lista rápida de ícones para inserir no texto.

</p>

<ul>

<li>Clique em um emoticon para adicioná-lo na posição atual do cursor.</li>

<li>Use emoticons para respostas rápidas, confirmações e avisos leves.</li>

<li>Depois de enviar a mensagem, o painel de emoticons é fechado automaticamente.</li>

</ul>

</div>

<div id="chat-online-info"
     class="guiaSubtitulo">

📋 Informações do colaborador citado

</div>

<div class="guiaCard">

<p>

Quando uma mensagem contém um colaborador cadastrado citado com <b>#nome completo</b>,
o chat exibe um atalho de <b>Info</b> abaixo da mensagem.

</p>

<p>

Esse botão abre rapidamente as informações do colaborador citado, sem necessidade de procurar manualmente no cadastro.

</p>

</div>

<div class="guiaCard guiaInfo">

📌 <b>Importante:</b><br>

O Chat Online não envia mensagens para WhatsApp e não salva histórico no banco de dados.
O histórico é local, fica somente no navegador do usuário e respeita o prazo configurado nas preferências.

</div>

<div id="chat-online-preferencias"
     class="guiaSubtitulo">

⚙️ Histórico e Preferências

</div>

<div class="guiaCard">

<p>

As preferências do Chat Online ficam no menu de configurações do usuário e são salvas localmente no navegador.

</p>

<ul>

<li><b>Histórico do chat:</b> permite escolher entre desativado, 5 dias, 10 dias, 15 dias ou 30 dias.</li>
<li><b>Limpar histórico do chat agora:</b> apaga as mensagens salvas neste navegador.</li>
<li><b>Silenciar chat global:</b> oculta avisos e contador de novas mensagens do Grupo geral.</li>
<li>O silenciamento do Grupo geral não bloqueia avisos de conversa privada.</li>
<li><b>Aba Notificações:</b> permite habilitar ou desabilitar avisos por categoria, como Programação, Chat online, Alertas importantes e Notificações gerais.</li>
<li>As escolhas de notificações ficam salvas localmente para aquele usuário e dispositivo.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

&#128276; <b>Aprova&ccedil;&otilde;es no sininho:</b><br>
Al&eacute;m de chat e programa&ccedil;&atilde;o, o sininho tamb&eacute;m pode receber solicita&ccedil;&otilde;es de aprova&ccedil;&atilde;o.
No caso de <b>Gestor de Obras</b>, o Gerente de Engenharia recebe uma notifica&ccedil;&atilde;o com o nome do colaborador,
o tipo de altera&ccedil;&atilde;o solicitada e o nome do usu&aacute;rio que fez a solicita&ccedil;&atilde;o.
Essa aprova&ccedil;&atilde;o fica salva para o destinat&aacute;rio e pode ser vista mesmo se ele n&atilde;o estava online na hora.

</div>

<div id="chat-online-boas-praticas"
     class="guiaSubtitulo">

🚀 Boas Práticas

</div>

<div class="guiaCard">

<ul>

<li>Use mensagens curtas e objetivas.</li>

<li>Use <b>@</b> para chamar usuários online.</li>

<li>Use <b>#</b> para citar colaboradores cadastrados e liberar o botão Info.</li>

<li>Use o <b>Privado</b> para conversas direcionadas e o <b>Grupo geral</b> para recados coletivos.</li>

<li>Evite enviar dados sensíveis no chat, pois ele é voltado para comunicação rápida.</li>

<li>Use o botão Info para confirmar dados do colaborador citado.</li>

<li>Atualize a página somente quando não precisar mais do histórico temporário da conversa.</li>

</ul>

</div>

`;

}

function getFAQ() {

    return `

<div id="faq-topo"
     class="guiaTitulo">

❓ Perguntas Frequentes (FAQ)

</div>

<div class="guiaCard">

<h4>👤 Posso excluir um colaborador?</h4>

<p>

Não. Atualmente os colaboradores podem ser desligados, mas não removidos permanentemente do sistema, preservando histórico, programações, documentos e rastreabilidade.

</p>

</div>

<div class="guiaCard">

<h4>👤 Posso reativar um colaborador desligado?</h4>

<p>

Sim. Basta editar o cadastro do colaborador e alterar sua situação para ativo.

</p>

</div>

<div class="guiaCard">

<h4>📸 Existe limite para fotos de perfil?</h4>

<p>

Não há um limite rígido para o usuário. O sistema realiza otimização automática, redimensionamento e conversão para WebP.

</p>

</div>

<div class="guiaCard">

<h4>🩺 O sistema envia alerta automático de vencimento?</h4>

<p>

Atualmente os vencimentos são exibidos através de indicadores visuais no RH, Programação e Perfil do Colaborador.

</p>

</div>

<div class="guiaCard">

<h4>🏭 As integrações são verificadas automaticamente na Programação?</h4>

<p>

Sim. O sistema identifica situações de vencimento e pendências, auxiliando na montagem das equipes.

</p>

</div>

<div class="guiaCard">

<h4>📋 Posso anexar PDFs aos exames, cursos e integrações?</h4>

<p>

Sim. Os documentos podem ser armazenados junto aos respectivos registros para consulta futura.

</p>

</div>

<div class="guiaCard">

<h4>📅 Posso programar equipes para datas futuras?</h4>

<p>

Sim. A Programação foi desenvolvida justamente para o planejamento operacional futuro das equipes.

</p>

</div>

<div class="guiaCard">

<h4>👤 Por que o colaborador n&atilde;o est&aacute; aparecendo na Programa&ccedil;&atilde;o?</h4>

<p>
Quando um colaborador n&atilde;o aparece na lista de dispon&iacute;veis da Programa&ccedil;&atilde;o, verifique estes pontos:
</p>

<ul>
<li><b>Colaborador desligado:</b> colaboradores com status desligado n&atilde;o aparecem para nova programa&ccedil;&atilde;o.</li>
<li><b>J&aacute; est&aacute; em uma OS no mesmo dia:</b> se ele j&aacute; foi alocado em outra OS daquela data, pode deixar de aparecer como dispon&iacute;vel.</li>
<li><b>F&eacute;rias ou afastamento:</b> colaboradores em f&eacute;rias, afastados ou com aus&ecirc;ncia registrada podem ser bloqueados.</li>
<li><b>Exames, cursos ou integra&ccedil;&otilde;es vencidos:</b> pend&ecirc;ncias obrigat&oacute;rias podem impedir ou alertar a aloca&ccedil;&atilde;o.</li>
<li><b>Filtro ativo:</b> filtros por nome, cargo, setor, status, cidade, OS ou busca global podem esconder colaboradores.</li>
<li><b>Data selecionada incorreta:</b> a disponibilidade sempre considera o dia aberto na Programa&ccedil;&atilde;o.</li>
<li><b>Cadastro incompleto:</b> setor, cargo, situa&ccedil;&atilde;o, dados profissionais ou permiss&otilde;es podem afetar a listagem.</li>
<li><b>Conex&atilde;o ou sess&atilde;o:</b> se a sess&atilde;o expirou ou a conex&atilde;o caiu, atualize a tela e entre novamente se solicitado.</li>
</ul>

<p>
Se ap&oacute;s conferir esses pontos o colaborador ainda n&atilde;o aparecer, abra o perfil dele no RH e confira status,
f&eacute;rias, exames, cursos, integra&ccedil;&otilde;es e hist&oacute;rico de programa&ccedil;&otilde;es.
</p>

</div>

<div class="guiaCard" data-roles="99">

<h4>🏅 Quem pode conceder medalhas?</h4>

<p>

Somente usuários autorizados pelo sistema devem realizar a concessão manual de medalhas e conquistas.

</p>

</div>

<div class="guiaCard" data-roles="99">

<h4>🏅 Posso remover uma medalha concedida por engano?</h4>

<p>

Sim. As medalhas podem ser removidas posteriormente caso necessário.

</p>

</div>

<div class="guiaCard" data-roles="99">

<h4>🏅 As medalhas automáticas podem ser editadas?</h4>

<p>

Não. Elas são calculadas automaticamente pelo sistema com base nos dados operacionais cadastrados.

</p>

</div>

<div class="guiaCard">

<h4>🧠 A IA consegue acessar documentos PDF?</h4>

<p>

Atualmente a IA utiliza principalmente informações estruturadas do sistema. A leitura inteligente de documentos poderá ser expandida futuramente.

</p>

</div>

<div class="guiaCard">

<h4>🧠 A IA aprende sozinha?</h4>

<p>

Não. A IA responde com base nas informações cadastradas e nas regras definidas pelo sistema.

</p>

</div>

<div class="guiaCard">

<h4>🧠 A IA pode cometer erros?</h4>

<p>

Sim. Embora utilize os dados disponíveis, recomenda-se sempre validar informações críticas antes da tomada de decisão.

</p>

</div>

<div class="guiaCard">

<h4>📊 Posso exportar relatórios?</h4>

<p>

Alguns módulos já possuem recursos de exportação. Novos relatórios serão adicionados gradativamente.

</p>

</div>

<div class="guiaCard">

<h4>📱 Existe aplicativo para celular?</h4>

<p>

Atualmente o sistema funciona através do navegador, podendo ser utilizado em computadores, tablets e smartphones.

</p>

</div>

<div class="guiaCard">

<h4>📱 Existe aplicativo Android ou iPhone?</h4>

<p>

Ainda não. Esta funcionalidade encontra-se em estudo para versões futuras.

</p>

</div>

<div class="guiaCard">

<h4>🌐 Posso acessar fora da empresa?</h4>

<p>

Sim, desde que possua acesso autorizado ao ambiente onde o sistema está hospedado.

</p>

</div>

<div class="guiaCard">

<h4>🔒 Meus dados estão seguros?</h4>

<p>

O sistema possui controle de acesso por usuário e permissões específicas para proteger as informações cadastradas.

</p>

</div>

<div class="guiaCard">

<h4>📅 Posso sincronizar com Google Agenda?</h4>

<p>

Atualmente não. Esta funcionalidade poderá ser avaliada em versões futuras.

</p>

</div>

<div class="guiaCard">

<h4>📧 O sistema envia e-mails automáticos?</h4>

<p>

Algumas automações poderão ser implementadas futuramente. Atualmente o foco principal é o gerenciamento interno das informações.

</p>

</div>

<div class="guiaCard">

<h4>🚗 Posso controlar veículos da empresa?</h4>

<p>

Atualmente não existe um módulo dedicado para gestão de veículos.

</p>

</div>

<div class="guiaCard" data-roles="99">

<h4>🧰 Posso controlar ferramentas?</h4>

<p>

Sim. O cadastro de colaboradores permite vincular ferramentas e acompanhar sua utilização.

</p>

</div>

<div class="guiaCard">

<h4>🔔 Posso receber notificações automáticas?</h4>

<p>

Sim. O sistema possui notificações no sininho do perfil para avisos como programação lançada, mensagens do chat, menções e alertas importantes.
Nas configurações do usuário, a aba <b>Notificações</b> permite ativar ou desativar categorias específicas.

</p>

</div>

<div class="guiaCard">

<h4>&#128188; Por que o colaborador n&atilde;o apareceu como respons&aacute;vel da OS?</h4>

<p>

Para aparecer no campo <b>Respons&aacute;vel</b> da OS, o colaborador precisa estar liberado como <b>Gestor de Obras</b>.
Quando o RH marca essa op&ccedil;&atilde;o nos Dados Profissionais, a altera&ccedil;&atilde;o fica aguardando aprova&ccedil;&atilde;o do Gerente de Engenharia.
Depois de aprovada pelo sininho, o status &eacute; aplicado no cadastro e o colaborador passa a aparecer na lista de respons&aacute;veis.

</p>

</div>

<div class="guiaCard">

<h4>⚙️ Novas funcionalidades serão adicionadas?</h4>

<p>

Sim. O sistema está em constante evolução e novas funcionalidades são desenvolvidas conforme as necessidades operacionais da empresa.

</p>

</div>

<div class="guiaCard guiaInfo">

💡 <b>Dica:</b><br>

Caso uma funcionalidade não esteja disponível atualmente, registre sua sugestão com a equipe responsável pelo sistema. Muitas melhorias surgem a partir das necessidades dos usuários.

</div>

`;

}



