# V2 AppScript Change Log — Cantina

Este arquivo registra **tudo que acontecer com o projeto**, inclusive tentativas que não deram certo.

Regras:

- entrada mais nova no topo;
- registrar pedido do usuário, implementação da IA, decisão técnica, correção, tentativa falha, parcial, revert e release;
- não incluir dados reais, tokens ou secrets;
- não reescrever entradas antigas para alterar a história.

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
