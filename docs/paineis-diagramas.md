# Painéis elétricos — cadastro e diagramas

A aba apresenta lista compacta, cards, busca e resumo da produção. Novo painel e edição abrem um dialog centralizado. O progresso considera cliente, atuação, mês/ano, tensão, frequência, dimensões, projetista e montador. ART é opcional. Peso e senha não são solicitados no formulário; dados antigos são preservados na edição. Os PDFs continuam públicos e não solicitam senha.

PDF / QR abre a documentação do painel já salvo. Cada envio mantém um registro no histórico, com nome, data, autor, caminho e link público. O limite é 20 MB; extensão, MIME e assinatura PDF são validados no servidor. O QR Code é gerado por solicitação para a URL pública do Supabase, sem acesso ao sistema.

Armazenamento: bucket público existente Paineis, prefixo Painel_Eletrico/diagramas/<id do painel>/. O modelo cria a tabela paineis_eletricos_diagramas na primeira consulta. Usa o cliente Supabase já configurado no servidor, sem novas chaves. Links antigos permanecem consultáveis na janela, mas não são mais solicitados no cadastro.

A exclusão remove primeiro o arquivo na nuvem; só remove o registro após confirmar a operação. O bucket precisa permitir SELECT/DELETE para a credencial usada pelo servidor. Falhas preservam o histórico e mostram o erro. A exclusão de um painel também remove os diagramas antes de excluir o cadastro.

Verificação de armazenamento em 30/10/2026: envio e leitura pública funcionaram. Após liberação da política de exclusão no bucket Paineis, a remoção foi confirmada. O PDF temporário de diagnóstico anterior foi excluído.

Ao excluir um painel, a confirmação informa a remoção irreversível dos PDFs e fotos e a interrupção dos links/QR Codes. O servidor apaga os diagramas, depois as fotos (uma vez por caminho), confirma cada exclusão e só então remove o painel. Se uma operação falhar, o cadastro é mantido. Referências de fotos já removidas são limpas para permitir nova tentativa com os anexos restantes.
