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
- schemas e validação de cabeçalhos;
- `setupSchema` idempotente (recusa PROD);
- construção de batch requests (`spreadsheets.batchUpdate`);
- `withScriptLock` e timeout retryable;
- retry/double submit com o mesmo `request_id`;
- backup Drive, retenção e restore foundation (sem merge);
- sessão/role no backend (`owner`/`staff`), login E2E só no ambiente E2E, recusa de token inválido/expirado/revogado;
- alunos: idade (nascimento ou aproximada), homônimos distintos, matrícula com histórico, reativação com revisão;
- responsáveis: vários por aluno, um principal, irmãos por responsável compartilhado, autorização direcional, idade operacional para pedir responsável;
- produtos: preço em centavos, categorias, histórico de preço, item avulso só da dona e fora do cardápio;
- estoque diário: abertura por produto controlado, ledger, ajuste da dona com motivo, quantidade atual e `ACABOU` no zero;
- vendas PIX, dinheiro e misto: carrinho com snapshot, desconto só da dona, venda anônima ou de aluno, settlements cuja soma é o líquido (PIX, dinheiro recebido e troco negativo) e baixa atômica no estoque;
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

Desde a Fase 1, e somente isto:

- preview local (`vite preview`);
- `FakeAppApi`;
- browser real;
- smoke, tema, navegação e health técnico.

E2E local **não depende** de:

- Google Apps Script real;
- `google.script.run`;
- Google Sheets;
- Google Drive;
- `clasp`;
- login Google;
- WhatsApp;
- internet externa.

Mínimo obrigatório do smoke local:

1. aplicação abre;
2. título `Cantina V2 AppScript` aparece;
3. nenhum erro inesperado no console;
4. tema Sistema funciona;
5. tema Claro funciona;
6. tema Escuro funciona;
7. preferência de tema persiste após reload;
8. `AppApi fake` responde `health`;
9. nenhuma chamada externa é realizada;
10. login local como dona/funcionário e logout, sem campo de senha;
11. homônimos distinguíveis e reativação só com revisão do cadastro;
12. responsáveis fictícios, flag WhatsApp e autorização entre irmãos após o login;
13. cardápio fictício após o login (`Coxinha • Salgados • R$ 5,50`); item avulso visível só para a dona;
14. estoque do dia após o login (`Coxinha • 10`, `Suco de uva • ACABOU`); ajuste visível só para a dona.
15. venda PIX anônima após o login (`Anônima • Coxinha • R$ 5,50`) e estoque `Coxinha • 9`.
16. venda dinheiro com troco após o login (`Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50`) e estoque `Coxinha • 9`.
17. fiado com data após o login (`Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • Sexta-feira • 14/08/26`), agenda em **Próximos** (`Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26`) e estoque `Coxinha • 9`.
18. parcial oldest-first: dois fiados da Ana (12/08 e amanhã); pagar `R$ 5,50` PIX na dívida mais antiga; atrasado some; **Próximos** permanece `Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26`; pagamento `Ana Souza • ~8 • R$ 5,50 • PIX`; estoque `Coxinha • 8`.
19. parcial manual: os mesmos dois fiados; alocar `R$ 2,50` só no vencimento de 14/08; atrasado permanece `R$ 5,50` em 12/08; **Próximos** vira `Ana Souza • ~8 • R$ 3,00 • Sexta-feira • 14/08/26`; pagamento `Ana Souza • ~8 • R$ 2,50 • PIX`.
20. juros + renegociação: fiado da Ana para amanhã; dona lança `R$ 1,00` com motivo; agenda vira `Ana Souza • ~8 • R$ 6,50 • Sexta-feira • 14/08/26`; renegocia para +7 dias; agenda `Ana Souza • ~8 • R$ 6,50 • Quinta-feira • 20/08/26` e histórico `Ana Souza • ~8 • Sexta-feira • 14/08/26 → Quinta-feira • 20/08/26 • Pedido da responsável`. Funcionário não vê **Lançar juros**.
21. crédito pessoal: depósito `R$ 2,00` da Ana; lista `Ana Souza • ~8 • R$ 2,00`; fiado Coxinha amanhã; venda `Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito R$ 2,00 • Sexta-feira • 14/08/26`; agenda `Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26`; crédito `R$ 0,00`; estoque `Coxinha • 9`. Dona devolve crédito. Funcionário não vê **Devolver crédito**.
22. crédito de responsável: autorizar Ana ~8 a usar o crédito da Maria; depósito `R$ 2,00` da Maria; lista `Maria Souza • mãe • R$ 2,00`; fiado Coxinha da Ana amanhã; venda `… • Fiado • crédito resp. R$ 2,00 • Sexta-feira • 14/08/26`; agenda `Ana Souza • ~8 • R$ 3,50`; crédito da Maria `R$ 0,00`. Irmão sem autorização e o outro responsável não consomem essa conta.
23. pagamento familiar: fiado Coxinha da Ana ~8 e do Bruno amanhã; estoque `Coxinha • 8`; Maria paga `R$ 2,00` PIX em **Dívida + crédito** (`0,20` Ana + `0,15` Bruno); lista `Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65`; agenda `Ana Souza • ~8 • R$ 5,30` e `Bruno Lima • 11 • R$ 5,35`; crédito `Maria Souza • mãe • R$ 1,65`. O botão do aluno continua **Registrar pagamento**.
24. conta do irmão: fiado Coxinha do Bruno na conta da Ana ~8 amanhã; venda `Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • Sexta-feira • 14/08/26`; agenda da Ana `R$ 5,50`; Bruno não entra na agenda; estoque `Coxinha • 9`. Sem a permissão de crédito, o crédito pessoal da Ana não é usado. A autorização é só Bruno→Ana.
25. caixa físico: abrir caixa; Coxinha + Brigadeiro em dinheiro com `R$ 10,00`; venda `Anônima • Coxinha, Brigadeiro • R$ 8,00 • Dinheiro • Troco R$ 2,00`; movimentos `entrada R$ 10,00` e `troco R$ 2,00`; esperado `R$ 8,00`; estoque `Coxinha • 9`. PIX continua sem caixa. Confirmar venda não muda de rótulo.

Não confundir com o ambiente Google E2E da Fase 3.

### Remoto

Quando o deployment E2E da Fase 3 existir:

- URL Apps Script real em `E2E_BASE_URL` no formato `https://script.google.com/macros/s/<id>/exec` (nunca PROD, docs ou editor);
- Spreadsheet E2E isolada;
- `resetE2E` / `seedE2E` abortam se `ENVIRONMENT !== E2E` e nunca em PROD;
- dados somente fictícios;
- smoke Playwright: `npm run test:e2e:remote` (health público, sem exigir login).

Sem `E2E_BASE_URL` os testes remotos são ignorados. O CI da fundação não executa E2E remoto e não usa secrets.

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

## Scripts oficiais

```text
npm ci
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

`test:e2e:remote` existe; sem `E2E_BASE_URL` os casos são ignorados até o deployment E2E da Fase 3. Nunca apontar para PROD.

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
- backup antes de mudança estrutural;
- nenhum teste automatizado destrutivo;
- smoke PROD futuro = manual / read-only / não destrutivo.

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
