# Changelog

Todos os formatos de mudanças importantes neste projeto serão documentados neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere à [Versionamento Semântico](https://semver.org/lang/pt-BR/).


## [Não lançado]
## [1.1.1] - 2025-11-10
### Adicionado
- Apague curso, exame, integração utilizando o mouse direito em cima do painel correspondente dentro do formulario do colaborador;
- 

### Alterado
- 

### Corrigido
- Exportar programação para whatsapp, mostrava data de um dia antes;
- Painel de integrações no perfil do Colaborador retornava Null no final da consulta geral das empresas;
- Cores de temas claros nao sendo alterados em algumas partes do programa;
- 
- 
### Removido
- 

### Obsoleto
- 

## [Não lançado]
## [1.1.0] - 2025-11-01
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