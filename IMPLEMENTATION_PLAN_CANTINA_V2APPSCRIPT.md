# Implementation Plan — Cantina V2 AppScript

**Arquitetura:** Google Apps Script Web App + Google Sheets + Google Drive  
**Desenvolvimento:** local com `clasp` + Git/GitHub  
**Testes desde o início:** Vitest + Playwright  
**Ambientes:** DEV / E2E / PROD  
**Changelog:** registra sucesso, parcial, falha, revert e release  
**Versões:** commit + tag Git + versão imutável Apps Script

## Regras de execução

- Uma fase por vez.
- Antes de editar: Skill + plano + changelog.
- Toda fase tem teste.
- Toda mudança lógica: changelog + commit.
- Toda tentativa falha: changelog + commit do registro.
- Toda release: suíte verde + commit release + tag + deploy versionado.
- Nunca testar contra PROD. Testes automatizados destrutivos nunca usam a planilha PROD.
- O futuro smoke PROD é verificação manual, read-only ou comprovadamente não destrutiva.

# Marco A — Governança, Git e testes

## Fase 0 — Baseline

- Git init;
- `.gitignore`;
- `VERSION` = `0.1.0-dev`;
- Skill/plano/changelog;
- README;
- GitHub remote quando disponível.
  Commit sugerido: `chore: initialize Cantina V2 AppScript`.

## Fase 1 — Toolchain + testes desde o primeiro código

- package/lockfile;
- TypeScript;
- lint/format;
- Vitest;
- Playwright;
- build/preview;
- `AppApi` + fake;
- tela placeholder;
- Sistema/Claro/Escuro;
- E2E local smoke;
- GitHub Actions: lint, typecheck, unit, build, E2E local.

Pronto quando tudo passa localmente.

## Fase 2 — `clasp` + Web App DEV

- projeto Apps Script DEV;
- `.clasp.json` ignorado;
- `appsscript.json`;
- `doGet`;
- HTML Service;
- adapter `google.script.run`;
- Script Properties;
- Spreadsheet DEV por ID;
- healthcheck sem dados;
- docs de login/push.

E2E: smoke no deployment DEV (não é o E2E local, que usa preview + FakeAppApi).

## Fase 3 — Ambiente E2E isolado

- Apps Script E2E;
- Spreadsheet E2E;
- config separada (`ENVIRONMENT=E2E`, `.env.example`);
- seed/reset fictícios;
- proteção contra reset PROD;
- Playwright remote (`E2E_BASE_URL`).

Este ambiente Google isolado é distinto do E2E local da Fase 1.

# Marco B — Banco Sheets confiável

## Fase 4 — Schema, migrations e repositories

- `_meta`, `_schema_migrations`;
- schemas em código;
- validação cabeçalhos;
- IDs imutáveis (UUID, nunca número da linha);
- serialização;
- migration runner;
- setup idempotente (`setupSchema`, recusa PROD).

`AppApi` permanece mínimo. Repositórios de domínio (alunos, vendas, etc.) ficam para as fases seguintes. Locks/batch são a Fase 5.

## Fase 5 — Locks, batch e idempotência

- `withScriptLock`;
- Advanced Sheets Service;
- batch mutation builder;
- `spreadsheets.batchUpdate`;
- `request_id`;
- `_operation_requests`.

Testar retry e double submit.

`AppApi` permanece mínimo. Backup Drive é a Fase 6.

## Fase 6 — Backup e saúde

- backup Drive;
- pasta/config;
- pré-migration;
- trigger periódico;
- retenção;
- health status;
- restore foundation.

`AppApi` permanece `getHealth`. Auth/usuários são a Fase 7.

# Marco C — Acesso e cadastros

## Fase 7 — Auth e usuários

- dona;
- funcionário;
- sessão;
- autorização backend;
- sem backdoor.

E2E login/role.

`AppApi` agora inclui sessão (`getSession`, `loginE2E`, `logout`) além de `getHealth`. Cadastro de alunos é a Fase 8.

## Fase 8 — Ano letivo, turmas e alunos

- nascimento ou idade aproximada;
- histórico matrícula;
- ativo/inativo;
- reativação com revisão;
- homônimos.

## Fase 9 — Responsáveis e irmãos

- múltiplos responsáveis;
- um principal;
- WhatsApp flag;
- irmãos;
- histórico;
- idade para solicitar responsável.

## Fase 10 — Produtos/categorias

- preço centavos;
- desconto permitido;
- controla estoque;
- reservável;
- ativo/inativo;
- histórico de preço;
- item avulso dona.

# Marco D — Estoque e vendas

## Fase 11 — Estoque diário

- abertura;
- quantidade inicial;
- ledger;
- ajuste;
- atual;
- `ACABOU`.

## Fase 12 — Carrinho e PIX

- múltiplos itens;
- snapshot;
- desconto por item;
- venda anônima/aluno;
- PIX;
- baixa atômica.

## Fase 13 — Dinheiro e settlements

- dinheiro;
- PIX + dinheiro;
- settlements;
- validações;
- integração posterior ao caixa.

# Marco E — Fiado e créditos

## Fase 14 — Recebíveis e calendário

- cobrança;
- vencimentos;
- múltiplos vencimentos opcionais;
- picker/atalhos;
- agenda atrasado/hoje/próximo.

## Fase 15 — Parcial

- oldest-first;
- seleção;
- manual;
- alocações.

## Fase 16 — Juros e renegociação

- fixo/%;
- motivo;
- cobrança específica;
- histórico de vencimento.

## Fase 17 — Crédito pessoal

- ledger;
- uso opcional;
- fiado consome crédito primeiro;
- depósito quita dívida antes;
- devolução dona.

## Fase 18 — Crédito de responsável

- conta por responsável;
- autorização por filho;
- autoquitação opcional;
- pai/mãe separados.

## Fase 19 — Pagamento familiar

- quitar um;
- selecionados;
- manual;
- dívida + crédito;
- tudo crédito.

Cenário: 200 = 20 Robson + 15 Júlia + 165 responsável.

## Fase 20 — Autorizações entre irmãos

- direcional;
- lançar na conta;
- usar crédito separado;
- revogar;
- consumidor != conta cobrada.

# Marco F — Caixa e estornos

## Fase 21 — Caixa físico

- abertura opcional;
- troco inicial;
- dinheiro recebido;
- troco saída;
- adicionar troco;
- retirar dinheiro;
- fechamento/diferença;
- caixa antigo.

E2E: R$8 com R$10 = +10/-2.

## Fase 22 — Estornos

- venda/pagamento/crédito;
- PIX/dinheiro;
- devolução em meio diferente;
- estoque volta? escolha;
- auditoria.

# Marco G — Reservas

## Fase 23 — Modelo/slots

- recreios;
- cutoff;
- reservas/itens/status;
- quantidade reservada;
- disponibilidade;
- idempotência;
- concorrência;
- estados RESERVED/FULFILLED/CANCELLED/NO_SHOW;
- sem PREPARED e sem retirada parcial persistente.

## Fase 24 — Portal público

- catálogo reservável;
- `ACABOU`;
- nome digitado;
- turma;
- contato opcional;
- sem autocomplete privado;
- código público.

E2E remoto obrigatório.

## Fase 25 — Gestão da dona

- reservas por recreio;
- resumo de produção;
- pesquisar;
- alterar;
- entregar;
- cancelar;
- no-show;
- vincular aluno.

## Fase 26 — Reserva → venda

- entrega usa motor normal;
- escolher pagamento;
- baixa físico uma vez;
- libera reservado;
- vínculo source reservation;
- se retirar menos, restante cancela;
- venda presencial pode usar unidade reservada apenas com override explícito da dona e ajuste atômico da reserva afetada.

Invariante:
20 físico, 3 reservado, 17 disponível → entrega 3 → 17 físico, 0 reservado, 17 disponível.

# Marco H — WhatsApp oficial V2.1

## Fase 27 — Gateway e webhooks oficiais

- WhatsApp Business Platform/Cloud API;
- modo Coexistence quando aplicável;
- gateway mínimo para validar assinatura;
- encaminhamento para Apps Script;
- `messages` inbound;
- eventos de saída/echo quando disponíveis;
- retries;
- idempotência;
- não processar grupos;
- não baixar mídia.

Testes:

- assinatura inválida;
- retry;
- Apps Script indisponível;
- mesmo message_id não duplica.

## Fase 28 — Modelo de Inbox por mensagem

- `_whatsapp_contacts`;
- vínculos many-to-many com aluno/responsável;
- `_whatsapp_messages`;
- versões/edições;
- ações;
- echoes/respostas;
- retenção configurável default 90 dias;
- mensagem individual como unidade de trabalho;
- mais antigas primeiro.

Estados separados:

- tratamento;
- resposta.

## Fase 29 — Inbox privado + Atualizar mensagens + verificador

- lista de mensagens;
- contador;
- filtros;
- `↻ Atualizar mensagens`;
- última atualização/webhook;
- dedupe;
- possível duplicada;
- atraso;
- editada/apagada quando evento existir;
- resposta contextual automática quando inequívoca;
- resposta manual/no reply;
- seleção em lote somente para descartar/respondida/no reply.

E2E obrigatório.

## Fase 30 — Ações manuais do Inbox

Cada mensagem pode executar zero, uma ou várias ações:

- criar/alterar/cancelar/pesquisar reserva;
- consultar conta;
- registrar pagamento;
- registrar crédito;
- alterar promessa/vencimento;
- vincular/atualizar contato;
- consultar/copiar cardápio;
- copiar link de reservas;
- copiar dados PIX;
- descartar;
- outra ação.

Não classificar mensagem automaticamente.
Não enviar resposta pelo sistema.
Não criar anotação a partir do WhatsApp.

## Fase 31 — Desfazer tratamento + integrações de histórico

- preview de todas as ações geradas pela mensagem;
- tentar desfazer o conjunto inteiro;
- reversões/estornos rastreáveis;
- se alguma ação não puder ser revertida diretamente, bloquear parcial silencioso e explicar;
- voltar mensagem a pendente quando reversão completa;
- histórico do aluno com data/hora completa;
- origem Balcão/Reserva;
- filtro por produto/período;
- reservas canceladas/no-show em visão separada.

# Marco I — Organização e gestão

## Fase 32 — Notas/menções internas

- operação/dia/semana;
- @aluno/@responsável;
- versões;
- anulação.

Observação: Inbox WhatsApp não cria notas automaticamente nem oferece “Criar anotação” como ação V2.1.

## Fase 33 — Dashboard/relatórios

- dia/semana/mês;
- vendas/descontos/recebido;
- PIX/dinheiro/fiado;
- créditos/acréscimos;
- a receber;
- atrasos;
- caixa;
- estoque/reservas;
- métricas operacionais do Inbox sem conteúdo das mensagens.
  Não usar “lucro”.

## Fase 34 — Auditoria/logs/diagnóstico

- audit events;
- retenção;
- logger sanitizado;
- diagnóstico;
- teste de redaction;
- saúde do webhook/inbox sem PII.

## Fase 35 — Restore/exportações

- restore protegido;
- backup pré-restore;
- validação;
- CSV útil;
- export não altera dados.

# Marco J — Hardening e release

## Fase 36 — UX/acessibilidade

- teclado/atalhos;
- responsivo;
- tema;
- loading;
- double-click protection;
- erros simples;
- ações perigosas claras;
- Inbox eficiente para 100+ mensagens.

## Fase 37 — Regressão e concorrência

- unit;
- integration;
- E2E local/remoto;
- concorrência;
- retry;
- seed fictício grande;
- performance básica;
- webhook burst com 100 mensagens;
- verificador/dedupe/retention.

## Fase 38 — Release PROD

- CI/CD final;
- secrets separados;
- release por tag;
- backup PROD;
- VERSION/changelog;
- commit `chore(release): vX.Y.Z`;
- tag;
- `clasp version`;
- deploy/redeploy versionado;
- smoke PROD;
- smoke webhook não destrutivo.

# Aceitação final

Financeiro:

- PIX, dinheiro/troco, misto, fiado, parcial, juros, crédito, família, irmãos, estorno.

Estoque:

- abertura, baixa, acabou, ajuste, retorno/não retorno, concorrência, override presencial explícito de unidade reservada.

Caixa:

- opcional, fechamento, diferença, caixa antigo, PIX sem caixa.

Reservas:

- portal público sem PII;
- cutoff;
- concorrência;
- pesquisar/alterar;
- entregar;
- cancelar/no-show;
- conversão exata;
- sem estado preparada;
- retirada parcial cancela restante.

WhatsApp V2.1:

- API oficial inbound;
- Inbox por mensagem;
- mais antigas primeiro;
- múltiplas ações por mensagem;
- resposta separada de tratamento;
- atualização manual/verificador;
- dedupe;
- reply echo contextual;
- ações em lote seguras;
- retenção 90 dias configurável;
- sem IA;
- sem envio de respostas pelo programa;
- sem mídia armazenada;
- desfazer tratamento rastreável.

Confiabilidade:

- idempotência;
- migrations;
- backup/restore;
- logs sem PII;
- CI/E2E;
- release versionada.

# Fora da V2 AppScript

- offline completo;
- Electron;
- PIX/banco automático;
- WhatsApp Business Flows/bot conversacional/envio automático de respostas;
- IA para classificar mensagens;
- armazenamento de mídia do WhatsApp;
- despesas gerais/ERP;
- fornecedores/custo médio;
- sincronização bidirecional externa.
