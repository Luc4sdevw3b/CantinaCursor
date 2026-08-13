# Cantina V2 AppScript

Aplicação web da cantina, planejada para Google Apps Script + Google Sheets + Google Drive.

O projeto está na Fase 1 (`0.1.0-dev`). Consulte:

- `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md` para o plano por fases;
- `V2APPSCRIPT_CHANGELOG.md` para o histórico auditável;
- `START_PROMPT_ANTIGRAVITY.md` para o escopo inicial;
- `.agents/skills/cantina-v2appscript/` para as regras de engenharia do repositório.

## Segurança

Não versione `.clasp.json`, `.clasprc.json`, credenciais, tokens, secrets ou dados reais.

## Desenvolvimento local

Requer Node.js 22 ou mais recente.

```bash
npm ci
npm run dev
```

Validação completa da Fase 1:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e:local
```

A Fase 2 (`clasp` + Web App DEV) ainda não foi iniciada.
