# Arquitetura

## Objetivo

Web app da cantina acessível por navegador, com Apps Script no backend, Google Sheets como armazenamento estruturado e Drive para backups. Online-first; offline completo fica fora da V2 AppScript.

## Duas superfícies

### App privado

Dashboard, vendas, alunos, responsáveis, produtos, estoque, fiado, pagamentos, créditos, caixa, agenda, reservas, anotações, relatórios e configurações.

### Portal público de reservas

Link enviado no WhatsApp. Não expõe alunos, responsáveis, dívidas, créditos ou histórico. Mostra apenas catálogo reservável, disponibilidade, horários e formulário mínimo.

## Stack

- Google Apps Script Web App + HTML Service.
- `google.script.run` em produção.
- TypeScript no domínio/frontend com build simples para Apps Script.
- `clasp`.
- Google Sheets.
- Google Drive.
- Advanced Sheets Service para batch updates críticos.
- `LockService`.
- Vitest.
- Playwright.
- GitHub Actions.

## Ambientes

Há quatro contextos. **E2E local (Playwright + FakeAppApi)** não é o ambiente Google E2E da Fase 3.

### LOCAL

Preview Vite na máquina. `FakeAppApi`. Sem Apps Script, Sheets, Drive, clasp, login Google ou WhatsApp. É o alvo do `npm run test:e2e:local`.

### DEV

Desenvolvimento com Google real quando necessário: Apps Script + Spreadsheet DEV com dados fictícios.

### E2E

Ambiente isolado de testes, criado na Fase 3: Apps Script/deployment + Spreadsheet E2E resetável, só para automação.

### PROD

Apps Script + Spreadsheet PROD, dados reais. **Testes automatizados destrutivos nunca rodam em PROD.**

O futuro `smoke PROD` da fase de release é verificação manual, read-only, ou comprovadamente não destrutiva. Não é suíte de regressão contra a planilha real.

IDs/configuração ficam em Script Properties/GitHub Secrets, não hardcoded.

## Estrutura sugerida

```text
src/
  domain/
  server/
    services/
    repositories/
    sheets/
    auth/
    backup/
    logging/
  web/
    admin/
    reservation/
    shared/
tests/
  unit/
  integration/
  e2e/local/
  e2e/remote/
scripts/
.github/workflows/
```

## Adapter do frontend

Definir `AppApi` com funções específicas do domínio, nunca ranges/SQL/Sheets genéricos.

Até a Fase 9 o contrato `AppApi` inclui sessão, cadastro de alunos e responsáveis (vários por aluno, um principal, irmãos e autorização direcional). WhatsApp é só uma flag; não há envio. Não antecipar produtos, vendas, estoque, fiado, crédito como movimento, caixa ou reservas.

O adapter `google.script.run` é usado no Web App Apps Script (ambiente E2E isolado nesta fase). **E2E local usa somente `FakeAppApi`.** Isso permite Playwright desde o início sem Google.

## Escritas críticas

1. adquirir `ScriptLock`;
2. reler estado relevante;
3. validar;
4. gerar IDs/request_id;
5. construir mutações;
6. aplicar por batch atômico quando possível;
7. liberar lock em `finally`.

Aplicar a venda, pagamentos familiares, reservas, entrega e estornos.

## Fonte de verdade

- Spreadsheet PROD: dados operacionais.
- Git/GitHub: código.
- changelog: narrativa da evolução.
- tags/releases: versões publicadas.

## Datas

- datas civis `YYYY-MM-DD`;
- timestamps consistentes;
- timezone `America/Sao_Paulo`;
- UI: `Segunda-feira • 17/08/26`.

## Tema

Sistema, Claro, Escuro.

## Fora da arquitetura

Electron, SQLite, offline completo, API bancária/PIX automática e ERP completo.

## WhatsApp oficial V2.1

A arquitetura principal continua:

```text
Apps Script
Google Sheets
Google Drive
```

Exceção permitida, ainda não implementada: um **gateway mínimo** do webhook oficial do WhatsApp Business/Cloud API.

```text
Meta webhook
  ↓
gateway mínimo (transporte/segurança)
  ↓
Apps Script
  ↓
Sheets Inbox
```

Esse gateway futuramente poderá:

- receber o webhook;
- validar a assinatura da Meta;
- validar a estrutura do payload;
- encaminhar o evento;
- devolver status HTTP.

Ele **não** poderá:

- interpretar semanticamente a mensagem;
- classificar reserva;
- criar venda;
- alterar estoque;
- criar dívida;
- calcular crédito;
- armazenar banco de negócio.

O gateway é infraestrutura de transporte/segurança, não o backend da Cantina. Se a persistência no Apps Script falhar, não deve mascarar sucesso definitivo; o retry oficial da Meta deve poder atuar.

No modo Coexistence, observar eventos de mensagens enviadas pela dona no WhatsApp Business/linked devices para auxiliar o verificador de respostas. O programa V2.1 continua sem enviar mensagens ao WhatsApp.

A página privada do Inbox usa `whatsapp-inbox-v2.1.md` como especificação.
