# Segurança, backup, logs e manutenção

## Regras transversais

- Minimizar dados coletados e exibidos.
- Testes usam somente dados fictícios; nunca dados reais de PROD.
- Logs sem nomes, telefones, WhatsApp, mensagens integrais, notas, itens ou valores financeiros individuais.
- A V2.1 não armazena mídia do WhatsApp.
- Retenção de mensagens do Inbox é configurável (padrão 90 dias após tratamento/descartar; pendentes não expiram).
- Toda mutação é validada de novo no servidor.
- XSS: não interpolar dados não confiáveis em HTML; preferir `textContent` e templates estáticos.
- Erro mostrado à dona não inclui stack trace nem payload.
- Superfícies públicas (portal de reservas) podem exigir rate limit/honeypot quando o fluxo existir.
- Códigos públicos de reserva não devem ser enumeráveis.
- Secrets somente em Script Properties ou GitHub Secrets; nunca no Git.
- Nenhuma senha mestra ou backdoor.

Estas regras valem desde agora. Funcionalidades futuras (portal, Inbox, rate limit) não são implementadas nesta revisão.

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
