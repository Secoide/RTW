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

<li>Histórico profissional</li>

</ul>

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



<!--
<div data-roles="99">
<div id="colab-conquistas" class="guiaSubtitulo" >
🏅 Conquistas e Medalhas
</div>
<div class="guiaCard">
<p>
Sistema de reconhecimento interno utilizado para valorizar experiências, desempenho e contribuições dos colaboradores.
</p>
</div>
<div class="guiaCard">
<ul>
<li>Conquistas manuais</li>
<li>Conquistas automáticas</li>
<li>Reconhecimentos de segurança</li>
<li>Reconhecimentos de liderança</li>
<li>Reconhecimentos operacionais</li>
<li>Histórico de medalhas</li>
</ul>
</div>
<div class="guiaCard guiaInfo">
🏆 Todas as medalhas e conquistas são exibidas no Hall da Experiência RTW.
</div>
</div>
-->

<div id="colab-estatisticas" class="guiaSubtitulo">
📊 Estatísticas Profissionais
</div>

<div class="guiaCard">

<p>

Painel dedicado ao histórico operacional e experiência acumulada do colaborador.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Clientes atendidos</li>

<li>Participações em projetos</li>

<li>Experiência operacional</li>

<li>Histórico por empresa</li>

<li>Indicadores profissionais</li>

</ul>

</div>
<!--
<div data-roles="99">
<div id="colab-ferramentas" class="guiaSubtitulo">
🧰 Ferramentas
</div>

<div class="guiaCard">

<p>

Controle patrimonial das ferramentas vinculadas ao colaborador.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Maleta virtual</li>

<li>Histórico de entregas</li>

<li>Controle de devoluções</li>

<li>Vistorias</li>

<li>Status dos equipamentos</li>

</ul>

</div>

<div class="guiaCard">

<p>

Exemplos de ferramentas controladas:

</p>

<ul>

<li>Multímetro</li>

<li>Alicates</li>

<li>Chaves</li>

<li>Serrinhas</li>

<li>Ferramentas especiais</li>

</ul>

</div>
</div> -->
<div id="colab-seguranca" class="guiaSubtitulo">
🔐 Segurança e Acesso
</div>

<div class="guiaCard">

<p>

Cada colaborador possui acesso individual ao sistema.

</p>

</div>

<div class="guiaCard">

<ul>

<li>Alteração de senha</li>

<li>Controle de permissões</li>

<li>Validação de acesso</li>

<li>Configurações pessoais</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

🔒 Determinadas funções administrativas são restritas a perfis autorizados pelo sistema.

</div>

<div id="colab-boas-praticas" class="guiaSubtitulo">
🚀 Boas Práticas
</div>

<div class="guiaCard">

<ul>

<li>Mantenha os dados cadastrais atualizados.</li>

<li>Atualize fotos sempre que necessário.</li>

<li>Anexe documentos oficiais sempre que possível.</li>

<li>Controle exames antes dos vencimentos.</li>

<li>Mantenha cursos e integrações atualizados.</li>

<li>Registre afastamentos imediatamente.</li>

<li>Utilize o sistema de conquistas para reconhecer colaboradores.</li>

<li>Revise periodicamente EPIs e ferramentas vinculadas.</li>

</ul>

</div>

<div class="guiaCard guiaInfo">

👤 O Cadastro de Colaboradores é a base de informações utilizada por praticamente todos os módulos da plataforma RTW, incluindo RH, Programação, Hall da Experiência e Central IA.

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
<div data-roles="99">
    <div id="prog-complementos" class="guiaSubtitulo">
    🧩 Complementos da OS
    </div>
    <div class="guiaCard">
    <p>
    A aba <b>Complementos</b> do formulário da OS registra informações adicionais que ajudam a organizar melhor o serviço antes da execução.
    Ela não substitui a programação principal; ela complementa a OS com detalhes úteis para análise, preparação e integração com outras telas.
    </p>
    <ul>
    <li><b>Categoria:</b> separa o tipo geral do serviço, como Instalação, Manutenção, SPDA, Engenharia, Solar, Automação, Incêndio ou Telecom.</li>
    <li><b>Serviço:</b> mostra opções filtradas conforme a categoria selecionada.</li>
    <li><b>Mais de um serviço:</b> a OS pode receber vários serviços, exibidos em cards com largura padronizada.</li>
    <li><b>Remover serviço:</b> cada card possui um botão para retirar o serviço quando necessário.</li>
    <li><b>PTA alocada:</b> indica que a execução exige PTA, mantendo essa informação separada dos painéis elétricos.</li>
    <li><b>Painel para montar/instalar:</b> sinaliza que a OS terá painel elétrico relacionado.</li>
    <li><b>Observação complementar:</b> registra detalhes rápidos que ajudam no entendimento operacional da OS.</li>
    </ul>
    </div>
    <div class="guiaCard guiaInfo">
    📌 <b>Importante:</b><br>
    Quando a OS já possui número salvo, a aba permite vincular painéis elétricos cadastrados na tela Ferramentas.
    O painel vinculado aparece com número de série e atuação, permitindo abrir os detalhes rapidamente.
    </div>
    <div class="guiaCard">
    <h4>Ícones no card da OS</h4>
    <p>
    Quando a OS possui informações importantes em Complementos, a Programação mostra ícones pequenos no rodapé do card,
    ao lado do total de colaboradores. Esses ícones ajudam a identificar rapidamente necessidades especiais sem abrir o formulário da OS.
    </p>
    <ul>
    <li><b>🚚 PTA:</b> indica que a OS possui PTA alocada ou prevista para execução.</li>
    <li><b>⚡ Painel:</b> indica que a OS possui painel elétrico previsto para montar ou instalar.</li>
    <li>Os ícones aparecem somente quando as opções correspondentes estiverem marcadas na aba Complementos da OS.</li>
    <li>Use essa indicação para conferir rapidamente recursos críticos antes de liberar ou acompanhar a programação do dia.</li>
    </ul>
    </div>
</div>


<div  data-roles="99">
    <div id="prog-materiais-os" class="guiaSubtitulo">
    📦 Materiais da OS
    </div>
    <div class="guiaCard">
    <p>
    A aba <b>Materiais</b> da OS resume as listas de materiais vinculadas à ordem de serviço, usando os dados da tela Lista de Materiais.
    Ela foi criada para o usuário acompanhar o andamento sem precisar sair do perfil da OS.
    </p>
    <ul>
    <li>Exibe as listas vinculadas à OS selecionada.</li>
    <li>Mostra número da lista, descrição, quantidade de itens e quantidade total.</li>
    <li>Apresenta o progresso no mesmo padrão visual usado nos painéis elétricos.</li>
    <li>Indica quantidades compradas, separadas e faltantes.</li>
    <li>Mostra o status atual da lista, como pendente, comprando, separado ou concluído.</li>
    <li>Ao clicar na lista, o sistema direciona para a tela Materiais com a lista completa carregada.</li>
    </ul>
    </div>
    <div class="guiaCard guiaInfo">
    💡 <b>Dica:</b><br>
    Use essa aba para conferir rapidamente se os materiais da OS estão avançando junto com a programação.
    Quando houver divergência entre execução e material, abra a lista completa para ajustar compras, separação ou pendências.
    </div>
</div>
-->


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

O sistema calcula os ciclos a partir da data de admissão do colaborador.
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

function getMateriais() {

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

<li>Os cards do topo mostram custo total, comprado, estimado, economia e percentual comprado.</li>

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

<li><b>Separar item:</b> registra controle de separação do material.</li>

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

<li>O sistema calcula valor em reais, score e comparação entre fornecedores.</li>

<li>É possível selecionar o fornecedor escolhido para refletir no preço da lista principal.</li>

<li>Fornecedores podem ser removidos quando a cotação não for mais necessária.</li>

</ul>

</div>

<div class="guiaCard">

<h4>Preço menor e preço escolhido</h4>

<p>

Quando existem cotações, a tela pode mostrar o menor valor encontrado e o valor do fornecedor escolhido.
Isso ajuda a comparar economia, custo estimado e custo comprado.

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
Ele fica integrado ao painel Online, no canto inferior direito da tela.

</p>

<p>

As mensagens são temporárias e permanecem disponíveis somente durante a sessão aberta da página.
Ao atualizar ou fechar a página, o histórico local do chat não é mantido.

</p>

</div>

<div id="chat-online-acesso"
     class="guiaSubtitulo">

👥 Como acessar

</div>

<div class="guiaCard">

<ul>

<li>Clique no botão <b>ONLINE</b>, localizado no canto inferior direito.</li>

<li>A aba <b>Online</b> mostra os usuários conectados no momento.</li>

<li>A aba <b>Chat</b> abre a conversa rápida entre os usuários online.</li>

<li>Ao clicar em um usuário da lista Online, o chat abre com o nome dele já preparado para menção.</li>

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
Clique em Enviar para compartilhar a mensagem com os usuários conectados.
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
Quando o chat estiver fechado ou em outra aba, o contador da aba Chat indica mensagens recebidas.
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

O Chat Online não envia mensagens para WhatsApp e não salva histórico permanente.
Ele serve para comunicação interna rápida enquanto a página estiver aberta.

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

Ainda não. O acompanhamento é realizado através dos indicadores visuais dos módulos.

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
