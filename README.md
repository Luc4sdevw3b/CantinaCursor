# Cantina V2 AppScript

Aplicação web da cantina, planejada para Google Apps Script + Google Sheets + Google Drive.

O projeto está na Fase 24 (`0.1.0-dev`): portal público de reservas com catálogo reservável, `ACABOU`, nome/turma digitados, contato opcional e código público. Gestão da dona fica na Fase 25.

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

O Web App E2E usa dados fictícios e pode ser aberto sem login (`ANYONE_ANONYMOUS`, executado como a conta que fez o deploy). Isso é só para o ambiente E2E, nunca para PROD.

A URL **obrigatória** é a do deployment `/exec`:

```text
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

Não use a documentação (`developers.google.com`), o editor (`/d/.../edit`) nem `script.google.com` sem `/macros/s/.../exec`.

```bash
npm run clasp:push
clasp deploy --description "E2E"
clasp deployments
E2E_BASE_URL='https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec' npm run test:e2e:remote
```

O primeiro `getHealth` configura `ENVIRONMENT=E2E`, aplica o schema e tenta um backup pré-migration na pasta E2E do Drive. `getHealth` continua público. O portal `?portal=reservas` também é público: catálogo reservável, disponibilidade/`ACABOU` e formulário mínimo, sem cadastro privado. Cadastro, vendas, fiado, crédito, caixa, estornos e reservas internas exigem sessão. Só a dona cria recreio. `resetE2E` / `seedE2E` / backup / restore exigem sessão de dona, recusam qualquer ambiente que não seja E2E, inclusive PROD, e usam `LockService`. Restore não mescla automaticamente. `loginE2E` é fixture só do E2E, não é backdoor de PROD. WhatsApp nesta fase é só uma flag; não há envio. Gestão da dona e reserva→venda ficam para as fases seguintes.

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
