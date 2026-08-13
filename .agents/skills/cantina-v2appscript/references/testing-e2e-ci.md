# Testes automatizados, E2E e CI

## Regra central

Testes existem desde a primeira fase.
Nenhuma feature financeira, de estoque ou reserva é pronta sem teste automatizado.

## Unitários — Vitest

Domínio puro:

- centavos/BRL;
- arredondamento;
- descontos;
- juros;
- alocações;
- crédito;
- estoque;
- reservas;
- datas;
- permissões.

## Integração local — Vitest

Testar:

- repositories fake/in-memory;
- serialização de rows;
- schemas;
- construção de batch requests;
- idempotência;
- validações.

## Integração remota — E2E env

Spreadsheet + deployment E2E:

- migrations;
- criação/consulta real;
- batchUpdate;
- LockService;
- backups de teste quando aplicável.

Nunca PROD.

## E2E — Playwright

### Local

Desde a Fase 1:

- preview local;
- `FakeAppApi`;
- browser real;
- smoke, tema, navegação e fluxos visuais.

### Remoto

Quando deployment E2E existir:

- URL Apps Script real;
- Spreadsheet E2E;
- reset/seed antes da suíte;
- integração completa.

## Casos E2E finais obrigatórios

1. Venda PIX anônima.
2. Venda dinheiro + troco.
3. Fiado com data.
4. Parcial oldest-first.
5. Parcial manual.
6. Juros + renegociação.
7. Crédito pessoal.
8. Crédito familiar.
9. Pai paga filhos selecionados.
10. Irmã usa conta do irmão.
11. Estoque `ACABOU`.
12. Estorno com retorno.
13. Estorno sem retorno.
14. Caixa antigo aberto.
15. Nota com menções.
16. Reserva pública.
17. Duas reservas disputam último item.
18. Cancelamento libera estoque.
19. Entrega vira venda sem dupla baixa.
20. No-show libera reserva.
21. Backup.
22. Idempotência/double-click.

## Concorrência

Testar:

- duas vendas do último item;
- duas reservas do último item;
- pagamento reenviado com mesmo request_id;
- double-click;
- timeout + retry.

Esperado:

- sem duplicação;
- sem estoque negativo;
- sem pagamento duplicado.

## Dados de teste

Somente fictícios.
`seedE2E` e `resetE2E`.
Reset deve abortar se `ENVIRONMENT !== E2E`.

## Coverage

Threshold progressivo.
Meta inicial para domínio crítico: >= 80% quando houver volume suficiente.
Não reduzir threshold apenas para passar CI sem registrar decisão.

## Scripts esperados

```text
npm run lint
npm run typecheck
npm test
npm run test:unit
npm run test:integration
npm run test:e2e:local
npm run test:e2e:remote
npm run build
```

## GitHub Actions

Desde o início:

- npm ci;
- lint;
- typecheck;
- unit;
- integration local;
- build;
- E2E local.

Depois:

- secrets E2E;
- deploy E2E;
- reset/seed;
- E2E remoto.

PROD:

- deploy somente por release/tag aprovada;
- backup antes de mudança estrutural.

## Artefatos de falha

Playwright pode guardar screenshot, trace e vídeo.
Nunca usar dados reais PROD nesses artefatos.

## Flakiness

Teste flaky deve ser investigado e registrado, não ignorado indefinidamente.
Usar locators por role/label/texto estável/contrato explícito.

## WhatsApp V2.1 — testes obrigatórios

Unit/integration:

- dedupe por `whatsapp_message_id`;
- IDs diferentes com texto igual não são apagados automaticamente;
- fila mais antigas primeiro;
- status de tratamento separado do status de resposta;
- mensagem com várias ações;
- desfazer tratamento gera reversões e nunca DELETE;
- retenção padrão 90 dias e pendentes não expiram;
- resposta contextual/echo pode marcar exatamente uma mensagem;
- echo sem contexto não marca mensagem específica;
- vínculo ambíguo de telefone exige escolha;
- mídia não é persistida;
- atraso usa timestamp original.

E2E Inbox:

1. webhook fictício cria mensagem pendente;
2. reenviar mesmo message_id não duplica;
3. botão Atualizar mensagens atualiza contador/estados;
4. criar reserva a partir de mensagem;
5. mesma mensagem cria duas reservas;
6. alterar/cancelar/pesquisar reserva;
7. ação feita + resposta pendente continua na fila;
8. marcar respondida remove da fila quando tratamento concluído;
9. descartar em lote com confirmação;
10. desfazer tratamento de múltiplas ações com preview;
11. mensagem editada após ação não altera operação;
12. mensagem atrasada mantém ordem original;
13. reserva pelo WhatsApp compete com reserva pública;
14. venda presencial usa unidade reservada somente com override explícito;
15. histórico do aluno registra origem Reserva/WhatsApp sem guardar texto após retenção.

Gateway/webhook:

- assinatura inválida rejeitada;
- Apps Script indisponível não gera ack falso;
- retry não duplica;
- grupo ignorado;
- payload de mídia não baixa arquivo.
