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

### DEV
Apps Script + Spreadsheet DEV com dados fictícios.

### E2E
Apps Script/deployment + Spreadsheet E2E resetável, só para automação.

### PROD
Apps Script + Spreadsheet PROD, nunca usado por testes destrutivos.

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

Definir `AppApi` com funções específicas. Produção usa adapter de `google.script.run`; E2E local usa fake. Isso permite Playwright desde o início.

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

Recepção oficial de mensagens via WhatsApp Business Platform/Cloud API.

```text
Meta webhook
  ↓
gateway mínimo de validação de assinatura
  ↓
Apps Script
  ↓
Sheets Inbox
```

O gateway não contém regra de negócio e não classifica mensagens. Ele valida a origem e encaminha. Se a persistência no Apps Script falhar, não deve mascarar sucesso definitivo; o mecanismo de retry oficial deve poder atuar.

No modo Coexistence, observar eventos de mensagens enviadas pela dona no WhatsApp Business/linked devices para auxiliar o verificador de respostas. O programa V2.1 continua sem enviar mensagens ao WhatsApp.

A página privada do Inbox usa `whatsapp-inbox-v2.1.md` como especificação.
