# Reservas / pré-pedidos

## Objetivo

Substituir dezenas de mensagens no WhatsApp por um link estruturado.

Fluxo:
WhatsApp → link → portal público → reserva → fila da dona → preparação → retirada/venda.

## Portal público

Não mostrar:

- autocomplete de alunos;
- responsáveis;
- dívidas;
- créditos;
- notas/histórico.

Coletar mínimo:

- nome para retirada/aluno digitado;
- turma;
- contato opcional;
- slot/recreio;
- itens/quantidades;
- observação curta opcional.

## Slots

`_reservation_slots`:

- id
- business_date
- label
- pickup_starts_at
- pickup_ends_at
- cutoff_at
- active

Ex.: Recreio manhã, reservas até 09:15, retirada 09:45–10:05.

## Reserva

`_reservations`:

- id
- public_code
- requester_name
- student_name_text
- classroom_text_or_id
- contact_optional
- slot_id
- status
- payment_status
- linked_student_id
- total_cents
- timestamps
- note

Estados:

- pending/confirmed conforme config;
- confirmed;
- fulfilled;
- cancelled;
- no_show.

`_reservation_items`: product snapshot, quantity, unit_price, line_total.

`_reservation_status_history`: transições e ator.

## Estoque reservado

Reserva ativa não reduz estoque físico.
Ela aumenta “reservado”.

Disponível = físico - reservado.

Cancelar/no-show libera reservado sem alterar físico.

Entregar:

- converte/liga uma venda;
- venda baixa físico;
- reserva deixa de segurar reservado;
- não pode haver dupla baixa.

Exemplo:
físico 20, reservado 3, disponível 17.
Entrega 3 → físico 17, reservado 0, disponível 17.

## Concorrência

Criar reserva:

1. lock;
2. reler disponibilidade;
3. validar;
4. usar request_id;
5. criar reserva + itens em batch;
6. release lock.

Nunca confiar no estoque visto pelo navegador.

## Tela da dona

- reservas por recreio;
- resumo de produção por produto;
- entregar;
- cancelar;
- não retirada;
- vincular aluno quando necessário.

## Pagamento

- pagar na retirada;
- “já paguei PIX” como informação a confirmar;
- entrega usa o mesmo motor financeiro da venda.

Sem integração bancária automática.

## Abuso

Começar simples:

- limite por item/reserva;
- cutoff;
- validação server-side;
- limites de texto;
- request_id;
- public_code não sequencial;
- rate-limit/honeypot se necessidade real aparecer.

## WhatsApp

Na V2 existem dois caminhos de origem de reserva:

- portal público por link;
- Inbox V2.1 via WhatsApp Business Platform oficial, sempre com decisão manual da dona.

WhatsApp Flows, bots conversacionais e respostas automáticas continuam fora da V2.1.

## Prioridade presencial

Reserva reduz disponibilidade para novas reservas e ajuda no planejamento, mas a dona pode priorizar uma venda presencial quando só restarem unidades fisicamente reservadas. Nunca fazer isso automaticamente: exigir confirmação, mostrar reservas afetadas e ajustar/cancelar explicitamente a reserva escolhida na mesma operação da venda.
