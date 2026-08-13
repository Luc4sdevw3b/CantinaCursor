# V2 AppScript Change Log — Cantina

Este arquivo registra **tudo que acontecer com o projeto**, inclusive tentativas que não deram certo.

Regras:

- entrada mais nova no topo;
- registrar pedido do usuário, implementação da IA, decisão técnica, correção, tentativa falha, parcial, revert e release;
- não incluir dados reais, tokens ou secrets;
- não reescrever entradas antigas para alterar a história.

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
