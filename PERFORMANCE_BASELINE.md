# Baseline de performance — Fase 26.5

Medição sem PII: sem nomes, telefones, produtos reais, valores reais ou conteúdo de planilha.

## Método

- **Antes:** grafo de chamadas do código da Fase 26 (`google.script.run` serializado).
- **Depois:** mesmas telas com APIs agregadas, lazy load e `createSale.screen`.
- **Tempo Google estimado:** 400–600 ms por `google.script.run` (ida e volta + cold start). Sete chamadas em série para abrir Vendas ≈ 2,8–4,2 s — alinhado ao atraso de ~4 s relatado.
- **Local (FakeAppApi):** tempo de rede ≈ 0; o que importa é a **quantidade de chamadas**.
- Instrumentação DEV/E2E: `window.__cantinaPerf` (browser) e `Logger.log PERF …` (Apps Script, fora de PROD). Campos: `totalMs`, `sheetReads`, `sheetWrites`, `lockWaitMs`. Sem payload.

Não usar estes milissegundos como assert de CI.

## Chamadas de servidor por fluxo

| Fluxo                                                        |                                               Antes |                                                 Depois |                                                                                                                           Chamadas servidor antes |                                                          depois |
| ------------------------------------------------------------ | --------------------------------------------------: | -----------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------: |
| Login + dashboard (área Vendas)                              |   ~4 s só em Vendas; login carregava todas as áreas |                                   1 round trip da tela |                                                                                                                              login + ~30–40 loads |                        `loginE2E` + `getSaleScreenData` = **2** |
| Abrir venda (já logado, clicar Vendas)                       |                                          ~2,8–4,2 s |                     0 se já carregada; senão 1 chamada | **7** (`listProducts`, `listStudents`, `listSales`, `getPixCopyText`, `getDueDateShortcuts`, `listSiblingAuthorizations`, `getReservationsSetup`) |                            **0** ou **1** (`getSaleScreenData`) |
| Pesquisar aluno                                              |     local no select; reserva já filtrava no cliente |                                                  local |                                                                                                                                             **0** |                                                           **0** |
| Selecionar produto / quantidade / pagamento / filtro / modal |                             já era local na maioria |                                                  local |                                                                                                                                             **0** |                                                           **0** |
| Adicionar produto ao carrinho                                |                                               local |                                                  local |                                                                                                                                             **0** |                                                           **0** |
| Finalizar PIX                                                |       1 mutação + `getSession` + ~9 reloads de tela |                                              1 mutação |                                                                                                                                        **~10–20** |                           **1** (`createSale`, inclui `screen`) |
| Finalizar fiado                                              |                           igual PIX + agenda depois |    1 mutação; agenda no próximo **Atualizar**/abertura |                                                                                                                                        **~10–20** |                                            **1** (`createSale`) |
| Criar reserva                                                |                    mutação + reload de várias áreas |                     1 mutação; lista volta no `screen` |                                                                                                                                            várias |                    **1** (`createReservation`, inclui `screen`) |
| Cadastrar produto                                            |                    2 round trips (~4–5 s no Google) |    1 mutação; lista do cardápio volta no mesmo retorno |                                                                                                  **2** (`createProduct` + `getCatalogScreenData`) |                        **1** (`createProduct`, inclui `screen`) |
| Excluir produto / categoria                                  |                    2 round trips (~4–5 s no Google) |                  1 mutação; cardápio volta no `screen` |                                                                                 **2** (`deleteProduct`/`deleteCategory` + `getCatalogScreenData`) |    **1** (`deleteProduct` ou `deleteCategory`, inclui `screen`) |
| Abrir aba Alunos                                             | 1 chamada, mas com leitura de cabeçalho em cada aba | 1 chamada; abas já conhecidas pulam checagem de header |                                                                                                                   **1** (`getStudentsScreenData`) |          **1** (`getStudentsScreenData`, mais barata no Sheets) |
| Abrir Estoque / Agenda / Reservas / Caixa depois de Vendas   | 1 chamada Google cada | 0 se Vendas já carregou | **1** cada | **0** (reusa `getSaleScreenData`) |
| Cadastrar aluno / ajustar estoque / abrir caixa              |                                    mutação + reload |                1 mutação; a aba usa o retorno/`screen` |                                                                                                **2** (mutação + `get*ScreenData`/`listInventory`) | **1** (`createStudent` / `adjustInventory` / `openCashSession`) |
| Entregar reserva                                             |       preenchia carrinho e recarregava sessão/telas |           preenche carrinho local; Vendas já lazy-load |                                                                                                                                            várias |                                   **0** até **Confirmar venda** |
| Atualizar estoque                                            |                                    1 leitura da aba |                                              1 leitura |                                                                                                                                             **1** |                                 **1** (`listInventoryBalances`) |
| Histórico/editar aluno                                       |                            1 `getStudent` no Editar |                                         1 `getStudent` |                                                                                                                                             **1** |                                                           **1** |
| Botão **Atualizar**                                          |             não existia; mutação fazia full refresh |                                   relê só a área ativa |                                                                                                                                               n/a |                                                           **1** |

## Onde estavam os ~4 segundos

`google.script.run` não paraleliza. Abrir Vendas disparava **7** round trips. Cada um ainda abria a planilha e lia abas inteiras (`setupSchema` + `getValues`). Sete × ~500 ms ≈ 4 s, antes da dona vender.

Cadastrar produto repetia o mesmo padrão em menor escala: gravar e depois reler o cardápio (2 round trips). Abrir Alunos era 1 chamada, mas cada aba pagava `getSheetByName` + leitura de cabeçalho.

Depois da venda, outro combo `getSession` + reload de quase todas as áreas repetia o custo.

Leituras de UI **não** precisam de `LockService`; mutação sim. O lock agora cobre só `createSaleUnlocked` (e outras escritas). A montagem de `screen` ocorre **depois** de soltar o lock.

## Sheets e cache

- Leituras usam `getValues` em lote e cache in-memory **por execução** (`sheetRecordsCache`), o que elimina N+1 de `getValues` em `listSales` / resumo de aluno na mesma chamada.
- Com schema já aplicado nesta execução, `setupSchema` não reabre `_meta`/`_schema_migrations`.
- `listStudentsUnlocked` monta mapas de matrícula/turma/responsável uma vez, em vez de percorrer as abas por aluno.
- `CacheService`: catálogo/categorias (600 s) e flag de schema. Invalidado em escrita de produto/categoria. Miss reconstrói do Sheets. Totais financeiros nunca saem do cache.
- Índice mínimo de alunos: vem no payload da tela (`getSaleScreenData.students`, `getReservationScreenData.students`). Pesquisa/filtro é local.

## Medição ao vivo — 2026-08-14 12:33 BRT

Web App DEV, Playwright dentro do iframe, `window.__cantinaPerf`. Uma aba por vez até o status sair do texto de “entre para…”. Seed pequeno (3 alunos, 7 produtos, 2 reservas, 0 vendas). Sem PII. O navegador MCP do Cursor não clica no `sandboxFrame` (outro domínio); o casco do Google levou ~2,3 s no load.

| Aba / fluxo | API | Chamadas | Tempo |
| --- | --- | ---: | ---: |
| Reservas | `getReservationScreenData` | 1 | **20,1 s** |
| Atualizar (Vendas) | `getSaleScreenData` | 1 | **16,9 s** |
| Login + Vendas | `loginE2E` + `getSaleScreenData` | 2 | 5,5 + 9,9 s |
| Alunos | `getStudentsScreenData` | 1 | 10,4 s |
| Estornos | `getReversalsSetup` | 1 | 9,1 s |
| Caixa | `getCashSetup` | 1 | 7,8 s |
| Estoque | `listInventoryBalances` | 1 | 7,8 s |
| Responsáveis | `getFamilyScreenData` | 1 | 7,2 s |
| Pagamentos | `getPaymentsScreenData` | 1 | 4,8 s |
| Crédito | `getCreditsScreenData` | 1 | 4,4 s |
| Cardápio | `getCatalogScreenData` | 1 | 3,5 s |
| Agenda | `listReceivables` | 1 | 3,1 s |
| Juros (depois da Agenda) | — | 0 | 0,4 s |
| Vendas de novo | — | 0 | 0,4 s |

O piso de uma chamada “barata” neste ambiente ficou em ~3 s (Agenda vazia / Cardápio em cache), não 400–600 ms. A mesma `getSaleScreenData` oscilou 9,9 s → 16,9 s na sessão. Lazy load da segunda abertura funciona (0 chamadas).

## Gargalos que continuam (intrínsecos)

- Uma `google.script.run` fria ainda custa **~3 s** neste DEV, mesmo com payload único ou catálogo em cache.
- Estoque, Agenda, Reservas e Caixa **depois de Vendas** não disparam nova chamada: reusam o payload. **Atualizar** na aba ativa continua 1 chamada.
- `createSale` ainda lê várias abas para validar, gravar e montar `screen`.
- Excluir produto ainda consulta venda/estoque/reserva na mesma chamada (regra `PRODUCT_IN_USE`).
- Cadastrar 10 produtos ainda é 10 idas ao Google (uma por produto), não um lote.
- Histórico append-only cresce; cada abertura de Vendas faz `getValues` das abas de venda/itens/settlements.
- Sem `spreadsheets.batchUpdate` nesta fase para a venda (ainda `appendRow` sob lock).
- `LockService` espera se duas mutações coincidirem (`lockWaitMs`).
- Projeções derivadas de dashboard **não** foram criadas: o gargalo medido era round trip, não scan de base grande no seed E2E.
- O Web App Google roda num iframe de outro domínio: o navegador embutido do Cursor não consegue clicar/medir dentro dele. Tempos de ação no Google vêm do orçamento de chamadas + `window.__cantinaPerf.timings` depois do deploy.
