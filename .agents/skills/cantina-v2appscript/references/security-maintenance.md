# Segurança, backup, logs e manutenção

## Privacidade

Coletar o mínimo.
Portal público não retorna cadastro privado.

Nunca expor no portal:

- lista de alunos;
- telefones;
- dívidas;
- créditos;
- notas;
- histórico.

## Funções públicas vs privadas

Backend deve separar explicitamente.
Toda função privada valida sessão/role no servidor.
Não confiar em botão escondido.

Estratégia de autenticação deve ser implementada/testada antes de PROD.
Preferir identidade Google quando viável; se usar PIN/sessão própria, documentar e proteger.
Nunca usar senha mestra/backdoor.

## Secrets

Usar Script Properties/GitHub Secrets.
Nunca commitar `.clasprc.json`, tokens, refresh tokens ou credenciais.

## Backup

PROD:

- cópia do Spreadsheet no Drive;
- pasta configurada;
- timestamp + versão app/schema;
- antes de migration;
- periodicamente;
- antes de release estrutural.

Não depender apenas do histórico de versão do Sheets.

## Restore

Privilegiado.
Não mesclar automaticamente.
Fluxo:

1. backup atual;
2. validar snapshot;
3. restauração/reapontamento controlado;
4. validar schema;
5. smoke;
6. auditoria.

## Logs

Permitido:

- timestamp;
- app/schema version;
- environment;
- module;
- operation type;
- request_id técnico;
- error code;
- stack sem payload.

Proibido:

- nomes;
- telefones;
- WhatsApp;
- notas;
- itens;
- valores individuais;
- rows;
- secrets.

## Diagnóstico

Sem PII:

- app version;
- schema;
- environment;
- deploy;
- último backup;
- erros sanitizados.

## Segurança de reserva pública

- validação server-side;
- limites;
- cutoff;
- request_id;
- lock;
- recalcular preço/disponibilidade no servidor;
- rate limit/honeypot quando necessário.

Nunca confiar no total/preço enviado pelo browser.

## Abas técnicas

Ocultar/proteger.
Edição manual não é fluxo normal.
Proteção do Sheets é camada adicional, não única segurança.

## Auditoria

Registrar:

- desconto;
- juros;
- estorno;
- ajuste estoque;
- crédito;
- retirada caixa;
- config;
- reserva/cancelamento;
- schema/release relevante.

Retenção operacional configurável: indefinida ou pelo menos 1 ano.
Histórico financeiro essencial não é apagado pela retenção.
