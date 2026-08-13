# Cantina V2 AppScript

Aplicação web da cantina, planejada para Google Apps Script + Google Sheets + Google Drive.

O projeto está na Fase 3 (`0.1.0-dev`): ambiente E2E isolado. O E2E local da Fase 1 continua sendo preview + `FakeAppApi`. A Fase 2 (Web App DEV) não foi o alvo desta entrega.

Consulte:

- `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md` para o plano por fases;
- `V2APPSCRIPT_CHANGELOG.md` para o histórico auditável;
- `.agents/skills/cantina-v2appscript/` para as regras de engenharia.

## Ambientes

```text
LOCAL  → preview local + FakeAppApi (E2E local)
DEV    → desenvolvimento com Google real quando necessário
E2E    → ambiente isolado de testes (Fase 3)
PROD   → dados reais
```

`resetE2E` e `seedE2E` só rodam se `ENVIRONMENT=E2E`. Nunca em PROD. Testes automatizados destrutivos nunca usam a planilha PROD.

## Segurança

Não versione `.clasp.json`, `.clasprc.json`, credenciais, tokens, secrets ou dados reais. Secrets só em Script Properties ou GitHub Secrets.

## Desenvolvimento local

Requer Node.js 22 LTS (veja `.nvmrc`) e `npm`. O lockfile oficial é `package-lock.json`.

```bash
npm ci
npm run dev
```

### Comandos oficiais

```bash
npm run lint
npm run lint:fix
npm run format:check
npm run typecheck
npm test
npm run test:watch
npm run test:unit
npm run test:integration
npm run build
npm run preview
npm run test:e2e:local
npm run test:e2e:remote
npm run version:check
npm run validate:skill
```

O E2E local usa **somente** `vite preview` + `FakeAppApi`. Não chama Apps Script, Sheets, Drive, clasp, login Google, WhatsApp nem internet externa.

## Ambiente E2E no Google

1. Copie `.clasp.json.example` para `.clasp.json` (arquivo ignorado pelo Git).
2. Com o `clasp` já autenticado:

```bash
npm run build
clasp create --type sheets --title "Cantina V2 AppScript E2E" --rootDir apps-script/dist
npm run clasp:push
```

3. No editor (`clasp open-script`), execute **uma vez** a função `configureE2EEnvironment` e autorize o acesso à planilha E2E. Isso grava somente `ENVIRONMENT=E2E`, `SPREADSHEET_ID` e `APP_VERSION`.
4. Crie um deployment Web App restrito à sua conta:

```bash
clasp deploy --description "E2E"
clasp deployments
```

5. Para o smoke remoto autenticado:

```bash
E2E_BASE_URL='https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec' npm run test:e2e:remote
```

Não torne o Web App anônimo só para o teste passar. Nunca use uma planilha PROD. `resetE2E` / `seedE2E` recusam qualquer ambiente que não seja E2E.

Validação completa da fundação (sem Google):

```bash
npm ci
npm run validate:skill
npm run version:check
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e:local
npm run test:e2e:remote
```

`test:e2e:remote` sem `E2E_BASE_URL` é ignorado de propósito.

## GitHub Actions

O workflow `.github/workflows/ci.yml` roda no push/PR: Node conforme `.nvmrc`, `npm ci`, validação da Skill, `version:check`, lint, format, typecheck, unit, integração, build e E2E local. Sem secrets e sem E2E remoto.

Remote: `https://github.com/Luc4sdevw3b/CantinaCursor.git`.
