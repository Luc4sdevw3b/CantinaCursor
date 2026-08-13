# Cantina V2 AppScript

Aplicação web da cantina, planejada para Google Apps Script + Google Sheets + Google Drive.

O projeto está na Fase 1 (`0.1.0-dev`). A Fase 2 (`clasp` + Web App DEV) **não está neste repositório**. A Fase 3 não foi iniciada.

Consulte:

- `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md` para o plano por fases;
- `V2APPSCRIPT_CHANGELOG.md` para o histórico auditável;
- `.agents/skills/cantina-v2appscript/` para as regras de engenharia.

## Ambientes

```text
LOCAL  → preview local + FakeAppApi (E2E local)
DEV    → desenvolvimento com Google real quando necessário
E2E    → ambiente isolado de testes, criado na Fase 3
PROD   → dados reais
```

Testes automatizados destrutivos nunca rodam em PROD. O futuro smoke PROD é verificação manual, read-only ou comprovadamente não destrutiva.

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
npm run version:check
npm run validate:skill
```

O E2E local usa **somente** `vite preview` + `FakeAppApi`. Não chama Apps Script, Sheets, Drive, clasp, login Google, WhatsApp nem internet externa.

Validação completa da fundação:

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
```

## GitHub Actions

O workflow `.github/workflows/ci.yml` roda no push/PR: Node conforme `.nvmrc`, `npm ci`, validação da Skill, `version:check`, lint, format, typecheck, unit, integração, build e E2E local. Sem secrets.

Remote: `https://github.com/Luc4sdevw3b/CantinaCursor.git`.
