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

        colaboradores: getColaboradores(),

        rh: getRH(),

        //cursos: getCursos(),

        //integracoes: getIntegracoes(),

        // maletas: getMaletas(),

        conquistas: getConquistas(),

        ia: getIA(),

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

    📖 Guia Geral RTW

</div>

<div class="guiaCard">

    <h4>Bem-vindo ao Sistema RTW</h4>

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
    são adicionadas ao sistema RTW.

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

Nele é possível cadastrar, editar, consultar e acompanhar toda a trajetória do colaborador dentro da RTW, incluindo documentos, exames, cursos, integrações, EPIs, conquistas, histórico profissional e muito mais.

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

<li>Consultar histórico completo</li>

</ul>

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

</ul>

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

A Programação RTW utiliza uma estrutura hierárquica para organizar as equipes e facilitar a identificação das responsabilidades de cada profissional durante a execução dos serviços.

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