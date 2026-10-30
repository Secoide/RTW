# Auditoria de desempenho das infras — 28/10/2026

Revisão do motor de desenho em public/client/js/infra-eletrica.js e dos fluxos de ferramentas, recortes, vistas frontal/isométrica, seleção, salvamento e exportação. O comportamento das interrupções solicitado nas últimas alterações foi preservado.

## Melhorias aplicadas

- Agrupamento dos arames da vista frontal em um caminho SVG por grupo, preservando a ordem em relação às tampas, peças e suportes. O desenho contém os mesmos segmentos, sem criar um elemento DOM para cada arame.
- Índice espacial dos alvos frontais. A seleção consulta a região do cursor, preservando a prioridade dos alvos e a interpolação do ponto 3D.
- Reutilização da amostragem durante uma renderização e das amostras das rotas visíveis durante a seleção frontal. O cache termina com a operação e é reconstruído após mudanças de geometria.
- Profundidade média das rotas calculada uma vez antes da ordenação frontal.
- Fios do verso das tampas calculados somente quando esse verso precisa ser desenhado. Uma rota única e reta não monta volumes de oclusão contra ela mesma.
- Salvamento local deixa de regravar valores idênticos. Dados alterados, datas e informações do projeto continuam sendo salvos; o cache de escrita só é atualizado após gravação bem-sucedida.

## Comparação antes/depois

Medição na mesma sessão, usando a versão anterior às mudanças desta auditoria e a versão atual. Valores abaixo são medianas de cinco execuções. A planta usa uma calha de 100 m; as vistas usam 30 m, largura de 300 mm, altura de 50 mm e elevação de 4 m. A seleção executa 100 consultas; o salvamento executa 20 chamadas sem mudanças.

| Cenário | Antes | Depois | Redução do tempo |
|---|---:|---:|---:|
| Renderização da planta, 100 m | 24,04 ms | 15,65 ms | 35% |
| Abertura da vista frontal, 30 m | 115,06 ms | 89,01 ms | 23% |
| 100 consultas de seleção frontal | 659,70 ms | 85,89 ms | 87% (7,7 vezes mais rápido) |
| Atualização isométrica, 30 m | 33,93 ms | 27,15 ms | 20% |
| Atualização isométrica com tampa | 108,50 ms | 33,59 ms | 69% (3,2 vezes mais rápido) |

Na vista frontal, os elementos gráficos caíram de **12.621 para 22**. Os segmentos de arame e os alvos selecionáveis permanecem disponíveis.

Em 20 salvamentos sem mudança, as chamadas a localStorage.setItem caíram de **120 para zero**. Essa comparação não significa que projetos alterados deixam de ser gravados.

Os valores brutos estão em infra-desempenho-2026-10-28.json.

## Verificação

**345 testes passaram, sem falhas**, executados com os mesmos casos e assertivas da suíte de infras em um contexto Node/VM. Incluem desenho, conexões, alterações de altura, curvas, derivações, continuidade, recortes individuais, tampas e oclusão, suportes, emendas, vistas, impressão A3/A4, JSON, projetos e armazenamento local.

Os novos testes verificam o número de elementos sem remover arames, equivalência entre seleção indexada e busca completa, invalidação dos caches e durabilidade das gravações alteradas.

## Repetir a medição

Execute na raiz do projeto:

    node tests/infra-performance.cjs --runs=5

O comando mede a versão atual e imprime JSON com as medianas. A linha de base anterior às mudanças está registrada no relatório e no JSON; o comando não restaura versões antigas nem altera desenhos salvos.

### Limites da medição

O benchmark usa o DOM simulado da suíte e mede o motor JavaScript e a quantidade de elementos, não o layout, a pintura ou os FPS de um navegador real. Não usa dados privados de um desenho do usuário. O ganho no navegador varia conforme geometria, quantidade de peças, zoom e hardware; a grande redução de elementos frontais também reduz trabalho que o DOM simulado não mede.
