# Changelog

Todos os formatos de mudanças importantes neste projeto serão documentados neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere à [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.5.0] - 2026-05-11
## Nome: 🧠 Central IA
### Adicionado
- Consulta de colaboradores por OS, histórico operacional e localização atual
- Consulta de colaboradores disponíveis, aniversariantes e serviços programados
- Ranking de produtividade por empresa, período, mês, ano e dia da semana
- Ranking por domingos, sábados e datas específicas
- Interpretação automática de datas, períodos e perguntas operacionais
- Reconhecimento inteligente de empresas e sistema de aliases (PMB, JTI, FEMSA, etc.)
- Agrupamento inteligente de histórico por OS e datas de atuação
- Destaques visuais para métricas, colaboradores e empresas
- Loading inteligente com mensagens dinâmicas e frases operacionais
- Cache inteligente de empresas
- Integração operacional em tempo real com banco de dados


## [1.4.2] - 2025-12-15
## Nome: 📝 Anotações
### Adicionado
- Nova animação na tela de login com exibição de frases motivacionais;
- Ao arrastar um colaborador para uma OS, será exibida uma borda amarela indicando que a ação está sendo salva. Caso a borda permaneça, o colaborador não será exibido no painel da OS, sendo necessário atualizar a página;
- Adicionado indicador de anotações nos painéis diários da aba Programação, exibindo a quantidade de registros vinculados a cada dia;
- Implementado novo modal de gerenciamento de anotações na Programação, permitindo inclusão de múltiplos apontamentos com ícones personalizados e remoção individual antes da gravação;
- Implementado preview inteligente das anotações ao passar o mouse sobre o indicador do dia, possibilitando consulta rápida das informações sem necessidade de abrir o modal completo;

### Alterado
- Melhores efeitos na tela de login para chuva e a noite estrelada;
- Ajustado modo thema dark, paletas de cores aprimoradas;
- Menu do usuario agora fica escondido, até clicar em sua foto;

### Corrigido
<<<<<<< HEAD
- Problema que impedia a exibição da opção de registrar assinatura de EPI;
- Corrigido erro que ocultava o botão de adicionar foto do usuário;
- Falha na geração dos gráficos de estatísticas de funcionários por empresa;
- Corrigido erro no “Modo Foco” que fazia o filtro afetar outros dias/painéis ao invés de atuar somente no dia selecionado.
=======
- Não aparecia opção de registrar assinatura de EPI;
>>>>>>> 8a69d6edba692296e2638daa032332c9e857ce8c

### Removido
- 


## [1.4.1] - 2026-03-10
## Nome: 🔨 Ajustes
### Adicionado
- Adicionado a opção de cancelar exame agendado na aba exames do colaborador;
- Evento climático dinâmico: exibição de chuva no login em dias chuvosos conforme o clima na localização da empresa, com complemento visual de estrelas durante o período noturno (após 19h).

### Alterado
- Adicionar novo Cargo ou Setor, agora nivel é gravado em 0 (alterar após cadastrar);
- Avisos de exames no mural da página inicial passaram a ser agrupados por colaborador e por data/horário, facilitando a visualização quando há múltiplos exames agendados;

### Corrigido
- Sistema não deixava cadastrar cargo;


## [1.4.0] - 2026-03-02
## Nome: 🧩 Integração Operacional e Conectividade do Sistema

### Adicionado
- Implementado novo modelo de visibilidade e bloqueio de páginas e funções, conforme o nível de permissão do usuário;
- Nivel de acesso, agora é classificado pelo mais alto entre o setor e ou seu cargo correspondente;
- Adicionado controle de níveis de permissão/acesso por setor e/ou cargo, permitindo maior segurança e organização das informações;
- Incluídas duas novas abas na página de Gestão: Setor e Cargo;
- Disponibilizado controle completo para adicionar, editar e excluir registros de setores e cargos;
- Implementada a funcionalidade de associação de cargos aos respectivos setores;
- A visibilidade dos colaboradores na programação agora é controlada pela aba Cargos;
- É possível selecionar quais cargos estarão disponíveis na programação. Observação: o colaborador só será exibido após o cadastro do exame admissional;
- Adicionado melhoria no sistema de conexão automatica com o servidor, caso perca conectividade. (Sistema tenta 5 vezes antes de realmente deslogar);
- Novo painel Widget flutuante “ONLINE” com painel expansível exibindo usuários conectados em tempo real;
- Contagem dinâmica e popup temporário ao detectar entrada de novos usuários;
- Novo formulário para adicionar Agendamento de exame na pagina RH, permitindo definir data, horário e observação;
- Implementado novo status "AGENDADO" para exames com data e hora definidas;
- Status 'Agendado' adicionado na tabela do RH, no perfil do colaborador e na visualização de colaboradores disponíveis na programação;
- Assim que um exame é agendado, é gerado um aviso no mural de recados do RH na pagina inicial (some após 2 dias depois da data marcada);
- Quando houver exame agendado na data consultada da programação, o colaborador será destacado com animação em azul. Ao passar o mouse sobre o indicador azul, será exibido o horário do exame agendado;
- Após notificação de programação lançada, o sistema atualiza automaticamente a programação do usuario que recebe o aviso;
- Agora ao gerar a programação do dia, é possível adicionar observações (uma por linha com Enter) e confirmar ou enviar sem observações.

### Alterado
- Atualização da lógica de listas online para detectar novos usuários;
- Nova hierarquia de prioridade dos exames, considerando VENCIDO sem agendamento como prioridade máxima;
- Ajustada lógica SQL para considerar múltiplos exames por colaborador mantendo a criticidade;

### Corrigido
- Dia de aniversario e atestados mostravam um dia a menos do que era salvo;
- Alterar foto não atualiza corretamente nova versão da imagem;
- Ao arrastar um colaborador disponível e soltá-lo fora de uma OS, ele permanecia com aparência de selecionado;
- Salvar dados profissional do colaborador, nao atualizava tabela do RH automaticamente;
- Botão salvar ficava visivel na hora de cadastrar colaborador;
- Sistema nao havisava quando perdia conexão com o servidor;

### Removido
- Informação de onlines na página da programação;


## [1.3.1] - 2025-12-15
## Nome: 🔨 Ajustes
### Adicionado
- Adicionado resumo para NR-33 nos icones da tabela RH;
- Visibilidade e bloqueio para mais paginas e funções conforme nível de permissão do usuário;

### Alterado
- Aumentado numero de dias para verificar proximos anivesariantes;

### Removido
- Sistema de inatividade removido para melhorias;


## [1.3.0] - 2025-12-15
## Nome: 🔐 Login e Senhas
### Adicionado
- Indicador de nível de senha para Nova senha ao alterar;
- Aviso de atenção quando a senha antiga está incorreta ou a confirmação da nova senha não confere;
- Agora é possível recuperar sua senha esquecida, o colaborador deve possuir e-mail cadastrado no perfil. Clique no link 'Esqueci minha senha' na página de Login e será solicitado seu e-mail cadastrado e, em seguida, enviado um link com token de 10 minutos para alterar sua senha;
- Somente o próprio usuário pode alterar sua senha;
- Clique no link 'Não consigo acessar minha conta' na página de Login para verificar informações;
- Indicativo visual no campo de dados obrigatório a ser preenchido no formulário do Colaborador;
- Necessário preencher o campo de e-mail ao cadastrar novo ou editar dados do colaborador;
- Novo atestado, 'Licença Maternidade', com novo visual de cor;
- Novos cargos adicionados (Supervisor de Manutenção Elétrica, Supervisor de Manutenção II, Técnico de Segurança e Auxiliar Fiscal);
- Upload de fotos melhorado, converte imagens mais pesadas para arquivos web, aceita formato WEBP;
- Botão para Atualizar tabela RH;
- Incluída a opção de seleção do responsável durante a edição das Ordens de Serviço, garantindo maior controle e precisão das informações;
- Botão para exclusão de conta de usuário. Apenas os setores de RH e Diretoria possuem permissão para excluir contas. O próprio usuário não pode realizar sua exclusão. Atenção: esta ação é irreversível e pode ocorrer erros se ja estiver seu ID em outros processos;
- Animações (algumas raras) e detalhes visuais em datas comemorativas;
- Clique na versao atual na tela de login para verificar novamente as atualizações da versão atual;

### Alterado
- Aviso de dados editados do colaborador melhorado (janela de 3 segundos);
- Agora será necessário adicionar Exame Admissional com a data corret, além do Cargo e Setor para o colaborador aparecer na organização da programação;
- Botões de registrar e anexar na pagina RH ficou agrupado em um unico botão;
- A edição de Supervisor e Cidade na aba OS (página Gestão) passou a depender exclusivamente das associações configuradas na Empresa vinculada;
- Varios pequenos ajustes visuais;
- Alerta laranja de exame prestes a vencer fica piscando na pagina da programação;
- Adicionado animação de alerta para cursos a vencer. (Vencido agora apenas fica vermelho);

### Corrigido
- Sistema nao deslogava corretamente e mantinha dados do login anterior;
- Era possivel acessar outros links de pagina do sistema mesmo nao logado;
- Cookies nao aplicados corretamente apos login;
- Alerta de erro ao tentar atualizar dados sem CPF;
- Não era possível alterar senha;
- Nível de cargo (diretor) não conseguia apagar comunicados de qualquer outro usuário;
- Ajustes visuais de dimensionamento de tela;
- Sugestão de provedor de e-mail não era visível corretamente na hora de cadastrar colaborador;
- Sistema lento em pontos com imagens. Otimizadas várias partes específicas;
- Editar Estado não salvava no cadastro da cidade correspondente;
- Mantido automaticamente o filtro de busca ativo após salvar, editar ou remover registros nas telas de cadastro;
- Mantido automaticamente o filtro de busca ativo após alterações na tabela do RH;
- Nos painéis de exames, integração e cursos, não era possível rolar a tela para visualizar todos os painéis disponíveis.

### Removido
- Botão de anexar integração;
- Botão desligar colaborador na aba Atestar;

## [1.2.4] - 2025-11-20
## Nome: ✍🏻 Assinatura Digital 
### Adicionado
- Assinatura de EPIs entregues com assinatura digital via link (Em teste);
- Indicador “PDF” no painel de exames/cursos informando documento anexado;
- Novas informações na página de início;
- Painel indicativo de aniversariantes do mês e próximos aniversários;
- Mural de informações separado por categorias: Avisos do RH, Treinamentos Futuros, Comunicados da Diretoria e Avisos de Segurança.

### Alterado
- Pequenas alterações visuais e de enquadramento no formulário do Colaborador.

### Corrigido
- Arquivos anexados (PDFs e fotos) deixavam de existir após atualização do sistema;
- Mini ícone às vezes não abria a aba correta do colaborador;
- Vários pequenos bugs.

### Removido
- *(Nenhum item removido nesta versão)*

### Obsoleto
- *(Nenhum item marcado como obsoleto nesta versão)*


## [1.1.1] - 2025-11-10
## Nome: 🔐 Ajustes 
### Adicionado
- Apague curso, exame, integração utilizando o mouse direito em cima do painel correspondente dentro do formulario do colaborador;

### Corrigido
- Exportar programação para whatsapp, mostrava data de um dia antes;
- Painel de integrações no perfil do Colaborador retornava Null no final da consulta geral das empresas;
- Cores de temas claros nao sendo alterados em algumas partes do programa;

### Removido
- 

### Obsoleto
- 


## [1.1.0] - 2025-11-01
## Nome: 🔐 Inicio
### Adicionado
- Colaborador pode ser selecionado como supervisor de uma OS em uma data especifica, clique com o botão direito do mouse em cima do colaborador no painel da OS e defina como colaborador.
- Colaborador da empresa somente sera visivel no Painel de colaboradores dispponiveis na sua data de Admissão e até o momento de sua Demissão, caso houver.
- Agora o circulo ao lado esquerdo do nome do colaborador ira definir o seu status para alguns parametros, sendo eles: Verde = Documentos (exames e treinamentos) em dia; Amarelo = Algum documento a vencer; Vermelho = Algum documento vencido; Branco = Documento pendente.
- Clique com o botão direto em cima do colaborador e escolha para abrir o Perfil e carregar os dados;
- Usuario sem conexão com o servidor por 3 minutos, sera desconectado automaticamente;
- Para proteção dos dados, se o usuario ficar mais de 10 minutos inativo, sera desconectado automaticamente;
- Nova aba Dados Profissional no perfil Colaboradores, adicione categoria de CNH, setor e cargo na empresa;
- Nova aba Exames no perfil Colaboradores, agora é possivel observar cada exame realizado ao colaborador, motrando ainda o prazo a vencer;
- Nova aba EPI no Perfil colaboradores, agora é possivel rapidamente quais os EPIS entregues e se esta tudo OK;
- Formulario para cadastrar Empresa, Supervisor e Cidade;
- Selecionar Supervisor mostra os contatos (telfone e e-mail) cadastrados;
- Nova tela para o RH, visulização unica de todos os colaboradores, visualizando facilmente suas informações principais sobre Exames em dia, EPIs entregues, Integrações e Cursos Realizados;
- Nova aba Cursos no perfil Colaboradores, observe cada curso realizado ao colaborador, motrando ainda o prazo a vencer;
- Conforme Setor anexado ao usuario, o mesmo ira ter acessos diferentes para as telas e funções;
- Nova aba Status nas informações da OS, agora é possivel trocar o status, alem disto uma tag é visualmente adiciona para cada painel de OS na programção, podemos ser logo vista seu status: sendo a tag nas cores: branco = sem responsavel, laranja = Aguardando, vermelho = Parada, Azul = Em Execução, Amarelo = Em espera e Preto = Cancelado.
- Nova tela Gestão: analise todos os dados de cadatros geriais (EPI, Exames, Cursos, Empresa, Supervisor, Cidade). Adicione, edite ou apaga os registros em um unico local;
- Clique com o botão direito para visualizar integração (caso colaborador esteja com sinal de atenção ou vencido);
- Aba exclusiva de OS para visualizar, editar e apagar. Com Integração de gráficos e contadores de status (Tela Gestão);


### Alterado
- Agora é possivel selecionar multiplos dias para transferir os colaboradores das OSs para datas selecionadas;
- Ao selecionar empresa no cadastro de OS, se ja tiver supervisor e cidade interligadas, sera automaticamente preenchidas os respectivos campos abaixo;
- Ao selecionar Dia, datas anteriores da atual irá mostrar apenas as OS com os colaboradores alocados (aumento do desempenho do precesso entre servidor);
- Ao mudar status da programação, os usuarios conectados irão atualizar a programação automaticamente;

### Corrigido
- Nome do usuario online duplicado na tela principal;
- Ação do Botao de Filtrar prioridade Alta e Modo Foco  afetavam outros dias do painel, e nao somente o correspondente;
- Colaborador com Afastamento, Atestado, Paternidade ainda era possivel adicionar em uma OS;
- Data de aniverario e datas atestadas (ferias, atestado,...) buscando e visualizando um dia anterior;
- 

### Removido
- Clicar duas vezes em cima do nome do colaborador disponivel;
- Fixar OS;

### Obsoleto
- 


## [1.0.0] - 2025-07-01
### Adicionado
- Lançamento inicial do programa

