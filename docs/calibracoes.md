# Controle de calibrações

A terceira aba de Ferramentas reúne equipamentos, vencimentos, histórico de calibrações e certificados PDF. O catálogo do dono inclui **Calibrações** como ferramenta contratável (`tool.calibracoes`); o painel sincroniza o catálogo automaticamente caso a opção ainda não exista. Selecione a empresa e salve seus acessos. Sessões já abertas precisam entrar novamente para atualizar os recursos contratados.

## Dados e importação

As tabelas MySQL `calibracao_equipamentos` e `calibracao_certificados` são criadas na primeira consulta, seguindo o padrão das demais ferramentas. O usuário de banco precisa de permissão de criação de tabelas. Cada empresa SaaS possui seu próprio escopo; o ambiente interno usa escopo zero. Todas as operações autenticadas verificam a contratação e o escopo.

O botão **Importar planilha de referência**, disponível no ambiente RTW, importa os 21 equipamentos enviados nesta solicitação. A carga é transacional e identifica cada linha da origem para evitar duplicações. Preserva séries com zeros à esquerda, campos vazios e datas. A validade sugerida é um ano civil após a calibração (29/02 passa para 28/02 no ano seguinte), mas o vencimento pode ser editado no formulário do certificado. O cadastro de equipamento não solicita datas nem cria histórico de calibração. A calibração e o vencimento são informados somente ao anexar um certificado. Ao preencher a calibração, o vencimento recebe um ano a mais e continua editável. As colunas auxiliares de fabricante e código são associadas pelo modelo/nome. Nenhum certificado é inventado: cada data importada começa como registro sem PDF. A planilha original não é alterada. O cadastro e os registros importados ficam editáveis na aplicação; um equipamento pode ser arquivado sem perder seu histórico.

## PDFs e acesso do cliente

Os novos PDFs utilizam o bucket público **calibracoes** (minúsculo), criado pelo usuário. A variável opcional SUPABASE_CALIBRACOES_BUCKET permite indicar outro bucket público existente. O código não tenta criar buckets nem exige permissão para consultar sua configuração. Utiliza SUPABASE_URL e a chave configurada no servidor; o Supabase continua validando as permissões reais de upload e exclusão dessa chave. Ser público libera a leitura, mas não concede automaticamente direitos de escrita.

Os PDFs têm limite de 20 MB e validação de extensão, MIME e cabeçalho. Cada envio grava um caminho novo, o bucket de origem e a URL pública, sem substituir certificados anteriores. Também é possível cadastrar um link HTTPS de um PDF já hospedado. O link público e o QR Code dos novos uploads apontam diretamente para o PDF no Supabase, funcionando fora da máquina de desenvolvimento. Acesso de cliente ao PDF não permite editar os dados do equipamento no ConnectPear; o navegador pode permitir salvar o arquivo.

URLs públicas não expiram e não podem ser revogadas pelo ConnectPear. A interface informa essa condição e não oferece revogação para esses uploads. Para tirar um documento público do ar, é necessário removê-lo do armazenamento. A exclusão pela aplicação exige que o Supabase confirme a remoção; caso contrário, o histórico é preservado e o motivo é informado. Registros antigos sem URL pública continuam compatíveis com acesso assinado e link individual do ConnectPear.

O QR Code usa o mesmo serviço de imagem dos painéis elétricos (api.qrserver.com), que recebe a URL compartilhável.

## Validação

`node --test tests/calibracoes.test.cjs` cobre origem, datas e vencimentos, histórico, validação de PDF, escopo, contratação, upload com falhas, links e revogação, transação de cadastro e sincronização do catálogo do dono. Os testes automatizados de nuvem e banco utilizam dependências simuladas. Também foi realizado um teste real com um PDF temporário sem dados de equipamentos no bucket público: upload e leitura retornaram HTTP 200. A tentativa de exclusão retornou lista vazia e o arquivo continuou acessível. A chave atual não confirma exclusões; o arquivo temporário deve ser removido pelo painel do Supabase: diagnosticos/f9931613-34ba-436d-9915-4a7b0e9bb7bf.pdf.

O navegador isolado validou os 21 cards, seleção, filtros, inclusão de certificado, acesso ao link/QR, cadastro e escape de HTML, além do layout em 1440 px e 700 px. O envio completo pelo formulário, incluindo a persistência do histórico, utiliza a sessão autenticada e a estrutura de banco existente.

## Temas e avisos de vencimento

As três abas de Ferramentas seguem o tema claro, escuro ou do sistema definido nas preferências existentes. Os destaques usam os azuis #2263ee e #3498f1 do login, com superfícies compactas e sem sombras.

O servidor verifica as calibrações ao iniciar e a cada 15 minutos, além da consulta do sininho. Os destinatários são colaboradores ativos cujo cargo pertence ao setor Engenharia e cujo ambiente possui a ferramenta contratada. Cada pessoa recebe somente os equipamentos do seu escopo. A verificação usa o calendário de America/Sao_Paulo e a calibração mais recente cuja data já chegou.

Os marcos são até 30 dias, até 15 dias e o dia do vencimento. Se o servidor esteve desligado ou o equipamento foi cadastrado depois de um marco, gera somente o aviso do estágio atual. Não dispara os três de uma vez. Cada usuário recebe no máximo um aviso por equipamento, data de calibração e marco; ler/limpar o aviso não o recria. A tabela calibracao_alertas registra essa deduplicação na mesma transação da notificação. Quando o prazo avança, a calibração é renovada ou o equipamento é arquivado, os avisos anteriores deixam de ficar ativos. Adicionar um PDF à mesma data de calibração não reinicia o ciclo de alertas.

Em Configurações locais → Preferências do usuário → Notificações existe a opção **Notificações de calibrações**. É habilitada por padrão e salva localmente por usuário/navegador, de forma independente de Alertas importantes. Desativar retira os avisos de calibração da lista e do contador locais, sem mudar as preferências dos colegas nem apagar os registros do servidor. Ao ativar novamente, os avisos ainda não lidos são consultados outra vez.

Testes adicionais: node --test tests/calibracoes-alertas.test.cjs cobre prazos, calendário, contratação, Engenharia, cache, execução periódica, transações e preferências. A validação visual isolada conferiu as três abas nos dois temas e em telas menores. Os testes não enviam avisos reais a colaboradores.

## Exclusão por usuários da ferramenta

Todos os usuários autenticados com acesso a Calibrações podem excluir certificados da sua própria empresa pelo botão Excluir certificado. Não exige Admin 999 ou cargo de administrador. O acesso é conferido pelo backend antes de consultar ou apagar o arquivo. Clientes que abrem somente o link público não recebem esse acesso de exclusão.

A ferramenta reutiliza o mesmo cliente de src/server/config/supabase.js e a variável SUPABASE_SERVICE_ROLE_KEY já usados por Exames e Cursos. Não exige uma variável adicional nem bloqueia a operação pelo tipo da chave: a autorização efetiva é verificada pelo Supabase. O novo bucket calibracoes precisa de políticas SELECT e DELETE compatíveis com a chave configurada, assim como os demais buckets.

Se o Supabase não confirmar a remoção do PDF, a API informa a necessidade de verificar as políticas do bucket e preserva o histórico. Após a confirmação, o registro é excluído. PDFs cadastrados apenas por link externo não são apagados do provedor de origem.

## Referência gráfica mensal

Abaixo dos cards há um calendário compacto de janeiro a dezembro, com seleção de ano e uma linha por equipamento. Usa o mês da última calibração aplicável ao ano escolhido e o mês do vencimento registrado. Um certificado de ano posterior não oculta o registro histórico do ano consultado. Períodos que atravessam dezembro são recortados ao ano selecionado, com setas indicando continuidade no ano anterior ou seguinte. O círculo marca a calibração e o losango marca o vencimento.

As linhas ficam agrupadas por fabricante/modelo, acompanham os filtros dos cards e podem ser clicadas para abrir o histórico do equipamento. O rodapé do gráfico conta os vencimentos por mês. Equipamentos sem certificado e períodos fora do ano escolhido são identificados explicitamente. O gráfico serve como referência para planejar futuras calibrações e não altera as datas cadastradas.

Cards com vencimento em até 30 dias recebem borda esquerda laranja; calibrações vencidas recebem contorno vermelho completo. Esses indicadores permanecem nos temas claro e escuro, inclusive quando o card está selecionado.

O vencimento manual é persistido no certificado e utilizado pelos cards, histórico, calendário e alertas de 30 dias, 15 dias e vencimento. Datas anteriores à calibração são rejeitadas. Registros sem vencimento informado mantêm o padrão de um ano para compatibilidade. Uma nova data de calibração no formulário recalcula a sugestão; alterações nos outros campos preservam o vencimento manual.


## Tour guiado

O botão (?) no cabeçalho abre um tour de uso da aba, com cadastro, certificados, vencimentos, histórico, links e QR Code, calendário e notificações. O primeiro acesso inicia o tour automaticamente; a preferência é registrada por usuário e empresa neste navegador.

Os formulários são exibidos como prévias durante o tour e não salvam ou enviam dados. Ao concluir ou sair, a seleção, os filtros e os rascunhos anteriores são restaurados. A lista vazia utiliza exemplos temporários, removidos ao finalizar. O tour pode ser repetido pelo botão (?) e fechado pelo botão de fechar ou Esc.
