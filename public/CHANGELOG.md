# Changelog

Todos os formatos de mudanças importantes neste projeto serão documentados neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere à [Versionamento Semântico](https://semver.org/lang/pt-BR/).


----- VERSÕES FUTURAS
## [2.6.0] - 2026-05-20
## Nome: 📦 Materiais
### Adicionado
- Adicionado guia geral da tela Materiais.
- Adicionada nova aba 'Materiais' na OS com resumo visual da lista de materiais, progresso/status e atalho para abrir a lista completa na tela de Materiais;
- Adicionado novo menu Estoque com tela própria para separar materiais das listas que chegaram ao estágio de estoque, exibindo pendências por bloco, detalhes dos itens, fotos, quantidades, progresso de separação e envio da lista para compras.

### Alterado

### Corrigido

## [2.5.0] - 2026-05-20
## Nome:  Férias
### Adicionado
- Novo sistema de Férias com calendário visual por colaborador;
- Controle de férias por status: avaliar, aprovado e reprovado;
- Cálculo automático de ciclo aquisitivo, prazo concessivo, saldo usado e dias restantes;
- Tooltip detalhada com informações do período, saldo e limite para gozar férias;
- Menu de clique direito para aprovar, reprovar ou apagar períodos de férias;

### Alterado



## [2.4.0] - 2026-06-16
## Nome: 🛠️ Ferramentas e Complementos
- Adicionado novo menu 'Ferramentas';
- Ferramentas não contratadas podem aparecer bloqueadas com prévia visual;
- Nova ferramenta 'Numeração de Documentos', permitindo gerar, copiar, editar e apagar padrões de nomes para arquivos;
- Nova ferramenta 'Registros Painel Elétrico' com cadastro em banco, edição, exclusão, checklist de produção e upload de imagem do painel montado;
- Checklist visual dos painéis elétricos com etapas de produção e barra de progresso colorida conforme avanço;
- Upload de múltiplas imagens para painéis elétricos, com galeria para visualizar fotos do painel montado;
- Geração de QR Code para links externos dos painéis elétricos;
- Nova aba Complementos no cadastro de OS;
- Complementos da OS agora permitem informar tipo de serviço, observação complementar, PTA alocada e previsão de painel para montar/instalar;
- Integração entre OS e Painéis Elétricos, permitindo vincular painel cadastrado a uma OS;
- Atalho no painel vinculado da OS para abrir diretamente a tela de Ferramentas no painel correspondente;
- Tipo de serviço da OS separado em duas combos: Categoria e Serviço, com serviços filtrados conforme a categoria escolhida;



## [2.3.0] - 2026-07-02
## Nome: 💬 Chat online
### Adicionado
- Widget Online ganhou aba de chat em tempo real, agora usuários conectados conseguem trocar mensagens rápidas pelo sistema;
- Adicionado Chat em Grupo Geral e Chat Privado entre usuários online;
- Mensagens do chat ficam salvas localmente no navegador por até 10 dias (padrão ou pode trocar nas configurações), sem uso de banco de dados;
- Contador indica novas mensagens quando o chat está minimizado, exibindo alerta no botão Online;
- Conversas privadas mostram badge no nome do usuário que enviou mensagem, com destaque piscando até a conversa ser aberta;
- Chat Online mostra aviso visual quando chega nova mensagem com a janela minimizada;
- Chat Online avisa quando o usuário é mencionado com @nome e mensagens com colaboradores citados (#nome) mostram atalhos rápidos de Info;
- Ao digitar @ ou #, o chat já lista automaticamente usuários online ou colaboradores cadastrados;
- Adicionadas opções para limpar o histórico local do Chat Online e silenciar avisos do chat global;
- Adicionadas reações rápidas locais nas mensagens do Chat Online, com opções de curtir, confirmar e visualizar;
- Novo guia de 'Chat Online' no Guia Geral;
- Adicionada exportação em PDF da programação diária, incluindo apenas OS do dia selecionado que possuem colaboradores alocados;
- Nova aba de Notificações nas preferências do perfil, permitindo escolher quais tipos de aviso aparecem no sininho do usuário;
- Adicionada exportação em PDF no RH e no perfil do colaborador, permitindo imprimir resumos gerais e relatórios completos individuais com histórico, anexos operacionais e gráfico de participações;
- Adicionada campo 'Data de admissão', data de entrada na empresa nos Dados Profissionais do colaborador;
- Adicionado responsável da OS na exportação da programação para whatsapp;
- Adicionado botão de ajustes na Programação com opção local para mostrar/ocultar o responsável da OS, mostrar/ocultar aniversariantes e incluir observações automaticamente na exportação da Programação para WhatsApp;
- Novo guia de 'Ordem de Serviço - OS' no Guia Geral;

### Alterado
- Layout do Chat Online ampliado, com área de conversa e lista de usuários online lado a lado;
- Lista Online deixou de exibir o próprio usuário logado;
- Melhorado o painel de notificações do perfil com layout em cards, botão Limpar, contador, horário e melhor visual para notificações vazias;
- Atualizados colunas do banco de dados para usarem a data de entrada no lugar do exame admissional;

### Corrigido
- Ajustado badge de mensagens privadas para aparecer alinhado ao nome de quem chamou;
- Corrigido problema em que colaboradores adicionados por # ou $ podiam aparecer na OS sem terem sido gravados no banco após reconexão do servidor;
- Não avisava quando a OS já estava cadastrada antes de tentar salvar novamente;

### Removido


## [2.2.0] - 2026-05-20
## Nome: 🏅 Conquitas e Experiências
### Adicionado
- Sistema de Conquistas e Medalhas para reconhecimento dos colaboradores;
- Nova aba "Conquistas" no perfil dos colaboradores;
- Cadastro manual de conquistas diretamente pelo perfil;
- Integração das conquistas com o Hall da Experiência;
- Exibição de medalhas automáticas e manuais, sistema de tooltip com descrição das medalhas;
- Adicionado Guia completo de Medalhas e Conquistas;
- Clique com o direito em medalhas manuais do colaborador para mostrar opção para remover medalha;

### Alterado
- Reestruturação visual da pagina Home com novo Hall da Experiência;

### Corrigido

----- VERSAO ATUAL
## [2.1.1] - 2026-08-13
## Nome: 🔨 Ajustes
### Corrigido
- Corrigida OS que continuava marcada como sem colaborador após adicionar um colaborador na programação;
- Corrigido acúmulo de eventos na Programação ao sair e voltar para a tela, reduzindo risco de ações duplicadas, lentidão e alterações repetidas;
- Corrigida a sincronização da Programação ao adicionar ou remover colaboradores da OS, evitando colaboradores presos na tela e ocupação incorreta na lista de disponíveis;



## [2.1.0] - 2026-08-12
## Nome: 📜 PDFs e Notificações
### Adicionado
- Adicionada exportação em PDF da programação diária, incluindo apenas OS do dia selecionado que possuem colaboradores alocados;
- Adicionada exportação em PDF no perfil do colaborador, permitindo seleção de informações antes de gerar o PDF do perfil do colaborador. Imprimir resumos gerais e relatórios completos individuais com histórico, anexos operacionais e gráfico de participações;
- Nova aba de Notificações nas preferências do perfil, permitindo escolher quais tipos de avisos aparecem no sininho do usuário;
- Adicionado responsável da OS na exportação da programação para whatsapp;
- Adicionado botão de ajustes na Programação com opção local para mostrar/ocultar o responsável da OS, mostrar/ocultar aniversariantes e incluir observações automaticamente na exportação da Programação para WhatsApp;
- Novo guia de 'Ordem de Serviço - OS' no Guia Geral;
- Adicionado slide de reconhecimentos de medalhas no painel de conquistas da tela início, alternando colaboradores a cada 30 segundos (Prévia, em teste!);
- Retomada e melhorada a aba 'Estatística' na OS com gráfico de colaboradores por dia, média móvel, resumo da equipe e zoom com movimentação pelo eixo do dia;
- Adicionada campo 'Data de admissão', data de entrada na empresa nos Dados Profissionais do colaborador;
- Adicionado compo 'Gestor de Obras', ao alterar status uma notificação é enviada ao Gerente de Engenharia pelo sininho e sua alteração de responsável de OS é aplicada somente após aprovação, o mesmo pode ser reprovada;

### Alterado
- Lista Online deixou de exibir o próprio usuário logado;
- Melhorado o painel de notificações do perfil com layout em cards, botão Limpar, contador, horário e melhor visual para notificações vazias;
- Atualizados colunas do banco de dados para usarem a data de entrada no lugar do exame admissional;
- Repaginado janela de cadastro e informções das Ordens de Serviço;
- Agora recarregar página volta para a mesma tela que estava trabalhando (ainda reseta dados que esteve preenchendo);
- A exportação da programação pergunta sobre anotações somente quando houver anotações no dia;

### Corrigido
- Corrigido problema em que colaboradores adicionados por # ou $ podiam aparecer na OS sem terem sido gravados no banco após reconexão do servidor;
- Não avisava quando a OS já estava cadastrada antes de tentar salvar novamente;
- Corrigida a segurança das alterações de colaboradores na OS para não mostrar como salvo antes da confirmação do banco e avisar quando a programação precisar ser sincronizada novamente;
- Corrigido o carregamento da edição da OS para manter cidade, empresa, supervisor e responsável preenchidos mesmo com resposta mais lenta do servidor;


### Removido
- Removido painel de avisos da Diretoria da tela início;



## [2.0.0] - 2026-07-01
## Nome: 🎨 Nova Identidade Visual 

### Adicionado
- Tela de login, carregamento, inicio e alguns avisos totalmente renovada;
- Tela carregamento com progresso animado, mensagens inteligentes por etapa;
- Nova mensagem de sessão encerrada agora abre em uma janela personalizada;
- Adicionado o logo como ícone da página nas abas do navegador;
- Aviso de Caps Lock ativado e botão para mostrar senha;
- Novo ícone de consulta de versão no rodapé do menu lateral;
- Adicionado busca global e filtro avançado por OS, cliente, cidade, colaborador, descrição e status na tela 'Programação OS';
- Filtros rápidos para as programação, sendo: prioridade, com equipe, sem equipe e sem responsável;
- Dicas visual para lembrete de teclas rapidas para adicionar colaboradores (líder e terceiros);
- Adicionado busca melhorada e avançada por nome, ID, cargo, setor ou status na tela 'RH';
- Filtros rápidos em chips: Todos, Vencidos, A vencer, Agendados, Férias, Afastados e EPI, alem de Cards rápidos mostrando colaboradores visíveis, pendências e ausências para tabela do RH;
- Um bloco de “leitura rápida” com insight automático para quem está mexendo na tela do RH;
- Menu de perfil redesenhado com visual mais limpo, foto destacada e notificações melhor organizadas;
- Logo configurado como ícone da aba do navegador;
- Adicionado status do banco de dados na tela de login, exibindo separadamente a disponibilidade do servidor e a conexão com o banco;
- Informação de clima no login com temperatura, vento e umidade na tela Login (por enquaanto apenas para Santa Cruz do Sul - RS);
- Se a sessão expirar ou a conexão falhar ao adicionar colaborador na OS, o sistema avisa o usuário e não mostra a alteração como salva sem confirmação;
- Após sessão expirada, a tela retorna automaticamente para o login;
- Adicionada opção Editar Exame e Curso no menu de clique direito da aba Exames e Cursos do colaborador. Criada tabela para editar todos os registros anexados daquele exame/curso. Permitida alteração de data realizada e data de vencimento. Permitida substituição ou remoção do PDF anexado;
- Adicionado controle de vencimento em Exames e Cursos na tela 'Gestão', permitindo marcar quais cadastros vencem e removendo alertas de vencido quando o item estiver configurado como “Sem vencimento”;
- Adicionado novo guia de 'Gestão' no Guia Geral;
- Adicionada janela de configurações no menu perfil, permitindo salvar preferências locais do usuário, como tema, densidade da interface, animações, notificações, abertura automática do chat online e alteração de senha;
- Adicionado aviso de erro quando a programação não conseguir ser finalizada por falha de conexão ou servidor;
- Agora a notificação salva para usuários que não estavam online no momento do lançamento da programação;
- Adicionada busca de terceiros na OS usando $;

### Alterado
- Ajustado o aviso automático de atualização para aparecer na home após o login;
- Atualizado o visual das janelas de anexar Exame e Curso, deixando os forms mais padronizados, organizados e fáceis de usar.
- Guia de Exames Ocupacionais atualizado com a opção Editar Exame;
- Guia de Cursos e Treinamentos atualizado com a opção Editar Exame;
- Ajustado o tempo de inatividade para encerrar a sessão automaticamente após 5 horas sem uso;
- Melhorado o login com recuperação de acesso guiada;
- Agora login permite acesso usando ID do usuário ou e-mail cadastrado;
- Login passou a carregar contexto da empresa vinculada ao usuário;
- Ajustada verificação de RG para ignorar campo vazio;
- Ajustada mensagem da OS para diferenciar falha ao salvar de falha ao atualizar a tela após salvar;
- O status da programação do dia só aparece como finalizado depois que o sistema confirma que salvou;
- Destaque verde da programação lançada permanece visível por no máximo 3 segundos (antes 60 segundos);

### Corrigido
- Ajustada a autenticação por sessão para permitir chamadas seguras da API;
- Atualizar curso abria formulario com lista de exames;
- Corrigida criação de OS que podia salvar parcialmente mesmo com erro;
- Usuário não recebia aviso em alguns momentos quando a sessão expirava;
- Login não bloqueava excesso de tentativas corretamente, mensagem de bloqueio retornava em formato não compatível com o sistema;
- Ações bloqueadas por sessão expirada deixam de falhar sem aviso;
- Central IA não recolhia automaticamente ao abrir o painel Online;
- Logout agora encerra a sessão corretamente, sistema identifica 30 minutos de inatividade; 
- Melhorada a estabilidade da conexão em tempo real, evitando reconexões repetidas, impedindo que o sistema tente reconectar após sair da conta e protegendo as notificações contra mensagens inválidas;
- Cadastro de colaborador retornava erro depois de já ter gravado o CPF;
- Horário de exame agendado no perfil do colaborador não respeitava o horário local cadastrado;
- Destaque verde da programação para não sumia ao trocar de data;

### Removido
- Removido versão na tela Inicial;
- Removido aba de Config/Senha no perfil dos colaboradores;
- Removido a possibilidade de apagar usuario ja cadastrada; (Solicitar suporte)
- Removido temporariamente status de EPI na tabela do RH;
- Removido terceiros disponiveis na programação; 
- Removido botão Registrar/Anexar na tela principal do RH;


## [1.5.0] - 2026-06-08
## Nome: 🧠 Central IA
### Adicionado
- Adicionada a Central IA Operacional (canto inferior direito), integrada em tempo real ao banco de dados corporativo para consultas e análises operacionais;
- Implementada inteligência contextual capaz de interpretar perguntas em linguagem natural sobre colaboradores, empresas, OSs, programações e indicadores de produtividade;
- Adicionados gráficos dinâmicos, perfis inteligentes de colaboradores, alertas operacionais e mecanismos avançados de segurança para proteção de informações sensíveis;
- Adicionado novo menu 'Guia Geral', com Guia completo do sistema de Programação, RH, Colaboradores, IA Operacional e FAQs;

### Alterado
- Implementado salvamento automático de anotações, com gravação imediata ao adicionar ou remover itens, eliminando a necessidade do botão "Salvar";

### Corrigido
- Corrigida a exibição da pré-visualização de anotações, evitando a abertura acidental do tooltip ao passar rapidamente o mouse sobre o ícone;



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

