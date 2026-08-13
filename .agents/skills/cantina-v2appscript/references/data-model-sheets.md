# Modelo de dados no Sheets

## Fundamentos

Cada aba técnica funciona como tabela append-oriented.
IDs são strings/UUID imutáveis.
Número da linha nunca é identidade.
Cabeçalhos são versionados e validados por código.

Abas técnicas sugeridas:

```text
_meta
_schema_migrations
_operation_requests
_backups
_users
_sessions
_school_years
_classrooms
_students
_student_enrollments
_guardians
_student_guardians
_student_account_authorizations
_product_categories
_products
_product_price_history
_ad_hoc_items
_sales
_sale_items
_sale_settlements
_receivables
_receivable_charges
_receivable_due_date_history
_payments
_payment_allocations
_payment_credit_allocations
_credit_accounts
_credit_account_students
_credit_movements
_inventory_days
_inventory_opening_items
_inventory_movements
_cash_sessions
_cash_movements
_operation_reversals
_reversal_effects
_notes
_note_versions
_note_mentions
_reservation_slots
_reservations
_reservation_items
_reservation_status_history
_audit_events
_settings
```

## Schema/migrations

`_meta`:

- schema_version
- app_version
- environment
- created_at

`_schema_migrations`:

- migration_id
- applied_at
- app_version
- description/checksum

Nunca editar migration já aplicada em PROD.

## Ano letivo e turmas

`_school_years`: id, label, started_on, ended_on, active, created_at.

`_classrooms`: id, school_year_id, name, active, created_at.

Turmas pertencem a um ano letivo. Histórico de matrícula fica em `_student_enrollments` (última linha do mesmo id vence; `ended_on` vazio é a turma atual).

## Pessoas

`_students`: id, full_name, birth_date, approximate_age, approximate_age_reference_year, active, created_at, updated_at. Nascimento **ou** idade aproximada + ano de referência, nunca os dois. Homônimos são cadastros distintos. Reativação exige revisão explícita. Atualizações são append (mesmo id, última linha vence).

`_student_enrollments`: id, student_id, classroom_id, started_on, ended_on, created_by.

`_guardians`: id, full_name, phone, whatsapp_enabled, relation_label, active, created_at, updated_at.

`_student_guardians`: id, student_id, guardian_id, is_primary, can_use_guardian_credit, auto_settle_debt_from_guardian_credit, active, started_at, ended_at, note, created_at. Um aluno pode ter vários responsáveis; só um vínculo ativo é principal. Irmãos = alunos que compartilham pelo menos um responsável ativo.

`_student_account_authorizations`: id, consumer_student_id, account_student_id, can_charge_account, can_use_account_credit, active, authorized_at, revoked_at, created_by, note. IDs são UUID; atualizações são append. Autorização é direcional. Lançar na conta e usar o crédito pessoal do irmão são permissões separadas. Revogar preserva o histórico; vendas antigas não mudam.

`_settings`: key, value. A Fase 9 usa `require_guardian_below_age` (padrão 18), idade operacional para pedir responsável, não regra jurídica. A Fase 12 usa `pix_copy_text` (chave PIX de teste, sem API bancária).

## Produtos

`_product_categories`: id, name, sort_order, active, created_at. Categorias iniciais: Salgados, Bebidas, Doces, Outros.

`_products`: id, category_id, name, price_cents, discount_allowed, stock_tracked, reservable, active, created_at, updated_at. Preço em centavos inteiros. Inativo preserva histórico. Só `stock_tracked=true` entra na abertura do dia.

`_product_price_history`: id, product_id, price_cents, started_at, ended_at, created_by. Append-oriented; troca de preço fecha o período anterior e abre um id novo. Não reescreve venda antiga: o item guarda snapshot de descrição/preço/desconto.

`_ad_hoc_items`: id, name, price_cents, created_by, created_at. Só a dona registra. Item avulso não vira produto automaticamente.

## Vendas

`_sales`: id, consumer_student_id, charged_student_id, status, gross_total_cents, discount_total_cents, net_total_cents, source_reservation_id, created_by, created_at, reversal_id.

`_sale_items`: id, sale_id, product_id, item_kind, description_snapshot, quantity, unit_price_cents, discount_kind, discount_input, discount_amount_cents, line_net_total_cents.

`_sale_settlements`: id, sale_id, kind, amount_cents, related_entity_id, created_at.

Invariante: soma settlements = net_total. Kinds desta fase: `pix`, `cash` (valor recebido), `change` (troco negativo) e `fiado` (valor líquido da conta). `consumer_student_id` vazio é venda anônima. `charged_student_id` é o consumidor, ou a conta do irmão quando há autorização direcional `can_charge_account` (Fase 20). Fiado exige aluno na conta cobrada. PIX não passa pelo caixa. Dinheiro, troco, pagamento em dinheiro e depósito em dinheiro exigem caixa aberto no dia (Fase 21).

## Recebíveis

`_receivables`: id, charged_student_id, source_sale_id, due_date, status, created_by, created_at.

`_receivable_charges`: id, receivable_id, kind, amount_cents, reason_code, note, created_by, created_at, reversal_id.

`_receivable_due_date_history`: receivable_id, old_due_date, new_due_date, reason, changed_by, changed_at.

Saldo é derivado de charges, pagamentos e reversões; não de um campo editável. A venda fiado cria recebível `open` com charge `principal`/`sale`. Pagamento parcial grava alocações; o restante some da agenda quando chega a zero. Juros (Fase 16) é charge `interest` na cobrança escolhida, com motivo. Renegociação atualiza `due_date` e grava `_receivable_due_date_history`. Crédito pessoal (Fase 17) consome o saldo no fiado e o depósito quita a dívida antes; schema version 12 (`012_credits`).

## Pagamentos

`_payments`: id, payer_guardian_id, payer_student_id, method, amount_received_cents, status, created_by, created_at, note.

`_payment_allocations`: payment_id, receivable_id, student_id, amount_cents.

Todo valor recebido precisa ser alocado. Pagamento de aluno usa `payer_student_id` (`payer_guardian_id` vazio). Pagamento familiar (Fase 19) usa `payer_guardian_id` (`payer_student_id` vazio) e explica cada centavo em `_payment_allocations` e, se houver sobra, `_payment_credit_allocations` no crédito do responsável. Métodos: `pix` ou `cash`. Status: `completed`. Modos do aluno: dívida mais antiga, selecionadas ou alocação manual. Modos da família: quitar um filho, selecionadas, manual, dívida + crédito, tudo crédito. Sobra nunca vai sozinha para um filho.

## Créditos

`_credit_accounts`: id, owner_type student|guardian, owner_student_id, owner_guardian_id, active, created_at.

`_credit_account_students`: credit_account_id, student_id, can_use, active.

`_credit_movements`: credit_account_id, kind, amount_delta_cents, source_type, source_id, student_id, created_by, created_at, note.

Saldo = soma dos movimentos. Conta pessoal: `owner_type=student`. Conta de responsável: `owner_type=guardian`, pai e mãe separados. `_credit_account_students.can_use` espelha `can_use_guardian_credit` do vínculo. Fiado consome crédito pessoal primeiro e, se o filho pode usar, o crédito do responsável. Na conta do irmão (Fase 20), o crédito pessoal do irmão só entra com `can_use_account_credit`. Depósito no responsável só quita dívida do filho com `auto_settle_debt_from_guardian_credit`. Sem autorização, crédito do responsável pode coexistir com dívida do filho. Schema version 12 (`012_credits`).

## Estoque

`_inventory_days`: id, business_date, status, opened_by, opened_at. Um dia civil aberto por data. Status inicial: `open`.

`_inventory_opening_items`: id, inventory_day_id, product_id, opening_quantity. IDs UUID; quantidade inteira, zero ou maior. A dona informa a abertura de cada produto controlado.

`_inventory_movements`: id, inventory_day_id, product_id, kind, quantity_delta, source_type, source_id, created_by, created_at, reason. Ajuste (`kind=adjustment`) é só da dona, com motivo. Físico = abertura + movimentos. Zero aparece `ACABOU`. Disponível = físico - reservado ativo (reservado ainda é 0).

## Caixa

`_cash_sessions`: id, business_date, status (`open`|`closed`), opening_float_cents, opened_by/at, closed_by/at, expected_close_cents, counted_close_cents, difference_cents, close_note. Troco inicial não é receita. Um caixa por dia civil; fechado não reabre. Caixa antigo aberto bloqueia dinheiro novo, não PIX.

`_cash_movements`: id, cash_session_id, kind, amount_delta_cents, source_type, source_id, created_by, created_at, note. Esperado = troco inicial + soma dos deltas. Kinds: `cash_received`, `change_given`, `cash_added_for_change`, `cash_removed`, `debt_payment_received`, `credit_deposit_received`, `reversal`. Saída não deixa o físico negativo.

## Estornos

`_operation_reversals`: id, operation_type (`sale`|`payment`|`credit_refund`), operation_id, reason, original_methods, refund_method, different_method_confirmed, returned_to_stock, created_by, created_at. A operação original permanece; o estorno é uma linha nova. Schema version 14 (`014_reversals`).

`_reversal_effects`: id, reversal_id, effect_type, entity_type, entity_id, amount_delta_cents, quantity_delta. Effects: `cash_refund`, `pix_refund`, `cash_recovery`, `pix_recovery`, `credit_restore`, `credit_remove`, `debt_cancelled`, `debt_reopened`, `stock_return`.

Venda/pagamento estornados ganham uma linha posterior com o mesmo id e `status=reversed`. Crédito usa movimento compensatório `kind=reversal`. Estoque devolvido usa `kind=sale_return`.

## Notas

`_notes`, `_note_versions`, `_note_mentions` com IDs reais de aluno/responsável.

## Idempotência

Chamadas críticas recebem `request_id`.
`_operation_requests` pode registrar:

- request_id
- operation_type
- result_entity_id
- status
- created_at

Retry não pode duplicar venda, pagamento, reserva ou estorno.

## Usuários e sessão

`_users`: id, google_subject, role (`owner` | `staff`), active, created_at. Sem coluna de e-mail; o subject Google (ou o fixture E2E) é o vínculo.

`_sessions`: id (token UUID), user_id, role, created_at, expires_at, revoked. A última linha com o mesmo id vence. Logout faz append com `revoked=true`. Número da linha nunca é token.

`_backups`: id, created_at, app_version, schema_version, reason, status, drive_file_id.

## Integridade

Para mutações críticas:

- ScriptLock;
- leitura do estado atual;
- validação;
- batch update único quando possível;
- auditoria no mesmo batch;
- liberação em finally.

## Performance

- ler ranges em lote;
- escrever em lote;
- mapear IDs em memória;
- cachear catálogo/config seguro;
- evitar varrer planilha inteira em cada clique.

## WhatsApp V2.1

Adicionar:

```text
_whatsapp_contacts
_whatsapp_contact_links
_whatsapp_messages
_whatsapp_message_versions
_whatsapp_message_actions
_whatsapp_message_action_links
_whatsapp_outbound_echoes
_whatsapp_response_links
_whatsapp_webhook_events
```

### `_whatsapp_contacts`

- id
- wa_id
- phone_normalized
- created_at
- updated_at

### `_whatsapp_contact_links`

- id
- contact_id
- entity_type: guardian | student
- entity_id
- active
- started_at
- ended_at
- created_by

### `_whatsapp_messages`

- id
- whatsapp_message_id UNIQUE
- contact_id
- direction: inbound
- content_type
- text_content nullable
- source_timestamp
- received_at
- handling_status
- reply_status
- late_delivery
- edited_at nullable
- deleted_at nullable
- retention_delete_after nullable
- created_at
- updated_at

### `_whatsapp_message_versions`

- id
- message_id
- text_content
- version_kind
- captured_at

### `_whatsapp_message_actions`

- id
- message_id
- action_type
- entity_type
- entity_id
- status: active | reversed
- created_by
- created_at
- reversed_at
- reversal_entity_id

### `_whatsapp_message_action_links`

Permite relacionar várias mensagens à mesma ação quando necessário, por exemplo comprovante + texto.

### `_whatsapp_outbound_echoes`

- id
- whatsapp_message_id
- contact_id
- context_inbound_whatsapp_message_id nullable
- source_timestamp
- received_at

### `_whatsapp_response_links`

- id
- inbound_message_id
- outbound_echo_id
- link_type: exact_context | manual
- linked_by nullable
- linked_at

Somente `exact_context` pode marcar `RESPONDED` automaticamente.

### `_whatsapp_webhook_events`

- event_id
- event_type
- external_message_id nullable
- received_at
- processed_at
- processing_status
- error_code nullable

Não manter payload bruto além do necessário.

### Retenção

Job periódico não remove pendentes, remove texto após retenção configurada (default 90 dias) e preserva IDs/timestamps/status/vínculos de ações.
