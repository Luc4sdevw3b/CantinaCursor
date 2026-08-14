# V2 AppScript Change Log — Cantina

Este arquivo registra **tudo que acontecer com o projeto**, inclusive tentativas que não deram certo.

Regras:

- entrada mais nova no topo;
- registrar pedido do usuário, implementação da IA, decisão técnica, correção, tentativa falha, parcial, revert e release;
- não incluir dados reais, tokens ou secrets;
- não reescrever entradas antigas para alterar a história.

## 2026-08-14 13:20 — Corrigir o restante da auditoria de lentidão

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Corrigir tudo o que a auditoria e as análises encontraram.

### Tentativa / implementação

- Login (`loginE2E` / `loginWithGoogle`) devolve `screen` (Vendas) e `roster` (Alunos/Responsáveis) depois do lock. A UI não faz uma segunda ida para montar Vendas.
- Vendas/estornos: itens, settlements, dívidas, alocações e alunos/responsáveis/produtos viram mapa uma vez por execução, em vez de filtrar a aba inteira por linha.
- Alunos e Responsáveis passam a devolver o mesmo cadastro completo; a UI reusa depois do login.
- Pagamentos e crédito, com cadastro já em memória, pedem só `listPayments` / `listCreditAccounts`.
- Trocar turma no aluno entra no mesmo `updateStudent` (`classroomId`), sem `enrollStudent` extra.
- Cardápio ~3,5 s e o piso de ~3 s de `google.script.run` continuam intrínsecos.

### Resultado

- Login + Vendas: 1 chamada. Alunos e Responsáveis depois do login: 0. Pagamentos/crédito: 1 lista cada. Salvar aluno com turma nova: 1 `updateStudent`.

### Diferenças do pedido

- Não dá para zerar o piso de uma ida fria ao Google (~3 s). Cardápio em cache já está nesse piso.
- Estornos ainda é 1 chamada na primeira abertura; o corte é de CPU dentro da chamada, não de round trip.

### Impacto técnico

- `AppSession` pode trazer `screen` e `roster` só no login; `getSession` continua só com o papel.
- Índices derivados seguem o mesmo ciclo do cache de abas: desligados sob lock.

### Testes

- Vitest: login com `screen`/`roster`; `updateStudent` com turma; alunos e família com o mesmo cadastro.
- E2E local: login = `loginE2E`; Alunos/Responsáveis 0 chamadas; Pagamentos/Crédito = listas; turma nova = 1 `updateStudent`.

### Pendências / próxima versão

- Publicar o Web App DEV para a dona sentir o corte no Google.
- Fase 27 (WhatsApp) continua fora.

## 2026-08-14 12:40 — Cortar laços do Sheets e reusar Vendas


**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Inspecionar DOM, console, rede e headers no DevTools.
- Corrigir a lentidão ao carregar as páginas pelo caminho mais viável.

### Tentativa / implementação

- MCP/CDP no casco do Google: load ~1,8–2,3 s; um XHR de 540 bytes ~3,9 s; iframe `sandboxFrame` cross-origin (sandbox + allow). Sem cookies (CDP bloqueado). Console/rede da UI ficam no iframe — cliques do MCP não entram.
- Causa real: cada `google.script.run` relia estoque/reservas/dívidas/caixa em laços por item; Vendas já trazia esses dados e as outras abas pediam de novo.
- Apps Script: mapa de físico/reservado/remainingCents/movimentos de caixa uma vez por execução; Vendas não calcula estoque duas vezes.
- UI: Estoque, Agenda, Reservas e Caixa reusam o payload de Vendas até um **Atualizar** ou mutação.

### Resultado

- Abrir essas quatro abas depois do login: 0 chamadas extras no E2E local.
- Reserva/estoque/fiado continuam com o mesmo número; só o CPU da montagem cai.

### Diferenças do pedido

- Perfil JS do iframe não é visível no MCP (cross-origin). A correção usa o ranking medido + o grafo de `Code.gs`.
- Uma ida fria ao Google ainda existe (login + Vendas). Não dá para zerar o piso de `google.script.run`.

### Impacto técnico

- Leituras usam índices em memória da mesma execução; mutação sob lock continua sem esse cache.
- `invalidateAreas` descarta o payload compartilhado.

### Testes

- Vitest: alinhamento `getSaleScreenData` × estoque/reservas.
- E2E local: 0 chamadas ao abrir Estoque/Agenda/Reservas/Caixa após Vendas.

### Pendências / próxima versão

- Alunos/Estornos ainda relêem a planilha na primeira abertura.
- Publicar o `Code.gs` no Web App DEV para a dona sentir o corte no Google.

## 2026-08-14 12:33 — Auditoria de lentidão no Web App

**Origem:** Pedido do usuário
**Status:** Auditoria (sem correção de código)
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Descobrir as áreas mais lentas navegando pelo Web App.

### Tentativa / implementação

- MCP no casco do Google: load ~2,3 s; iframe `sandboxFrame` de outro domínio — cliques não entram na UI.
- Playwright no mesmo Web App: login dona + cada aba a frio, esperando o status; tempos de `window.__cantinaPerf`.
- Ranking e causas em `PERFORMANCE_BASELINE.md`.

### Resultado

- Piores: Reservas 20,1 s, Atualizar/Vendas 16,9 s, login+Vendas 15,5 s (2 chamadas), Alunos 10,4 s.
- Piso de uma chamada barata ~3 s. Segunda abertura de Vendas e Juros depois da Agenda: ~0,4 s, 0 chamadas.

### Diferenças do pedido

- Não foi possível auditar as abas só com MCP (iframe). A medição das abas usou Playwright no mesmo endereço.

## 2026-08-14 12:10 — Estoque, alunos e demais abas em 1 round trip

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Estoque para preencher e atualizar estava lento.
- Corrigir a lentidão de todas as abas.

### Tentativa / implementação

- Ajustar estoque, abrir/fechar caixa e estornar já devolviam a lista; a UI pedia a lista de novo. Agora usa o retorno.
- Mutações de aluno, turma, responsável, pagamento, crédito, juros, renegociação e reserva devolvem `screen` da própria aba, como venda e cardápio.
- Aba Família passa a trazer os vínculos aluno–responsável no payload (antes era 1 chamada por aluno).
- Criar turma reutiliza o ano letivo já carregado, sem `listSchoolYears` extra.

### Resultado

- Ajuste de estoque, cadastro de aluno, abrir caixa e as outras mutações das abas: 2 round trips → 1.
- Abrir Responsáveis deixa de disparar N `getStudentGuardians`.

### Diferenças do pedido

- Uma `google.script.run` fria ainda custa centenas de ms a ~2 s; isso não zera.
- Trocar aluno de turma no editar continua em 2 chamadas (`updateStudent` + `enrollStudent`).

### Impacto técnico

- Sem schema novo. `FamilyScreenData.links` entra no payload da aba Família.
- Reserva devolve `screen` numa cópia do setup para não circular no `google.script.run`.

### Testes

- Vitest **240** e E2E local **50**: orçamento de 1 chamada em `adjustInventory`, `createStudent` e `openCashSession`; `createStudent.screen` / `createGuardian.screen`.

### Pendências / próxima versão

- Recarregar o Web App (Ctrl+F5).
- Fase 27 só com pedido explícito.

## 2026-08-14 11:50 — Excluir no cardápio e varredura de desempenho

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Excluir item do cardápio ainda demorava vários segundos.
- Analisar o app inteiro em desempenho e medir no navegador o tempo de cada ação.

### Tentativa / implementação

- Excluir/criar/editar categoria e item avulso passam a devolver `screen` do cardápio, como produto. A UI não faz segunda chamada.
- `setupSchema` deixa de reabrir `_meta` quando o schema já está ok nesta execução (vale para venda, aluno, estoque, etc.).
- `__cantinaPerf` passa a gravar milissegundos por chamada (`timings`), sem PII.
- Navegador do Cursor: o Web App Google fica num iframe de outro domínio; não dá para clicar nem cronometrar as ações lá. Medição feita pelo grafo de chamadas e E2E local.

### Resultado

- Excluir produto ou categoria: 2 round trips → 1.
- Mutações que ainda chamavam `setupSchema` completo deixam de reler cabeçalho de schema.

### Diferenças do pedido

- Sem medição de relógio no iframe Google (bloqueio de origem cruzada).
- Aluno/família/estoque/caixa/pagamento/reserva ainda recarregam a própria aba (próximo corte de round trip).

### Impacto técnico

- Sem schema novo. `PRODUCT_IN_USE` na exclusão de produto continua lendo venda/estoque/reserva na mesma chamada.

### Testes

- Vitest **237** e E2E local **47**: orçamento de 1 chamada em `deleteProduct` e `deleteCategory`; `createCategory.screen`.

### Pendências / próxima versão

- Recarregar o Web App (Ctrl+F5).
- Fase 27 só com pedido explícito.
- Opcional: devolver `screen` também em aluno, família, estoque, caixa, pagamento e reserva.

## 2026-08-14 11:40 — Cadastro de produto e aba Alunos mais rápidos

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Entender e reduzir os ~4–5 s para cadastrar um produto (e o custo de cadastrar 10).
- A aba Alunos demorava para listar os cadastrados.

### Tentativa / implementação

- Causa do cadastro: duas idas serializadas ao Google (`createProduct` + `getCatalogScreenData`), mais `setupSchema`/leitura de cabeçalho em cada aba.
- Mutação de produto agora devolve `screen` do cardápio na mesma chamada, como a venda. A UI não relê o catálogo.
- Leituras pulam checagem de cabeçalho quando o schema já está aplicado; sessões/usuários usam o mesmo cache de abas.
- Lista de alunos monta matrícula/turma/responsável uma vez, não por aluno.

### Resultado

- Cadastrar produto: 2 round trips → 1.
- Dez produtos: 20 idas → 10 (ainda uma por item; cada uma deixa de pagar o reload extra).
- Alunos: continua 1 chamada, com menos trabalho no Sheets.

### Diferenças do pedido

- Sem cadastro em lote de 10 produtos numa chamada só.
- Uma `google.script.run` fria ainda custa centenas de ms a ~2 s.

### Impacto técnico

- Sem schema novo. Regras de produto/aluno iguais.
- `CacheService` continua só catálogo/schema; nomes de alunos não vão para cache.

### Testes

- Vitest **235** e E2E local **45**: `createProduct.screen`, homônimos em `getStudentsScreenData`, orçamento de 1 chamada em cadastrar produto e em abrir Alunos.

### Pendências / próxima versão

- Fase 27 só com pedido explícito.
- Recarregar o Web App (Ctrl+F5) depois do deploy.

## 2026-08-14 11:15 — Produto ativo do cardápio aparece no estoque

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Produtos novos no cardápio não apareciam para selecionar no estoque.
- Todo produto que não foi excluído nem inativado precisa aparecer no estoque.

### Tentativa / implementação

- A lista e o select de estoque passam a incluir todos os produtos **ativos** do cardápio, mesmo se o dia já estava aberto ou o item nasceu sem abertura.
- Sem quantidade inicial, mostra `ACABOU` (zero) e a dona pode ajustar.
- Inativo ou excluído some do estoque.
- Cadastro novo marca **Controla estoque** por padrão.

### Resultado

- Produto cadastrado hoje entra no estoque na hora. Inativar tira da lista.

### Diferenças do pedido

- Nenhuma.

### Impacto técnico

- Fonte da verdade do cadastro continua `_products`. Estoque do dia não exige mais linha de abertura para o item aparecer.

### Testes

- Vitest + E2E local: produto novo no select; inativo some; ajuste de item criado depois da abertura.

### Pendências / próxima versão

- Nenhuma.

## 2026-08-14 11:20 — Fase 26.5: performance sem mudar regra de negócio

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26.5

### Pedido / objetivo

- Operações e atualizações estavam ~4 s.
- Medir, cortar `google.script.run` de UI, agregar tela, devolver deltas na mutação, cache seguro, Sheets em lote, lock só na escrita, sem full refresh, testes verdes. Não avançar à Fase 27.

### Tentativa / implementação

- Instrumentação: `window.__cantinaPerf` e `Logger.log PERF` (fora de PROD), sem PII.
- Login carrega só a área ativa. Botão **Atualizar**.
- `getSaleScreenData` e outras APIs por tela. `createSale` devolve `screen`.
- Carrinho/quantidade/pagamento/filtros continuam locais (e agora medidos).
- Cache in-memory por execução + `CacheService` de catálogo; lock solto antes de montar a UI da venda.
- Baseline em `PERFORMANCE_BASELINE.md`.

### Resultado

- Abrir Vendas: 7 chamadas → 1 (ou 0 se já carregada).
- PIX: ~10–20 chamadas → 1 `createSale`.
- Quantidade do carrinho: 0 chamadas remotas.

### Diferenças do pedido

- Não há `getDashboardData` separado: a área Vendas é o dashboard operacional.
- `createReservation` ainda faz um reload da própria tela (2 chamadas), não um payload único.
- Sem projeções derivadas: o gargalo medido era round trip, não scan crescente no seed.
- Sem reescrever a venda em `batchUpdate` nesta fase.

### Impacto técnico

- Skill/arquitetura/convenções: UI local; uma mutação ≈ uma chamada; cache não é SoT financeira.
- Implementation Plan ganha Fase 26.5. WhatsApp permanece Fase 27.

### Testes

- Vitest + E2E local (orçamento de chamadas, `createSale.screen`, cache miss, totais iguais com/sem cache).
- Sem assert de milissegundos de rede Google.

### Pendências / próxima versão

- Fase 27 só com pedido explícito.
- Opcional depois: `batchUpdate` na venda; payload único em reserva/pagamento; projeções se o histórico crescer.

## 2026-08-14 10:30 — Excluir apaga categoria/produto; Inativar só desativa

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Não deixar categoria/produto “inativo” quando a dona escolhe **Excluir**.
- **Excluir** apaga de verdade; **Inativar** só desativa.

### Tentativa / implementação

- Cardápio ganha os dois botões: **Inativar** / **Reativar** e **Excluir**.
- Excluir categoria remove as linhas da aba `_product_categories`. Recusa se ainda houver qualquer produto nela.
- Excluir produto remove `_products` e o histórico de preço. Recusa se o produto já entrou em venda, estoque ou reserva; nesses casos a dona usa **Inativar**.
- Inativar continua append-only (`active: false`) e some do select de vendas.

### Resultado

- Excluir some da lista. Inativar aparece como `(inativa)` / `Inativo` e pode ser reativada.

### Diferenças do pedido

- Produto com histórico financeiro/estoque não é apagado: a venda antiga continua com snapshot, mas o cadastro precisa existir para estorno e estoque.

### Impacto técnico

- Novas APIs: `deleteCategory`, `deleteProduct`, `activateCategory`, `activateProduct`. `rewriteSheetRecords` no Code.gs.

### Testes

- Unitário, FakeAppApi, Code.gs e E2E local de excluir vs inativar.

### Pendências / próxima versão

- Publicar no Web App de teste e recarregar com Ctrl+F5.

## 2026-08-14 10:20 — CRUD de cadastro com exclusão suave

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Excluir categoria e produto, além de criar/editar.
- Completar CRUD de alunos, responsáveis, turmas, categorias e produtos.
- Cobrir em E2E local os processos dos últimos pedidos (reserva Fase 26, cadastros, seletor de aluno, Processando, layout do Cardápio).

### Tentativa / implementação

- Exclusão é desativação append-only (`active: false`), sem apagar linha do Sheets.
- Categoria: `deactivateCategory` recusa se ainda houver produto ativo; categoria vazia pode ser excluída. O select `#product-category` lista só categorias ativas; a lista mostra `(inativa)`.
- Produto: o botão da lista passa de **Desativar** para **Excluir**; o backend continua `deactivateProduct`.
- Responsável: `deactivateGuardian` (botão **Desativar**, como aluno). Crédito e fiado históricos permanecem pelo ID.
- Turma: `updateClassroom` e `deactivateClassroom`; recusa se houver aluno ativo. Lista compacta `#classrooms-list` em Alunos, com **Editar** / **Excluir**.
- Aluno permanece com **Desativar** + **Reativar** com revisão.
- E2E local cobre exclusão, recusa, filtro `#reservation-student-search` e `#busy-banner` `Processando ação…` com `?e2eBusy=1`.

### Resultado

- Dona e funcionário concluem o CRUD dos cadastros sem apagar histórico.

### Diferenças do pedido

- Excluir não apaga a linha: o registro fica inativo para auditoria.
- Responsável usa **Desativar**, não **Excluir**, porque pode haver crédito/fiado ligado ao ID.

### Impacto técnico

- Sem schema novo. Novas APIs: `deactivateCategory`, `deactivateGuardian`, `updateClassroom`, `deactivateClassroom`.

### Testes

- Unitário de categoria/turma/responsável; integração FakeAppApi e Code.gs; E2E local.

### Pendências / próxima versão

- Publicar no Web App de teste e recarregar com Ctrl+F5.

## 2026-08-14 10:08 — Categorias no topo do Cardápio

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Criar categoria no Cardápio e editar categorias e produtos já criados.

### Tentativa / implementação

- A tela **Cardápio** passa a abrir em **Categorias** (lista + **Cadastrar categoria** / **Editar** / **Salvar categoria**), depois **Produtos** com **Editar** / **Salvar produto**.
- A API de categoria já existia; a mudança é de descoberta na tela.

### Resultado

- Dona e funcionário veem criar/editar categoria assim que entram em Cardápio.

### Diferenças do pedido

- Nenhuma.

### Impacto técnico

- Sem schema novo.

### Testes

- E2E local do catálogo e da categoria.

### Pendências / próxima versão

- Publicar no Web App de teste e recarregar.

## 2026-08-14 09:50 — Cadastro editável, seletor de aluno na reserva e aviso Processando

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Editar o que já existe no cadastro (aluno, responsável, produto, categoria) e criar turma.
- Na reserva interna, escolher aluno cadastrado com pesquisa, sem texto livre.
- Mostrar **Processando…** enquanto o Google Sheets grava, e bloquear clique duplo.

### Tentativa / implementação

- API `createCategory` / `updateCategory` no catálogo em memória, `AppApi` e `Code.gs`.
- Formulários de editar aluno, responsável e categoria; **Cadastrar turma** em Alunos.
- Nova reserva interna: pesquisa + seletor `Ana Souza • ~8`; a turma preenche sozinha; a reserva já nasce vinculada ao aluno. Portal público e **Alterar reserva** continuam com texto livre.
- Helper único `runBusyAction` / faixa **Processando ação…**: desliga o botão, mostra o aviso, e no fim deixa o texto de sucesso ou erro. Rótulos **Confirmar venda**, **Registrar pagamento** e **Registrar pagamento familiar** não mudaram.

### Resultado

- Dona e funcionário editam cadastro, escolhem aluno na reserva e veem que a ação ainda está rodando.

### Diferenças do pedido

- Nenhuma.

### Impacto técnico

- Reserva interna pode enviar `linkedStudentId` na criação; o portal público ignora esse campo.
- Categoria continua append-only, sem `updated_at`.

### Testes

- Unit/integration: categoria, edição de aluno/responsável, reserva com aluno vinculado.
- E2E local: editar aluno/responsável/categoria, seletor de reserva, turma nova.

### Pendências / próxima versão

- Nenhuma desta entrega.

## 2026-08-14 09:38 — Seed fictício gravado na planilha de teste

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Depois que o Web App abriu na planilha de teste, carregar dados fictícios para poder clicar nas telas.

### Tentativa / implementação

- `seedE2E` rodou no script preso à planilha de teste: alunos (Ana, Bruno), responsáveis, cardápio (Coxinha, suco), estoque do dia e recreios.
- Conferido no Web App: health da planilha, Coxinha no cardápio e estoque `Coxinha • 10`.

### Resultado

- A planilha de teste tem o mesmo seed fictício do ambiente E2E. Recarregar o app mostra os dados.

### Diferenças do pedido

- Nenhuma.

### Impacto técnico

- O seed apaga e regrava as abas de negócio dessa planilha. Não mexeu na planilha E2E nem em PROD.

### Testes

- Smoke manual no Web App da planilha de teste: health, cardápio e estoque.

### Pendências / próxima versão

- Nenhuma para este pedido.

## 2026-08-14 09:10 — Playground DEV numa planilha de teste (parcial)

**Origem:** Pedido do usuário
**Status:** Parcial
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Testar o app numa planilha Google real, sem usar a planilha E2E isolada nem PROD.

### Tentativa / implementação

- Criado um projeto Apps Script separado, preso à planilha de teste, com o código da Fase 26. O projeto E2E não foi reapontado.
- `.gitignore` passa a ignorar `.clasp.dev.json` e `.clasp.e2e.json` para não versionar IDs.
- O Web App novo ainda não abre: o Google recusou o acesso anônimo até a primeira implantação/autorização no editor.

### Resultado

- Código enviado ao script da planilha de teste. Falta a dona autorizar o script e criar a implantação Web App no editor do Apps Script.

### Diferenças do pedido

- Ainda não deu para clicar nas telas nem gravar o seed fictício (Coxinha, Ana, recreios) na planilha.

### Impacto técnico

- Sem mudança de schema. Ambiente E2E de automação permanece separado.

### Testes

- Nenhum teste novo. Checks da Fase 26 não foram reexecutados nesta tentativa.

### Pendências / próxima versão

- Autorizar o script no editor, implantar como Web App e, depois, carregar o seed fictício.

## 2026-08-14 08:56 — Implementada a Fase 26: reserva vira venda

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 26

### Pedido / objetivo

- Executar a Fase 26: entrega usa o motor normal de venda, escolher pagamento, baixa física uma vez, libera reservado, vínculo `source_reservation_id`; se retirar menos, o restante cancela; venda presencial só usa unidade reservada com override explícito da dona.

### Tentativa / implementação

- **Entregar reserva** preenche o carrinho, abre **Vendas** e pede pagamento. **Confirmar venda** cria a venda com `sourceReservationId`, baixa o físico uma vez (movimento `sale`) e marca a reserva `retirada` / `paid`.
- Se a venda retira menos do que estava reservado, a reserva inteira é encerrada na retirada: o restante deixa de ficar reservado. Não há status parcial de item.
- Venda presencial com disponível insuficiente exige **Usar unidade reservada** e a reserva afetada. Só a dona. A reserva escolhida é cancelada por completo na mesma operação (`Venda presencial com override`).
- Funcionário entrega via **Entregar reserva** → **Confirmar venda**, mas não usa unidade reservada.

### Resultado

- Fase 26 concluída sobre o ambiente E2E isolado e o preview local.
- WhatsApp oficial permanece na Fase 27.

### Diferenças do pedido

- Alterar reserva continua sem trocar produto/quantidade.
- O override cancela a reserva escolhida inteira; não reduz só a quantidade reservada.

### Impacto técnico

- Sem migration nova. `source_reservation_id` já existia em `_sales`. `createSale` aceita `sourceReservationId` e `overrideReservationId`.

### Testes

- typecheck, lint, format, Vitest (216) e E2E local (37) passaram.
- E2E remoto: health e reserva pública no portal.

## 2026-08-14 08:20 — Implementada a Fase 25: gestão da dona nas reservas

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 25

### Pedido / objetivo

- Executar a Fase 25: reservas por recreio, resumo de produção, pesquisar, alterar, entregar, cancelar, no-show e vincular aluno.

### Tentativa / implementação

- Tela **Reservas do recreio** ganha filtro por recreio, **Pesquisar reserva**, produção (`Coxinha • 1`), **Alterar reserva**, **Entregar reserva** e **Vincular aluno**.
- `updateReservation` (com `request_id`) altera nome, turma e contato de reserva ativa. `linkReservationStudent` preenche `linked_student_id` e mostra `vinculada a Ana Souza • ~8`, sem apagar o nome digitado.
- Entregar chama `fulfillReservation`: status `retirada`, libera reservado, estoque físico permanece. Não abre venda nem pagamento.
- Cancelar e não retirada continuam iguais. **Criar recreio** segue só da dona. Funcionário pesquisa, entrega, altera, vincula e cancela.

### Resultado

- Fase 25 concluída sobre o ambiente E2E isolado e o preview local.
- Reserva→venda permanece na Fase 26.

### Diferenças do pedido

- Alterar nesta fase não troca o produto/quantidade da reserva; só nome, turma e contato.

### Impacto técnico

- Sem migration nova. `linked_student_id` já existia no schema 15. Produção é calculada das reservas `reserved`.

### Testes

- typecheck, lint, format, Vitest (211) e E2E local (35) passaram.
- E2E remoto: health e reserva pública no portal.

## 2026-08-14 07:45 — Implementada a Fase 24: portal público de reservas

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 24

### Pedido / objetivo

- Executar a Fase 24: catálogo reservável, `ACABOU`, nome digitado, turma, contato opcional, sem autocomplete privado e código público. E2E remoto obrigatório.

### Tentativa / implementação

- Superfície `?portal=reservas` (e `doGet` no Apps Script injeta o modo portal). Sem login, sem alunos, sem dívidas e sem créditos.
- `getPublicReservationPortal` e `createPublicReservation` são públicos. Preço e disponibilidade são recalculados no servidor, com lock e `request_id`.
- Catálogo mostra `Coxinha • R$ 5,50 • disponível 10` e `Suco de uva • R$ 4,00 • ACABOU`. Depois da reserva, o código público de 6 caracteres aparece para a retirada.
- Campo honeypot escondido recusa envio automático. Confirmar venda não muda de rótulo.

### Resultado

- Fase 24 concluída sobre o ambiente E2E isolado e o preview local.
- Gestão da dona é a Fase 25. Reserva→venda permanece na Fase 26.

### Diferenças do pedido

- O portal não pesquisa reserva pelo código; só mostra o código na confirmação.

### Impacto técnico

- Sem migration nova. O portal reusa as abas da Fase 23 e não devolve a lista interna de reservas.

### Testes

- typecheck, lint, format, Vitest (207) e E2E local (34) passaram.
- E2E remoto: o primeiro smoke do portal falhou com `INVENTORY_DAY_NOT_OPEN` (Date UTC no Sheets) e o botão **Enviar reserva** ficou atrás do rodapé no iframe do Apps Script. Datas civis passam a texto; o portal entrou na área rolável. Health e reserva pública no deployment seguinte.

## 2026-08-13 19:10 — Implementada a Fase 23: recreios e reservas

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 23

### Pedido / objetivo

- Executar a Fase 23: recreios, cutoff, reservas/itens/status, quantidade reservada, disponibilidade, idempotência, concorrência, estados RESERVED/FULFILLED/CANCELLED/NO_SHOW, sem PREPARED e sem retirada parcial persistente.

### Tentativa / implementação

- Migration `015_reservations`, schema 15: `_reservation_slots`, `_reservations`, `_reservation_items` e `_reservation_status_history`.
- Seed local/E2E: Recreio manhã (corte 09:15) e Recreio tarde (corte 18:00). Coxinha passa a ser reservável.
- Reserva ativa segura disponibilidade (`físico - reservado`) sem baixar o estoque físico. Cancelar, não retirada e marcar retirada liberam o reservado.
- `request_id` reutiliza a mesma reserva. Lock no Apps Script relê a disponibilidade. Duas reservas não pegam a última unidade.
- Botões **Criar recreio** (só dona), **Confirmar reserva**, **Cancelar reserva** e **Não retirada**. Confirmar venda não muda de rótulo. Sem portal público.

### Resultado

- Fase 23 concluída sobre o ambiente E2E isolado e o preview local.
- Portal público é a Fase 24. Entrega da dona e reserva→venda permanecem nas fases seguintes.

### Diferenças do pedido

- `fulfilled` existe no modelo e na API, mas a UI ainda não converte a reserva em venda; isso é a Fase 26.

### Impacto técnico

- `getReservationsSetup`, `createReservationSlot`, `createReservation`, `cancelReservation`, `markReservationNoShow` e `fulfillReservation` entram no `AppApi`. `reservation_slots.write` é só da dona; `reservations.write` é dona e funcionário.

### Testes

- typecheck, lint, format, Vitest (204) e E2E local (33) passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

## 2026-08-13 18:40 — Implementada a Fase 22: estornos

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 22

### Pedido / objetivo

- Iniciar a Fase 22: estorno de venda/pagamento/crédito, PIX/dinheiro, devolução em meio diferente, escolha de estoque e auditoria.

### Tentativa / implementação

- Migration `014_reversals`, schema 14: `_operation_reversals` e `_reversal_effects`.
- Originais permanecem. Estorno cria reversão e efeitos. Só a dona estorna; funcionário consulta a auditoria.
- Venda com PIX/dinheiro exige forma de devolução. Forma diferente ou misto exige confirmação explícita. Fiado pago exige estornar o pagamento antes.
- Estoque: **Sim, devolver ao estoque** / **Não, manter fora do estoque**. Com retorno, o dia de estoque precisa estar aberto.
- Devolução em dinheiro usa o caixa aberto. PIX de estorno não mexe no caixa.
- Botões **Confirmar estorno da venda**, **Confirmar estorno do pagamento** e **Confirmar cancelamento da devolução**. Confirmar venda, Registrar pagamento e Registrar pagamento familiar não mudam de rótulo.

### Resultado

- Fase 22 concluída sobre o ambiente E2E isolado e o preview local.
- Reservas reais são a Fase 23. WhatsApp permanece nas fases seguintes.

### Diferenças do pedido

- Devolução de crédito atual continua sem sair do caixa no momento do **Devolver crédito**; o estorno dessa devolução pode recuperar PIX ou dinheiro.

### Impacto técnico

- `getReversalsSetup`, `reverseSale`, `reversePayment` e `reverseCreditRefund` entram no `AppApi`. `reversals.read` é dona e funcionário; `reversals.write` é só da dona.

### Testes

- typecheck, lint, format, Vitest (198) e E2E local (31) passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

## 2026-08-13 17:20 — Implementada a Fase 21: caixa físico

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 21

### Pedido / objetivo

- Iniciar a Fase 21: abertura opcional, troco inicial, dinheiro recebido, troco saída, adicionar troco, retirar dinheiro, fechamento/diferença e caixa antigo. E2E: R$ 8,00 com R$ 10,00 = +10/−2.

### Tentativa / implementação

- Migration `013_cash`, schema 13: `_cash_sessions` e `_cash_movements`.
- PIX continua sem caixa. Dinheiro, troco, pagamento em dinheiro e depósito em dinheiro exigem caixa aberto no dia.
- Troco inicial não é receita. Adicionar troco (dona e funcionário) e retirar (só dona) são movimentos, não receita/despesa. Fechamento grava esperado, contado e diferença; diferença exige nota. Caixa antigo aberto bloqueia dinheiro novo. Um caixa por dia; fechado não reabre.
- Showcase: Coxinha + Brigadeiro = `R$ 8,00`, recebido `R$ 10,00`; movimentos `entrada R$ 10,00` e `troco R$ 2,00`. Botões **Abrir caixa**, **Adicionar troco**, **Retirar dinheiro** e **Fechar caixa**. Confirmar venda não muda de rótulo.

### Resultado

- Fase 21 concluída sobre o ambiente E2E isolado e o preview local.
- Estornos são a Fase 22. Reservas reais e WhatsApp permanecem nas fases seguintes.

### Diferenças do pedido

- Devolução de crédito ainda não sai do caixa físico; isso fica junto dos estornos.

### Impacto técnico

- `getCashSetup`, `openCashSession`, `addCashForChange`, `removeCash` e `closeCashSession` entram no `AppApi`. Abrir, retirar e fechar são só da dona.

## 2026-08-13 16:55 — Implementada a Fase 20: venda na conta do irmão

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 20

### Pedido / objetivo

- Iniciar a Fase 20: autorização direcional para lançar na conta do irmão, usar crédito separado, revogar, consumidor diferente da conta cobrada.

### Tentativa / implementação

- Sem migration nova: `_sales.charged_student_id` e `_student_account_authorizations` já existiam. Schema continua 12.
- `createSale` aceita `chargedStudentId`. Sem autorização `can_charge_account`, a venda é recusada. O crédito pessoal do irmão só entra com `can_use_account_credit`.
- Seed: Bruno→Ana ~8 pode lançar, sem usar crédito. Showcase: fiado Coxinha do Bruno na conta da Ana; venda `Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • Sexta-feira • 14/08/26`; agenda da Ana; crédito da Ana intacto se houver depósito.
- UI: select **Conta** na venda, formulário **Autorizar irmão** e botão **Revogar**. Confirmar venda não muda de rótulo.

### Resultado

- Fase 20 concluída sobre o ambiente E2E isolado e o preview local.
- Caixa físico é a Fase 21. Reservas reais e WhatsApp permanecem nas fases seguintes.

### Diferenças do pedido

- Na conta própria, o crédito pessoal de um irmão com `can_use_account_credit` também pode ser consumido no fiado, depois do crédito do próprio aluno.

### Impacto técnico

- `chargedStudentId` entra em `createSale`. Confirmar venda, Registrar pagamento e Registrar pagamento familiar não mudam de rótulo.

## 2026-08-13 16:45 — Implementada a Fase 19: pagamento familiar

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 19

### Pedido / objetivo

- Iniciar a Fase 19: responsável paga filhos (quitar um, selecionados, manual, dívida + crédito, tudo crédito), cada centavo explicado, sobra só no crédito do responsável.

### Tentativa / implementação

- Sem migration nova: `payer_guardian_id` em `_payments`, `_payment_allocations` e `_payment_credit_allocations`. Schema continua 12.
- API nova `createFamilyPayment`. O botão **Registrar pagamento** do aluno não muda. Família usa **Registrar pagamento familiar**.
- Showcase local: dois fiados Coxinha (Ana ~8 e Bruno) amanhã; Maria paga `R$ 2,00` como dívida + crédito `0,20` + `0,15` + `1,65`. Lista `Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65`. Agenda `R$ 5,30` e `R$ 5,35`. Crédito `Maria Souza • mãe • R$ 1,65`.
- Paulo não paga Ana ~8. Sobra sem modo crédito é recusada. Funcionário pode registrar. Pagamentos do responsável passam a aparecer na lista.

### Resultado

- Fase 19 concluída sobre o ambiente E2E isolado e o preview local.
- Autorizações entre irmãos (lançar na conta) são a Fase 20. Caixa, reservas reais e WhatsApp permanecem nas fases seguintes.

### Diferenças do pedido

- Depósito de crédito do responsável (Fase 18) continua separado do pagamento familiar; a autoquitação do depósito não substitui a alocação explícita desta fase.

### Impacto técnico

- `createFamilyPayment` entra no `AppApi`. Confirmar venda e Registrar pagamento não mudam de rótulo.

## 2026-08-13 16:20 — Implementada a Fase 18: crédito de responsável

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 18

### Pedido / objetivo

- Iniciar a Fase 18: conta de crédito por responsável, autorização por filho, autoquitação opcional e pai/mãe com contas separadas.

### Tentativa / implementação

- Sem migration nova: reusa `_credit_accounts` (`owner_type=guardian`), `_credit_account_students` e os flags já existentes em `_student_guardians`. Schema continua 12.
- Fiado consome crédito pessoal primeiro e, se o filho **pode usar crédito**, o saldo do responsável. PIX/dinheiro não consomem. Sem autorização, o crédito do responsável pode coexistir com a dívida do filho. Depósito no responsável só quita dívida do filho com **autoquitar dívida**.
- Pai e mãe são contas distintas. Irmão sem o flag não herda. Devolução continua só da dona. Preview: autorizar Ana ~8 na Maria; depósito `R$ 2,00`; fiado Coxinha vira `crédito resp. R$ 2,00` com agenda `R$ 3,50`.

### Resultado

- Fase 18 concluída sobre o ambiente E2E isolado e o preview local.
- Pagamento familiar é a Fase 19. Caixa, reservas reais e WhatsApp permanecem nas fases seguintes.

### Diferenças do pedido

- Autoquitação entra no depósito do responsável, não no momento da venda. Na venda, o consumo é o flag **pode usar crédito**.

### Impacto técnico

- `depositGuardianCredit` e `refundGuardianCredit` entram no `AppApi`. Botões **Entrar crédito do responsável**, **Devolver crédito do responsável** e **Salvar autorização**. Confirmar venda e Registrar pagamento não mudam de rótulo.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 19 (pagamento familiar) sem pedido explícito.

## 2026-08-13 16:10 — Editar produtos no cardápio

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 17

### Pedido / objetivo

- Colocar uma opção de editar produtos já criados.

### Tentativa / implementação

- Botão **Editar** em cada produto do Cardápio. O mesmo formulário de cadastro recebe nome, categoria, preço e flags; o envio vira **Salvar produto** (`updateProduct`). **Cancelar** volta ao cadastro.
- Mudança de preço continua append-only: venda antiga não muda. Dona e funcionário podem editar (`products.write`). Depois de salvar, vendas e estoque atualizam o nome/preço na tela.

### Resultado

- Produto existente pode ser corrigido na UI, sem recadastrar.

### Diferenças do pedido

- Nenhuma. A API já existia; faltava só a tela.

### Impacto técnico

- Sem schema novo. HTML do Web App muda; precisa `clasp push` + deploy.

### Testes

- E2E local: editar Coxinha de R$ 5,50 para R$ 6,00 e ver o preço novo no cardápio e no select de vendas.

### Pendências / próxima versão

- Deploy Apps Script da UI nova.

## 2026-08-13 15:50 — Hero com atalhos e uma área visível por vez

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 17

### Pedido / objetivo

- Deixar tudo em uma tela só, com o mínimo de rolagem, tipo hero com botões para as áreas principais na mesma tela.

### Tentativa / implementação

- Hero compacto com saúde, login e atalhos. Depois do login, só uma área aparece (padrão: Vendas). Os botões trocam a área sem sair da página. Juros some do menu do funcionário.
- Listas longas rolam só no espaço da área. PIX/dinheiro/fiado/crédito e os textos de health não mudam.

### Resultado

- Layout de uma tela no preview local. Sem mudança de schema nem de API.

### Diferenças do pedido

- Não é âncora com scroll até o fim da página: o botão troca o painel no mesmo lugar, para caber melhor.

### Impacto técnico

- `AppApi` igual. E2E local passa a clicar o atalho da área antes de conferir aquele bloco.

### Testes

- Unit, typecheck, lint, format, build e E2E local.

### Pendências / próxima versão

- Não iniciar a Fase 18 (crédito de responsável) sem pedido explícito.

## 2026-08-13 15:40 — Implementada a Fase 17: crédito pessoal

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 17

### Pedido / objetivo

- Iniciar a Fase 17: ledger de crédito pessoal, uso opcional, fiado consome crédito primeiro, depósito quita dívida antes e devolução só pela dona.

### Tentativa / implementação

- Migration `012_credits` cria `_credit_accounts`, `_credit_account_students`, `_credit_movements` e `_payment_credit_allocations` (schema version 12). A 011 passa a gravar a versão 11; a 010 continua gravando 10.
- Conta pessoal preguiçosa (`owner_type=student`). PIX/dinheiro não consomem crédito. Fiado consome o saldo pessoal primeiro e só cria recebível no restante. Depósito (PIX ou dinheiro) quita a dívida pessoal oldest-first; a sobra vira movimento `deposit`. Devolução é movimento `refund`, só da dona (`credits.refund`).
- Preview local: depósito `R$ 2,00` da Ana; fiado Coxinha amanhã vira `Fiado • crédito R$ 2,00` com agenda `R$ 3,50` em 14/08 e crédito `R$ 0,00`. PIX/dinheiro/fiado/parcial/juros e o health smoke permanecem iguais.

### Resultado

- Fase 17 concluída sobre o ambiente E2E isolado e o preview local.
- Crédito de responsável é a Fase 18. Caixa, reservas reais e WhatsApp permanecem nas fases seguintes.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Não há checkbox “usar crédito no PIX”: o uso opcional é escolher PIX/dinheiro em vez de fiado.

### Impacto técnico

- `listCreditAccounts`, `depositPersonalCredit` e `refundPersonalCredit` entram no `AppApi`. Botões **Entrar crédito** e **Devolver crédito**. Confirmar venda e Registrar pagamento não mudam de rótulo.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 18 (crédito de responsável) sem pedido explícito.

## 2026-08-13 15:25 — Implementada a Fase 16: juros e renegociação

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 16

### Pedido / objetivo

- Iniciar a Fase 16: juros em valor ou porcento, motivo obrigatório, cobrança específica e histórico de vencimento.

### Tentativa / implementação

- Sem nova migration: juros entra como charge `interest` em `_receivable_charges`; a renegociação atualiza `due_date` e grava `_receivable_due_date_history` (já criada na 010). Schema continua 11.
- Só a dona (`receivables.adjust`). Valor fixo ou porcento do restante. Motivo obrigatório. Nunca automático por atraso. Funcionário lê a agenda e registra pagamento, mas não lança juros nem troca data.
- Preview local: fiado da Ana para 14/08; juros `R$ 1,00` vira `Ana Souza • ~8 • R$ 6,50 • Sexta-feira • 14/08/26`; +7 dias com motivo vira `Quinta-feira • 20/08/26` e o histórico `14/08/26 → 20/08/26`. PIX/dinheiro/fiado/parcial e o health smoke permanecem iguais.

### Resultado

- Fase 16 concluída sobre o ambiente E2E isolado e o preview local.
- Crédito pessoal é a Fase 17. Caixa, reservas reais e WhatsApp permanecem nas fases seguintes.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Porcento incide sobre o restante da cobrança escolhida, não sobre o principal original.

### Impacto técnico

- `addReceivableInterest` e `renegotiateReceivable` entram no `AppApi`. Botões **Lançar juros** e **Renegociar vencimento**. Confirmar venda e Registrar pagamento não mudam.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 17 (crédito pessoal) sem pedido explícito.

## 2026-08-13 15:10 — Implementada a Fase 15: pagamento parcial

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 15

### Pedido / objetivo

- Rodar a Fase 15: pagamento parcial com dívida mais antiga, seleção, alocação manual e alocações gravadas.

### Tentativa / implementação

- Migration `011_payments` cria `_payments` e `_payment_allocations` (schema version 11). A 010 passa a gravar a versão 10; a 009 continua gravando 9.
- `createPayment` exige aluno, PIX ou dinheiro, e aloca o valor recebido por completo. Padrão: dívida mais antiga (`due_date`, depois `created_at`, depois `id`). Selecionadas usam a mesma ordem só entre as escolhidas. Manual exige soma igual ao recebido e cada linha ≤ restante.
- Saldo da agenda é charges − alocações. Restante zero some da agenda. Aluno inativo ainda pode pagar. Pagamento familiar, juros e crédito ficam fora.
- Preview local: dois fiados da Ana (12/08 e 14/08); PIX `R$ 5,50` oldest-first tira o atrasado e deixa `Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26`. Manual `R$ 2,50` no 14/08 deixa `R$ 5,50` em 12/08 e `R$ 3,00` em 14/08. PIX/dinheiro/fiado e o health smoke permanecem iguais.

### Resultado

- Fase 15 concluída sobre o ambiente E2E isolado e o preview local.
- Juros é a Fase 16. Crédito, caixa, reservas reais e WhatsApp permanecem nas fases seguintes.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Um pagamento nesta fase é de um aluno só (`payer_student_id`). Responsável pagando filhos é a Fase 19.

### Impacto técnico

- `payments.write` para dona e funcionário. `createPayment` e `listPayments` entram no `AppApi`. Confirmar venda continua **Confirmar venda**. Registrar pagamento é **Registrar pagamento**.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 16 (juros e renegociação) sem pedido explícito.

## 2026-08-13 14:45 — Implementada a Fase 14: recebíveis e calendário

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 14

### Pedido / objetivo

- Rodar a Fase 14: cobrança (fiado), vencimentos, múltiplos vencimentos opcionais, picker/atalhos e agenda atrasado/hoje/próximo.

### Tentativa / implementação

- Migration `010_receivables` cria `_receivables`, `_receivable_charges` e `_receivable_due_date_history` (schema version 10). A 009 continua gravando a versão 9.
- Fiado entra em `createSale` (`paymentKind=fiado`), exige aluno, grava settlement `fiado` igual ao líquido e um recebível `open` por vencimento, com charge `principal`/`sale`. Um vencimento sem valor usa o total; vários precisam somar o líquido.
- Atalhos Amanhã / Próxima sexta / +7 dias usam data civil em `America/Sao_Paulo`. Display `Sexta-feira • 14/08/26`. Agenda agrupa atrasados, hoje e próximos. Dona e funcionário vendem fiado e leem a agenda.
- Preview local: `Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • Sexta-feira • 14/08/26` e o mesmo vencimento em **Próximos**. PIX/dinheiro e o health smoke permanecem iguais. Pagamento parcial não foi aberto (Fase 15).
- O `build:apps-script` agora insere o JS com função de `replace`, para `$&&` minificado não virar `</body>&` e quebrar o Web App remoto.

### Resultado

- Fase 14 concluída sobre o ambiente E2E isolado e o preview local.
- Parcial, juros, crédito, caixa, reservas reais e WhatsApp permanecem na Fase 15 em diante.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Fiado nesta fase é conta integral (sem misturar PIX+fiado). Cobrança de irmão e histórico de vencimento ficam para fases seguintes.

### Impacto técnico

- `receivables.read` para dona e funcionário. `listReceivables` e `getDueDateShortcuts` entram no `AppApi`. Confirmar continua **Confirmar venda**.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 15 (pagamento parcial) sem pedido explícito.

## 2026-08-13 14:22 — Implementada a Fase 13: dinheiro e settlements

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 13

### Pedido / objetivo

- Rodar a Fase 13: dinheiro, PIX + dinheiro, settlements, validações e integração posterior ao caixa.

### Tentativa / implementação

- Sem nova migration: `_sale_settlements` passa a aceitar `pix`, `cash` (valor recebido) e `change` (troco negativo). A soma continua igual ao líquido.
- PIX cobre o total. Dinheiro exige valor recebido ≥ líquido e grava o troco. Misto exige PIX parcial + dinheiro que cubra o restante. Recebido insuficiente recusa `INSUFFICIENT_CASH`.
- Preview local e E2E mantêm `Anônima • Coxinha • R$ 5,50` no PIX e mostram `Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50` ao receber R$ 10,00. Estoque continua baixando. Caixa físico não foi aberto (Fase 21).
- Health smoke permanece igual. Schema version continua 9.

### Resultado

- Fase 13 concluída sobre o ambiente E2E isolado e o preview local.
- Fiado, crédito, caixa, reservas reais e WhatsApp permanecem na Fase 14 em diante.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Settlements de dinheiro ficam gravados agora; o caixa físico (abertura, troco inicial, fechamento) continua na Fase 21, como o plano pede “integração posterior ao caixa”.

### Impacto técnico

- `createSale` aceita `paymentKind` `pix` | `cash` | `mixed`, com `pixAmountCents` e `cashTenderedCents`. Dona e funcionário vendem nos três meios; desconto continua só da dona.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 14 (recebíveis e calendário) sem pedido explícito.

## 2026-08-13 14:15 — Implementada a Fase 12: carrinho e PIX

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 12

### Pedido / objetivo

- Rodar a Fase 12: múltiplos itens, snapshot de preço, desconto por item, venda anônima ou de aluno, PIX e baixa atômica no estoque.

### Tentativa / implementação

- Migration `009_sales` cria `_sales`, `_sale_items` e `_sale_settlements` (schema version 9). A 008 continua gravando a versão 8. Setting `pix_copy_text` usa só a chave PIX de teste, sem API bancária.
- Carrinho grava snapshot de descrição/preço/desconto. Desconto e item avulso são só da dona. Settlement único `pix` igual ao líquido. Venda anônima ou com aluno; `charged_student_id` = consumidor nesta fase.
- Produto que controla estoque gera movimento `kind=sale` (delta negativo, motivo `venda`). Suco em `ACABOU` recusa `INSUFFICIENT_STOCK`. Brigadeiro não mexe no estoque.
- Preview local e E2E mostram `Anônima • Coxinha • R$ 5,50` após PIX de 1 Coxinha e estoque `Coxinha • 9`. Health smoke permanece igual.

### Resultado

- Fase 12 concluída sobre o ambiente E2E isolado e o preview local.
- Dinheiro, PIX+dinheiro, fiado, crédito, caixa, reservas reais e WhatsApp permanecem na Fase 13 em diante.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Sem dinheiro/troco e sem settlements mistos (Fase 13). Sem fiado, crédito, caixa, reservas ou envio de WhatsApp.

### Impacto técnico

- Auth: `sales.read` / `sales.write` para dona e funcionário; desconto e avulso continuam só da dona.
- `createSale` usa `LockService`. Quantidade inteira ≥ 1. Percentual half-up em centavos.

### Testes

- Unit, integração, typecheck, lint, format, build, version:check, validate:skill e E2E local passaram.
- E2E remoto: smoke de health no deployment novo após `clasp push` + `clasp deploy`.

### Pendências / próxima versão

- Não iniciar a Fase 13 (dinheiro e settlements) sem pedido explícito.

## 2026-08-13 14:05 — Implementada a Fase 11: estoque diário

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 11

### Pedido / objetivo

- Dar git push nos commits pendentes e rodar a Fase 11: abertura do dia, quantidade inicial, ledger, ajuste, quantidade atual e `ACABOU`.

### Tentativa / implementação

- Os 7 commits locais da Fase 10 e anteriores foram enviados para `origin/main`.
- Migration `008_inventory` cria `_inventory_days`, `_inventory_opening_items` e `_inventory_movements` (schema version 8). A 007 continua gravando a versão 7. Abertura e movimentos têm UUID próprio; quantidade é inteira.
- A dona abre o dia informando a quantidade inicial de cada produto `stock_tracked`. Físico = abertura + movimentos. Ajuste é só da dona, com motivo, e não deixa o estoque negativo. Zero aparece `ACABOU`. Reservado ainda é 0.
- Dona e funcionário leem o estoque. `getHealth` segue público.

### Resultado

- Fase 11 concluída sobre o ambiente E2E isolado e o preview local.
- Commits da Fase 10 e da Fase 11 foram enviados ao GitHub.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Vendas (baixa atômica), reservas reais, fiado, crédito como movimento e caixa permanecem na Fase 12 em diante. O seed usa Coxinha 10 e Suco de uva 0 (`ACABOU`). Brigadeiro não controla estoque.

### Impacto técnico

- domínio de quantidade inteira, abertura e ajuste
- `MemoryStock` + `AppApi` de estoque; `Code.gs` com as mesmas regras
- UI após o login: lista do dia e formulário de ajuste só da dona; textos de health do smoke inalterados
- README, Implementation Plan e referências

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 125 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 14 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (health público, sem login). A primeira chamada no deploy novo estourou o timeout enquanto aplicava a migration 008; a repetição passou.

### Pendências / próxima versão

- Não iniciar a Fase 12 (carrinho e PIX) sem pedido explícito.

## 2026-08-13 13:56 — Implementada a Fase 10: produtos e categorias

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 10

### Pedido / objetivo

- Rodar a Fase 10: produtos/categorias, preço em centavos, desconto, flags de estoque e reserva, ativo/inativo, histórico de preço e item avulso só da dona.

### Tentativa / implementação

- Migration `007_products` cria `_product_categories`, `_products`, `_product_price_history` e `_ad_hoc_items` (schema version 7). A 006 continua gravando a versão 6; IDs continuam UUID; atualizações são append.
- Preço fica em centavos inteiros. BRL (`R$ 5,50`) é só exibição. Categorias iniciais: Salgados, Bebidas, Doces, Outros.
- Troca de preço fecha o período anterior e abre um id novo. Inativo preserva o cadastro. Flags `stock_tracked` e `reservable` existem; não há estoque diário nem reservas reais.
- Item avulso é só da dona e não entra no cardápio. Dona e funcionário leem/escrevem produtos. `getHealth` segue público.

### Resultado

- Fase 10 concluída sobre o ambiente E2E isolado e o preview local.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Estoque diário, vendas, fiado, crédito como movimento, caixa, reservas reais e envio de WhatsApp permanecem na Fase 11 em diante. O seed E2E e o preview local usam cardápio fictício (Coxinha, Suco de uva, Brigadeiro).

### Impacto técnico

- domínio de dinheiro, produto, histórico de preço e item avulso
- `MemoryCatalog` + `AppApi` de produtos; `Code.gs` com as mesmas regras
- UI após o login: lista de produtos, formulário em reais→centavos, desativar e item avulso só da dona; textos de health do smoke inalterados
- README, Implementation Plan e referências

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 120 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 13 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (health público, sem login).

### Pendências / próxima versão

- Não iniciar a Fase 11 (estoque diário) sem pedido explícito.

## 2026-08-13 13:26 — Implementada a Fase 9: responsáveis e irmãos

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 9

### Pedido / objetivo

- Ir para a Fase 9: vários responsáveis, um principal, flag WhatsApp, irmãos, histórico de vínculo e idade operacional para pedir responsável.

### Tentativa / implementação

- Migration `006_guardians` cria `_guardians`, `_student_guardians`, `_student_account_authorizations` e `_settings` (schema version 6). A 005 continua gravando a versão 5; IDs continuam UUID; atualizações são append.
- Nome do responsável é obrigatório. Telefone é opcional (só dígitos, 10–13). WhatsApp é só uma flag; não há envio.
- O primeiro vínculo vira principal se ainda não houver um. Trocar o principal rebaixa o anterior. Desvincular fecha o histórico (`active=false`, `ended_at`).
- Aluno menor que a idade configurada (padrão 18) e sem principal aparece como “precisa de responsável”; o cadastro do aluno não é bloqueado.
- Irmãos compartilham pelo menos um responsável ativo. Autorização é direcional, recusa a própria conta e recusa quem não é irmão. Flags de crédito no vínculo ficam gravadas; o ledger de crédito permanece para fase posterior.
- Dona e funcionário leem/escrevem responsáveis. Só a dona altera `require_guardian_below_age`. `getHealth` segue público.

### Resultado

- Fase 9 concluída sobre o ambiente E2E isolado e o preview local.
- Nenhum ID Google, token, telefone real ou dado de planilha foi versionado.

### Diferenças do pedido

- Produtos, vendas e envio de WhatsApp permanecem na Fase 10 em diante. O seed E2E e o preview local usam nomes fictícios (Maria Souza, Paulo Nunes) e telefones de teste.

### Impacto técnico

- domínio de telefone, perfil de responsável, vínculo, irmãos e setting de idade
- `MemoryRoster` + `AppApi` de responsáveis/irmãos; `Code.gs` com as mesmas regras
- UI após o login: lista de responsáveis, flag WhatsApp, autorização entre irmãos e idade operacional; textos de health do smoke inalterados
- README, Implementation Plan e referências

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 114 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 12 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (health público, sem login).

### Pendências / próxima versão

- Não iniciar a Fase 10 (produtos/categorias) sem pedido explícito.

## 2026-08-13 13:12 — Implementada a Fase 8: ano letivo, turmas e alunos

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 8

### Pedido / objetivo

- Ir para a Fase 8: nascimento ou idade aproximada, histórico de matrícula, ativo/inativo, reativação com revisão e homônimos.

### Tentativa / implementação

- Migration `005_students` cria `_school_years`, `_classrooms`, `_students` e `_student_enrollments` (schema version 5). IDs continuam UUID; atualizações são append.
- Idade: data de nascimento **ou** idade aproximada + ano de referência. A aproximada avança por ano e aparece com `~`.
- Homônimos permanecem cadastros distintos e aparecem com idade e turma diferentes.
- Reativar exige marcar que o cadastro foi revisado. Troca de turma fecha a matrícula anterior.
- Dona e funcionário leem/escrevem alunos. `getHealth` segue público. Sem responsáveis (Fase 9).

### Resultado

- Fase 8 concluída sobre o ambiente E2E isolado e o preview local.
- Nenhum ID Google, token ou dado de planilha foi versionado.

### Diferenças do pedido

- Responsáveis, irmãos e WhatsApp permanecem na Fase 9. O seed E2E e o preview local usam nomes fictícios (duas Ana Souza e um Bruno Lima).

### Impacto técnico

- domínio de idade/perfil/matrícula/homônimo/reativação
- `MemoryRoster` + `AppApi` de alunos; `Code.gs` com as mesmas regras
- UI de cadastro após o login; textos de health do smoke inalterados
- README, Implementation Plan e referências

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 107 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 11 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (health público, sem login).

### Pendências / próxima versão

- Não iniciar a Fase 9 (responsáveis e irmãos) sem pedido explícito.

## 2026-08-13 13:03 — Implementada a Fase 7: auth, papéis e sessão

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 7

### Pedido / objetivo

- Executar a Fase 7: dona, funcionário, sessão, autorização no backend, sem backdoor, com login/role no E2E.

### Tentativa / implementação

- Papéis `owner` (dona) e `staff` (funcionário), checados no servidor. Sem senha mestra, `skipAuth` ou promoção automática a dona.
- Migration `004_users` cria `_users` e `_sessions` (schema version 4). IDs/tokens são UUID; número da linha é recusado.
- `loginE2E` só no ambiente E2E e recusa PROD. `loginWithGoogle` usa o subject Google, não devolve e-mail e não cadastra usuário sozinho.
- Funções privadas (`resetE2E`, `seedE2E`, probe, backup, restore) exigem sessão; `getHealth` continua público. Trigger de backup segue sem token de browser.
- `AppApi` ganha `getSession`, `loginE2E` e `logout`. O token fica no adapter (`sessionStorage`); a UI mostra só o papel. Login local/E2E sem campo de senha.

### Resultado

- Fase 7 concluída sobre o ambiente E2E isolado.
- Nenhum ID Google, token ou dado de planilha foi versionado.

### Diferenças do pedido

- Cadastro de alunos permanece na Fase 8. `loginE2E` é fixture de teste, não um atalho de PROD.

### Impacto técnico

- `src/domain/auth.ts`, `authorize.ts`, `session.ts`; `src/server/auth/e2e-users.ts`
- `apps-script/src/Code.gs`, escopo `userinfo.email`
- `AppApi` / Fake / `google.script.run`; UI de sessão
- README, Implementation Plan e referências de arquitetura, segurança, modelo e testes

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 97 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 10 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (health público, sem login).

### Pendências / próxima versão

- Não iniciar a Fase 8 (alunos) sem pedido explícito.
- Em DEV/PROD futuro, cadastrar usuários reais em `_users` antes do login Google; o Web App E2E anônimo continua só com `loginE2E`.

## 2026-08-13 12:52 — Implementada a Fase 6: backup Drive, retenção e restore foundation

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 6

### Pedido / objetivo

- Iniciar a Fase 6: backup no Drive, pasta/config, pré-migration, trigger periódico, retenção, health status e restore foundation.

### Tentativa / implementação

- Cópia da planilha E2E para uma pasta de backup no Drive, com nome/descrição só de ambiente, timestamp e versões (sem IDs).
- Pasta e retenção (14 dias) em Script Properties; trigger diário `runScheduledBackup` criado uma vez.
- Migration `003_backups` cria `_backups`. Backup pré-migration roda antes de migrations pendentes; se o Drive não autorizar, o schema E2E ainda aplica.
- `getHealth` passa a informar `schemaVersion`, `backupConfigured` e `lastBackupAt`, sem IDs de planilha/pasta/arquivo.
- Restore foundation: confirmação obrigatória, UUID do backup, backup atual antes, sem mesclar automaticamente. Recusa PROD.

### Resultado

- Fase 6 concluída sobre o ambiente E2E isolado.
- Nenhum ID Google, token ou dado de planilha foi versionado.

### Diferenças do pedido

- O restore não substitui a planilha ao vivo; só valida o snapshot, protege o estado atual e recusa merge. Auth/usuários ficam na Fase 7.

### Impacto técnico

- `src/server/backup/*`, migration `003_backups`, `setupSchema` com hook pré-migration
- `apps-script/src/Code.gs`, escopos Drive e ScriptApp
- `AppHealth` ampliado; UI do smoke inalterada
- testes de nome/retenção/trigger/backup/restore
- README, Implementation Plan e referências

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 82 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 9 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou.

### Pendências / próxima versão

- Não iniciar a Fase 7 (auth e usuários) sem pedido explícito.
- Na conta Google, autorizar Drive na primeira execução de backup se o health ainda mostrar backup não configurado.

## 2026-08-13 12:40 — Implementada a Fase 5: locks, batch e idempotência

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 5

### Pedido / objetivo

- Iniciar a Fase 5: `withScriptLock`, Advanced Sheets Service, batch mutation builder, `spreadsheets.batchUpdate`, `request_id` e `_operation_requests`, com testes de retry e double submit.

### Tentativa / implementação

- `request_id` é UUID; número da linha é recusado.
- `withScriptLock` adquire `LockService`, executa o trabalho e libera no `finally`; timeout é retryable.
- Builder de `spreadsheets.batchUpdate` (`appendCells`) e aplicação em lote.
- Aba `_operation_requests` via migration `002_operation_requests` (schema version 2). A migration `001_foundation` não foi reescrita.
- Operação crítica grava o resultado `completed` no mesmo batch; retry/double submit com o mesmo `request_id` devolvem o resultado já gravado sem duplicar.
- Probe E2E `probeIdempotentOperation` no Apps Script (não entrou no `AppApi`).
- Advanced Sheets Service habilitado no manifesto E2E. `AppApi` continua só com `getHealth`.

### Resultado

- Fase 5 concluída sobre o ambiente E2E isolado.
- Nenhum ID Google, token ou dado de planilha foi versionado.

### Diferenças do pedido

- O probe de idempotência é função de servidor E2E, não contrato de frontend. Vendas/pagamentos reais continuam nas fases posteriores.

### Impacto técnico

- `src/domain/request-id.ts`, `src/server/locks/*`, `src/server/sheets/batch.ts`, `src/server/operations/idempotent.ts`
- `src/server/sheets/schema.ts`, `migrations.ts`, `setup-schema.ts`
- `apps-script/src/Code.gs`, `apps-script/src/appsscript.json`
- testes unitários/integração de lock, batch, retry e double submit
- README, Implementation Plan, convenções e referências de arquitetura/testes

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 70 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 9 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (Web App E2E isolado; `getHealth` aplica a migration 002).

### Pendências / próxima versão

- Não iniciar a Fase 6 (backup e saúde) sem pedido explícito.

## 2026-08-13 12:34 — Implementada a Fase 4: schema, migrations e repositório genérico

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 4

### Pedido / objetivo

- Depois de consertar o smoke remoto, avançar à Fase 4: `_meta`, `_schema_migrations`, schemas em código, validação de cabeçalhos, IDs UUID, serialização, migration runner e `setupSchema` idempotente com recusa de PROD.

### Tentativa / implementação

- Schema de fundação em código (`_meta`, `_schema_migrations`) com migration `001_foundation`.
- `setupSchema` idempotente no domínio TypeScript e no Apps Script; recusa PROD e migrations fora do catálogo; `HEADER_MISMATCH` se a aba já tem dados com cabeçalho errado.
- Repositório genérico de registros por UUID; número da linha nunca é identidade.
- `AppApi` permanece só `getHealth`. Locks, batch e `_operation_requests` não foram iniciados.

### Resultado

- Fase 4 concluída sobre o ambiente E2E isolado.
- Nenhum ID Google, token ou dado de planilha foi versionado.

### Diferenças do pedido

- O repositório desta fase é genérico (append/list/findById). Repositórios de alunos/vendas ficam para as fases de cadastro.

### Impacto técnico

- `src/domain/ids.ts`, `src/server/sheets/*`, `src/server/repositories/sheet-repository.ts`
- `apps-script/src/Code.gs` (`setupSchema`)
- testes unitários/integração de schema, serialização, migrations e repositório
- referências de arquitetura/testes, Implementation Plan e README

### Testes

- `npm run format:check` / `lint` / `typecheck` / `version:check` / `validate:skill`: passou.
- `npm test`: 52 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 9 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste Chromium passou (Web App E2E isolado, dados fictícios).

### Pendências / próxima versão

- Não iniciar a Fase 5 (locks/batch/idempotência) sem pedido explícito.

## 2026-08-13 12:29 — Corrigido o smoke remoto do Web App E2E

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 3

### Pedido / objetivo

- O smoke `remote-readiness.spec.ts` falhava ao abrir o Web App E2E. Corrigir e seguir.

### Tentativa / implementação

- `page.goto('/')` com `baseURL=.../exec` resolvia para `https://script.google.com/` (docs do Apps Script). O teste agora navega para a URL `/exec` completa e rejeita docs/editor.
- O bundle Vite era inlined no `<head>` como script clássico e rodava antes de `#app`, deixando a tela bege sem título. O JS agora vai no fim do `body`.
- O Web App E2E auto-configura `ENVIRONMENT=E2E` no primeiro `getHealth` e usa acesso anônimo só neste ambiente fictício.

### Resultado

- Smoke remoto passou no Chromium.
- A Fase 3 deixa de ficar bloqueada no healthcheck.

### Diferenças do pedido

- Nenhuma: o conserto foi o necessário para o smoke verde.

### Impacto técnico

- `scripts/build-apps-script.mjs`, `playwright.remote.config.ts`, `src/server/e2e-web-app-url.ts`
- `tests/e2e/remote/remote-readiness.spec.ts`
- `apps-script/src/Code.gs`, `apps-script/src/appsscript.json`
- README com a regra da URL `/exec`

### Testes

- `npm run test:e2e:remote`: 1 teste passou após o conserto.
- Checks locais da fundação permaneceram verdes na entrega da Fase 4.

### Pendências / próxima versão

- Nenhuma da Fase 3; a Fase 4 segue nesta mesma entrega.

## 2026-08-13 12:16 — Iniciada a Fase 3 com ambiente E2E isolado

**Origem:** Pedido do usuário
**Status:** Parcial
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 3

### Pedido / objetivo

- Iniciar a Fase 3: Apps Script E2E, planilha E2E, config separada, seed/reset, proteção contra reset PROD e Playwright remoto.

### Tentativa / implementação

- Criados `assertE2EEnvironment`, `resetE2EState` e `seedE2EState` no domínio, com recusa explícita de PROD/DEV/LOCAL.
- Criado Apps Script E2E (`doGet`, `getHealth`, `configureE2EEnvironment`, `resetE2E`, `seedE2E`) e bundle HTML Service.
- Frontend passa a usar `google.script.run` só quando o host Apps Script existe; o E2E local continua na `FakeAppApi`.
- Playwright remoto lê `E2E_BASE_URL` e ignora a suíte se a URL não existir. CI não executa remoto e não usa secrets.
- Criados na conta Google um projeto Apps Script E2E e uma planilha vinculada. `.clasp.json` permanece fora do Git.
- `clasp push` e um deployment Web App E2E versionado foram feitos.
- `clasp run configureE2EEnvironment` falhou por permissão da Execution API; as Script Properties ainda precisam de autorização interativa no editor.

### Resultado

- Código, testes e projeto Google E2E isolado existem.
- A Fase 3 permanece parcial até executar `configureE2EEnvironment` no editor e o smoke autenticado com `E2E_BASE_URL`.
- Nenhum ID Google, token ou dado de planilha foi versionado. Nenhum reset/seed foi executado contra PROD.

### Diferenças do pedido

- Este repositório não tinha a Fase 2 (Web App DEV). O Web App mínimo necessário para o ambiente E2E foi criado como projeto E2E, sem completar o fluxo DEV da Fase 2.
- O smoke Playwright remoto não foi afirmado como executado: o Web App está restrito à conta proprietária e o healthcheck ainda não foi configurado no editor.

### Impacto técnico

- `src/domain/environment.ts`, `src/domain/e2e-lifecycle.ts`
- `apps-script/src/Code.gs`, `apps-script/src/appsscript.json`
- adapter `GoogleScriptAppApi`, build `scripts/build-apps-script.mjs`
- `tests/unit/*`, `tests/integration/apps-script-e2e-server.test.ts`, `tests/e2e/remote/`
- README, plano, referências de arquitetura/testes, `.env.example`, `.clasp.json.example`

### Testes

- `npm run format:check` / `lint` / `typecheck`: passou.
- `npm test`: 30 testes passaram.
- `npm run build`: passou e gerou os três arquivos Apps Script.
- `npm run test:e2e:local`: 9 testes Chromium passaram.
- `npm run test:e2e:remote`: 1 teste ignorado (sem `E2E_BASE_URL`).
- `clasp push`: enviou manifesto, `Code.gs` e `Index.html`.
- `clasp run configureE2EEnvironment`: falhou por permissão da Execution API.

### Pendências / próxima versão

- No editor (`clasp open-script`), executar `configureE2EEnvironment` uma vez e aceitar a autorização Google.
- Rodar o smoke com `E2E_BASE_URL` apontando para o deployment E2E, nunca para PROD.
- Não iniciar a Fase 4 antes de concluir essas duas pendências.

## 2026-08-13 12:10 — Revisão técnica pós-Fase 1 (hardening de convenções)

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Revisão das Fases 0–1; Fase 2 ausente neste repositório; Fase 3 não iniciada

### Pedido / objetivo

- Conectar o GitHub `Luc4sdevw3b/CantinaCursor`.
- Auditar Fases 0–2 e incorporar melhorias de engenharia sem reimplementar fases nem avançar à Fase 3.

### Tentativa / implementação

- Confirmado: este repositório tem Fases 0 e 1. A Fase 2 (`clasp`, Web App DEV, `google.script.run`) **não existe aqui** e não foi reimplementada.
- Remote `origin` apontado para o repositório vazio `CantinaCursor`.
- Padronizados Node 22 LTS (`.nvmrc`), `engines`, `npm` e `package-lock.json`.
- Completados scripts `lint:fix`, `test:watch`, `version:check` e `validate:skill`.
- `VERSION` passou a ser checada contra `package.json` e `src/app-version.ts`.
- Criada a referência `engineering-conventions.md` (dinheiro, estoque, datas, IDs, request_id, `Result`).
- `AppApi` permanece mínimo (`getHealth`); marcado adapter `fake`.
- E2E local expandido para preview + fake, temas, health, console limpo e bloqueio de rede externa.
- `.gitignore` ampliado; nenhum secret encontrado no histórico.
- CI passou a usar `.nvmrc`, `validate:skill` e `version:check`.
- Documentados LOCAL/DEV/E2E/PROD, smoke PROD não destrutivo, segurança transversal e limites do gateway WhatsApp futuro.
- Removido o `SKILL_VALIDATION.txt` estático; a validação reproduzível é o script.

### Resultado

- Fundação da Fase 1 endurecida e documentada.
- Fase 2 não foi criada. Fase 3 não foi iniciada.

### Diferenças do pedido

- O pedido tratava a Fase 2 como concluída; neste workspace ela não estava presente. A revisão não a reimplementou.
- `Result` foi definido e testado, mas `getHealth` não foi convertido para `Result` para não quebrar o contrato já estável.
- Flash de tema reduzido com script inline simples, sem framework extra.

### Impacto técnico

- `.nvmrc`, `package.json`, `.gitignore`, `scripts/`
- `src/domain/result.ts`, `src/web/shared/*`, `index.html`
- `tests/e2e/local/smoke.spec.ts`, `tests/unit/result.test.ts`
- `.github/workflows/ci.yml`
- Skill, referências, Implementation Plan, README e changelog

### Testes

- `npm ci` em instalação limpa: passou.
- `npm run validate:skill`: OK.
- `npm run version:check`: `0.1.0-dev` consistente.
- `npm run format:check` / `lint` / `typecheck`: passou.
- `npm test`: 11 testes passaram.
- `npm run build`: passou.
- `npm run test:e2e:local`: 9 testes Chromium passaram.
- `npm audit`: 0 vulnerabilidades.

### Pendências / próxima versão

- Push para `CantinaCursor` para o Actions hospedado rodar.
- Fase 2 continua fora de escopo até pedido explícito.

## 2026-08-13 11:55 — Implementada a fundação testável da Fase 1

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 1

### Pedido / objetivo

- Configurar package/lockfile, TypeScript, lint, build, Vitest e Playwright.
- Criar a primeira tela local da Cantina, com temas Sistema/Claro/Escuro.
- Criar o contrato `AppApi`, uma implementação fake e smoke E2E local.
- Preparar CI quando não houver dependência de credenciais.
- Parar antes de `clasp`, Web App DEV e qualquer item da Fase 2.

### Tentativa / implementação

- Criada aplicação frontend local com Vite e TypeScript estrito.
- Configurados ESLint, Prettier, Vitest (pool `threads`) e Playwright.
- Criados `AppApi` e `FakeAppApi` com healthcheck local sem planilha.
- Implementada tela placeholder responsiva e acessível, com persistência da preferência de tema.
- Adicionados testes unitários de tema/API, integração da API fake e E2E local em Chromium.
- Adicionado workflow GitHub Actions para format, lint, typecheck, unit, integração, build e E2E local.
- Fixada a versão das dependências no manifesto e no lockfile para instalações reproduzíveis.
- A formatação automática foi aplicada aos documentos do baseline sem mudar suas regras.

### Resultado

- Fase 1 concluída localmente com todos os checks aplicáveis verdes.
- Nenhum Apps Script, Spreadsheet, `.clasp.json`, secret ou dado real foi criado/acessado.

### Diferenças do pedido

- O workflow foi preparado, mas não executado no GitHub porque este workspace ainda não tem remote.
- O E2E remoto permanece explicitamente ignorado até existirem os ambientes das Fases 2 e 3.

### Impacto técnico

- `package.json` e `package-lock.json`
- `src/`, `tests/` e `index.html`
- configurações TypeScript, Vite, Vitest, Playwright, ESLint e Prettier
- `.github/workflows/ci.yml`
- `README.md`

### Testes

- `npm run format:check`: passou.
- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: 9 testes passaram (7 unitários e 2 de integração).
- `npm run build`: passou.
- `npm run test:e2e:local`: 2 testes Chromium passaram.
- `npm audit`: 0 vulnerabilidades encontradas.

### Pendências / próxima versão

- Configurar o remote GitHub deste workspace e fazer push para executar o CI hospedado.
- A Fase 2 (`clasp` + Web App DEV) não foi iniciada, conforme solicitado.

## 2026-08-13 11:51 — Inicializado o baseline Git da Fase 0

**Origem:** Pedido do usuário
**Status:** Implementado
**Versão alvo:** 0.1.0-dev
**Fase:** Fase 0

### Pedido / objetivo

- Executar o prompt inicial, implementando somente as Fases 0 e 1.
- Estabelecer o Git como fonte de verdade antes do código da aplicação.

### Tentativa / implementação

- Extraído o kit documental para a raiz deste repositório.
- Inicializado o repositório Git local.
- Mantida a versão de desenvolvimento `0.1.0-dev` já definida no kit.
- Adicionados `.gitignore` seguro e README principal.
- Preservado integralmente o kit documental recebido.
- Remote GitHub não foi ligado: o repositório `Luc4sdevw3b/Cantina` já contém trabalho posterior de outra pasta.

### Resultado

- Baseline de governança preparado para o primeiro commit.

### Diferenças do pedido

- O remote GitHub não foi configurado neste workspace para não misturar com o histórico já existente em `Luc4sdevw3b/Cantina`.

### Impacto técnico

- `.gitignore`
- `README.md`
- `VERSION`
- documentação e Skill existentes na raiz

### Testes

- Não se aplicam à Fase 0 documental; os testes automatizados começam na Fase 1.

### Pendências / próxima versão

- Implementar somente a Fase 1 e parar antes da Fase 2.
- Configurar um remote GitHub deste workspace quando o usuário decidir o destino.

## 2026-08-13 10:59 — Fechado o algoritmo do Inbox WhatsApp V2.1 por mensagem

**Origem:** Pedido do usuário  
**Status:** Implementado  
**Versão alvo:** 0.1.0-dev  
**Fase:** Planejamento das Fases 27–31

### Pedido / objetivo

- Usar a API oficial do WhatsApp sem Gemini/IA.
- Tratar cada mensagem individualmente, em ordem das mais antigas.
- A dona escolher manualmente uma ou mais ações por mensagem.
- Adicionar botão `Atualizar mensagens` e verificador de duplicidade/resposta/estado.
- Não responder pelo programa; a dona responde no celular.
- Permitir descartar, marcar respondida/não precisa responder e ações em lote seguras.
- Definir todos os caminhos de reserva, alteração, cancelamento, no-show, retirada, pagamento, consulta, PIX, cardápio, contatos e desfazer.
- Guardar histórico completo de cada aluno com data e hora.

### Tentativa / implementação

- Criada referência `whatsapp-inbox-v2.1.md`.
- Inbox passou a usar mensagem, não conversa, como unidade de trabalho.
- Separados status de tratamento e status de resposta.
- Definido verificador determinístico, sem classificação semântica.
- Definido uso de eventos de saída/echo do WhatsApp Business para auxiliar verificação de resposta quando houver vínculo inequívoco.
- Definida retenção configurável de mensagens, padrão 90 dias após tratamento/descartar; pendentes não expiram.
- Removido estado `Preparada` e retirada parcial persistente de reservas.
- Definida prioridade presencial com override explícito de unidade reservada.
- Definido `Desfazer tratamento desta mensagem` como tentativa de reverter todas as ações vinculadas, sempre com preview e reversões rastreáveis.
- Implementation Plan ampliado com um Marco específico de WhatsApp oficial V2.1 e fases de gateway, Inbox, verificador, ações e histórico.
- Testes automatizados/E2E do Inbox e webhook adicionados à especificação.

### Resultado

- Regras de negócio do Inbox V2.1 consolidadas e prontas para implementação futura.
- Nenhuma mensagem real, credencial Meta ou planilha PROD foi criada/acessada.

### Diferenças do pedido

- O botão `Atualizar mensagens` reconcilia o Inbox com eventos já recebidos por webhook; ele não promete buscar arbitrariamente mensagens faltantes do WhatsApp.
- Resposta pelo celular só é marcada automaticamente para uma mensagem específica quando o evento oficial permitir ligação inequívoca; caso contrário, a dona confirma manualmente.

### Impacto técnico

- `.agents/skills/cantina-v2appscript/SKILL.md`
- `.agents/skills/cantina-v2appscript/references/whatsapp-inbox-v2.1.md`
- `architecture.md`
- `business-rules.md`
- `data-model-sheets.md`
- `reservations.md`
- `testing-e2e-ci.md`
- `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md`

### Testes

- Validação estrutural da Skill será executada após atualização do kit.
- Testes de aplicação não se aplicam ainda: projeto continua em fase documental.

### Pendências / próxima versão

- Implementar somente quando as fases anteriores do motor de reservas/financeiro estiverem prontas, conforme Implementation Plan.

## 2026-08-12 08:59 — Criada a Cantina V2 AppScript com reservas, Git e testes desde o início

**Origem:** Pedido do usuário  
**Status:** Implementado  
**Versão alvo:** 0.1.0-dev  
**Fase:** Fase 0

### Pedido / objetivo

- Criar nova Skill e novo Implementation Plan `cantina-v2appscript`.
- Apps Script + Google Sheets + `clasp`, sem Electron.
- Incluir todas as regras já definidas para a cantina.
- Incluir reservas/pré-pedidos por link compartilhado no WhatsApp.
- Commit Git em cada mudança lógica e commit/tag em cada nova versão.
- Registrar no changelog toda modificação pedida ou feita pela IA, inclusive falhas.
- Testes automatizados desde o início, incluindo E2E.

### Tentativa / implementação

- Criada Skill repo-scoped.
- Criado plano em 34 fases (0–33).
- Separados DEV/E2E/PROD.
- Definidos Vitest + Playwright.
- Definidos LockService, batch updates atômicos, IDs imutáveis e idempotência.
- Definidas regras de Git/GitHub, changelog e release.
- Adicionado módulo completo de reservas.

### Resultado

Baseline documental pronto para iniciar código.

### Diferenças do pedido

- Nome técnico usa hífen por convenção de Skill: `cantina-v2appscript`.
- A regra de Git foi ampliada: cada mudança lógica recebe commit; cada release recebe commit de versão + tag.

### Impacto técnico

Somente Skill/documentação. Nenhum Apps Script, planilha PROD ou credencial criado ainda.

### Testes

Validação estrutural da Skill. Testes de aplicação começam na Fase 1.

### Pendências / próxima versão

Nenhuma neste baseline.
