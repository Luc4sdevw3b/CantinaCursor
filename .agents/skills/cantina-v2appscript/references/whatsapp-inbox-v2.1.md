# WhatsApp oficial — Inbox V2.1

## Objetivo

Receber mensagens do número oficial da cantina via WhatsApp Business Platform/Cloud API e transformar o WhatsApp em uma **fila manual de trabalho**.

A V2.1 **não usa IA para interpretar mensagens** e **não envia respostas pelo sistema**. A dona decide manualmente o que cada mensagem significa e responde pelo WhatsApp Business no celular.

## Arquitetura

```text
WhatsApp Business
      ↓
Meta Cloud API / webhooks
      ↓
gateway mínimo de segurança
- valida assinatura do webhook
- não toma decisão de negócio
- não classifica mensagem
      ↓
Apps Script
      ↓
Google Sheets
      ↓
Inbox privado da Cantina
```

O gateway existe somente para validar/autenticar a origem do webhook e encaminhar o evento. O restante da lógica fica em Apps Script + Sheets.

No modo Coexistence, assinar também eventos oficiais que permitam observar mensagens enviadas pela própria dona no WhatsApp Business ou em dispositivos vinculados, apenas para auxiliar o verificador de “respondida”.

## Unidade de trabalho: MENSAGEM

A unidade de trabalho é cada mensagem individual, não a conversa.

Se um número enviar 4 mensagens:

- aparecem 4 itens;
- cada uma pode ter zero, uma ou várias ações;
- cada uma possui seu próprio estado;
- cada uma pode ser respondida/descartada separadamente.

Contato/conversa serve só para contexto:

- reconhecer número;
- mostrar aluno/responsável;
- mostrar filhos vinculados;
- permitir abrir mensagens próximas se a dona quiser contexto.

A fila padrão ordena **mais antigas primeiro**.

## Estados da mensagem

### Tratamento

- `PENDING`: ainda precisa ser decidida.
- `HANDLED`: dona concluiu as ações necessárias.
- `DISCARDED`: inútil/sem valor operacional.
- `REOPENED`: reaberta depois de tratada/descartada.

Não manter “Em atendimento” persistente na V2.1. Existe só estado visual local enquanto a tela está aberta.

### Resposta

Estado separado:

- `PENDING_REPLY`
- `RESPONDED`
- `NO_REPLY_REQUIRED`

Uma ação concluída não significa que a mensagem saiu da fila.

Fila principal contém mensagens em que:

- tratamento ainda está pendente; OU
- tratamento terminou, mas `reply_status=PENDING_REPLY`.

Exemplo:
`✓ Reserva criada • ⚠ Falta responder`.

`Descartar` encerra o tratamento e normalmente implica `NO_REPLY_REQUIRED`.

## Botão “Atualizar mensagens”

Adicionar botão visível:

`↻ Atualizar mensagens`

Ele:

1. recarrega do backend as mensagens/eventos já recebidos pelos webhooks;
2. reaplica deduplicação/verificações;
3. atualiza estados de resposta detectáveis;
4. verifica ações vinculadas;
5. aplica marcações de atraso/edição;
6. atualiza contador/fila;
7. mostra `Última atualização` e `Último webhook recebido`.

Webhooks são o mecanismo de entrada. O botão não deve fingir que “baixa todas as mensagens do WhatsApp” se a plataforma não fornecer essa operação. Ele reconcilia o Inbox com os eventos recebidos.

Executar o verificador também:

- ao abrir o Inbox;
- depois de processar webhook;
- depois de concluir/desfazer ação;
- periodicamente de forma leve quando útil.

## Verificador do Inbox

O verificador é **determinístico**, não semântico. Ele não decide se uma mensagem é reserva, pagamento etc.

### Duplicata exata

`whatsapp_message_id` é único.

Se a Meta reenviar o mesmo ID:

- processar uma vez;
- não mostrar duplicata.

Duas mensagens de conteúdo idêntico com IDs diferentes:

- são mensagens diferentes;
- podem receber `Possível duplicada` por regra objetiva de mesmo remetente/texto em janela curta;
- nunca descartar automaticamente;
- dona decide.

### Respondida

Se Coexistence fornecer evento de mensagem enviada pela dona:

1. se a mensagem enviada for resposta contextual inequivocamente ligada ao `message_id` recebido:
   - marcar essa mensagem `RESPONDED` automaticamente;
   - registrar origem `AUTO_ECHO_CONTEXT`.

2. se apenas houver mensagem enviada ao mesmo contato depois:
   - mostrar `Resposta enviada neste contato`;
   - **não** marcar uma mensagem específica como respondida;
   - dona decide manualmente.

A dona sempre pode:

- `Marcar como respondida`;
- `Marcar como não respondida`;
- `Não precisa responder`.

### Ações vinculadas

Verificar:

- ações criadas;
- entidade ainda existente/ativa;
- ação revertida;
- mensagem tratada sem ação;
- ação feita mas resposta faltando.

### Atraso de entrega

Se timestamp original da mensagem for anterior ao recebimento pelo sistema:

- manter ordem pelo horário original;
- badge `Recebida com atraso` quando relevante.

### Editada/apagada

Se a plataforma fornecer evento de edição:

- preservar versão anterior durante retenção;
- mostrar `Editada`;
- se já tratada: `Mensagem editada após o tratamento`;
- nunca alterar reserva/pagamento automaticamente.

Se a plataforma fornecer exclusão:

- marcar `Apagada no WhatsApp`;
- não desfazer ações já realizadas.

## Menu manual de ações

Não classificar texto automaticamente.

### Reservas

- Criar reserva
- Alterar reserva
- Cancelar reserva
- Pesquisar reservas

### Financeiro

- Consultar conta
- Registrar pagamento
- Registrar crédito/adiantamento
- Registrar promessa / alterar vencimento

### Contato

- Vincular número
- Atualizar contato

### Informações para copiar

- Consultar cardápio
- Copiar cardápio
- Copiar link de reservas
- Copiar dados PIX

### Controle

- Marcar como respondida
- Não precisa responder
- Descartar
- Outra ação
- Desfazer tratamento desta mensagem

Não incluir `Criar anotação` como ação do WhatsApp V2.1.

## Uma mensagem → várias ações

Uma mensagem pode gerar várias ações.

Exemplo:

- criar reserva para Júlia;
- alterar vencimento de Robson.

Guardar lista de `message_actions`.
A dona pode clicar `+ Adicionar outra ação`.
Uma ação não encerra automaticamente a mensagem.

## Ações em lote

Permitir seleção de múltiplas **mensagens**, nunca conversas.

Ações em lote inicialmente:

- Descartar;
- Marcar como respondidas;
- Marcar como não precisam de resposta.

Exigir confirmação com quantidade.
Não permitir reservas/pagamentos/créditos em lote.

## Contatos e telefones

Número pode estar ligado a:

- responsável;
- aluno maior que a idade configurada;
- mais de uma entidade (ambiguidade).

Responsável/aluno pode ter vários telefones.

Número compartilhado:

- mostrar possibilidades;
- nunca escolher automaticamente;
- dona seleciona a entidade para aquela ação;
- escolha da ação não precisa alterar cadastro.

Número desconhecido:

- vincular responsável existente;
- vincular aluno existente;
- cadastrar novo quando fluxo permitir;
- manter não identificado;
- tratar a mensagem sem obrigar cadastro.

Mudança de vínculo não reescreve histórico antigo de ações.

## Retenção

Configurável pela dona.
Padrão: **90 dias após tratamento/descartar**.

- pendente nunca é purgada;
- texto de tratadas/descartadas pode ser removido após retenção;
- preservar metadados mínimos: message_id, timestamp, contato, status final, action IDs e auditoria;
- nunca guardar mídia na V2.1.

## Mídias

Não baixar/armazenar áudio, imagem ou documento.

Inbox mostra:

- `🎤 Áudio recebido — verificar no WhatsApp`;
- `🖼 Imagem recebida — verificar no WhatsApp`;
- `📎 Documento recebido — verificar no WhatsApp`.

Depois de conferir no celular, a dona pode executar qualquer ação manual.

Comprovante em imagem + texto podem ser relacionados à mesma ação para auditoria; não é obrigatório.

## Reserva criada a partir de mensagem

### Para quem

- aluno cadastrado; ou
- nome digitado sem cadastro.

Se contato é responsável por vários filhos:

- mostrar filhos primeiro;
- permitir pesquisar qualquer aluno.

Uma mensagem pode criar mais de uma reserva:

- uma por criança quando necessário;
- botão `+ Criar outra reserva desta mensagem`.

### Campos

- data;
- recreio/slot;
- aluno/nome;
- itens;
- quantidades;
- observação geral;
- observação por item;
- forma prevista de pagamento;
- vencimento previsto se fiado.

Forma prevista é expectativa. Forma real é confirmada na retirada.

### Preço

Preço trava no momento da reserva.
Alteração posterior somente via desconto permitido da dona, com histórico.

### Pagamento

Reserva não cria dívida e não consome crédito.
Pode registrar intenção de PIX, dinheiro, crédito, fiado ou conta de irmão autorizado.
Efeito real só na retirada.

## Estados da reserva WhatsApp

- `RESERVED`
- `FULFILLED`
- `CANCELLED`
- `NO_SHOW`

Não usar `PREPARED`.
Não usar `PARTIALLY_FULFILLED`.

Se cliente retirar parte:

- informar quantidade entregue;
- restante é cancelado;
- venda contém apenas o entregue.

## Estoque e reserva

Confirmar reserva:

- físico não muda;
- reservado aumenta;
- disponível diminui.

`disponível = físico - reservado`.

Reserva pública e WhatsApp usam o mesmo reservado.

Se quantidade insuficiente:

- bloquear;
- oferecer reduzir;
- trocar produto;
- ajustar estoque (dona);
- cancelar.

### Prioridade presencial

Reservas ajudam no planejamento, mas a dona pode priorizar quem está presencialmente.

Se `disponível=0` mas `físico>0` porque unidades estão reservadas:

- venda presencial pode oferecer `Usar unidade que está reservada`;
- nunca fazer isso automaticamente;
- exigir confirmação;
- mostrar reservas afetadas;
- dona escolhe qual reserva ajustar/cancelar;
- alteração da reserva + venda presencial deve ser consistente/atômica;
- registrar auditoria.

## Alterar reserva

Pesquisar por:

- aluno;
- responsável/telefone;
- código;
- data;
- recreio;
- status.

Aumentar: revalidar estoque.
Diminuir: liberar reservado.
Trocar produto: liberar antigo + reservar novo na mesma operação.
Dona pode alterar mesmo após cutoff.

## Cancelar reserva

Cancelar:

- libera reservado;
- físico não muda;
- sem motivo obrigatório.

Cancelamento parcial usa `Alterar reserva`.
Reserva `FULFILLED` usa estorno da venda.

## Não retirada

Somente a dona marca `NO_SHOW`.

- libera reservado;
- físico não muda;
- nenhuma venda/dívida.

Nunca auto-cancelar por tempo.
Pode destacar atrasada aguardando decisão.
No-show fica no histórico/filtro de reservas, sem punição automática.

## Retirada

Ao clicar `Entregar`, mostrar:

- aluno;
- itens;
- quantidade;
- total;
- situação financeira;
- créditos relevantes;
- origem da reserva.

Dona confirma forma real: PIX, dinheiro, crédito, fiado ou misto.

Se previsto fiado e pagou PIX: sem dívida.
Se previsto PIX e não pagou: pode escolher fiado.

Se levar menos:

- venda apenas entregue;
- restante cancelado.

Substituição de produto: alterar reserva antes da venda.

Entrega:

- vira venda normal;
- baixa estoque físico uma vez;
- remove reservado;
- preserva vínculo com reserva/mensagem.

## Consulta de conta

Dona escolhe aluno(s): um, vários ou todos os filhos do responsável.

Períodos:

- Hoje;
- Esta semana;
- Este mês;
- Total em aberto;
- Período personalizado/calendário.

Semana = segunda a domingo.

Tela pode mostrar:

- total;
- composição detalhada;
- crédito pessoal;
- crédito de responsável autorizado, separado.

O sistema não gera/envia resposta financeira. Dona responde manualmente no celular.

## Histórico completo do aluno

Filtros:

- Hoje;
- Semana;
- Mês;
- Tudo;
- Período;
- Produto;
- Reservas.

Cada compra mostra:

- data completa;
- hora;
- produtos;
- quantidade;
- preço unitário histórico;
- desconto;
- total;
- consumidor;
- conta cobrada;
- formas de pagamento;
- fiado/vencimento;
- créditos usados;
- origem `Balcão` ou `Reserva`;
- eventual estorno.

Histórico também contém pagamentos, acréscimos, renegociações e estornos.
Reservas canceladas/no-show ficam na visão de Reservas para não poluir financeiro.
Permitir consulta derivada por produto/período.

## Registrar pagamento

Mensagem nunca registra automaticamente.
Dona informa valor confirmado.
Fluxos familiares existentes continuam válidos.
Mensagem fica ligada ao payment_id.
Comprovante não é armazenado.

## Promessa / vencimento

Dona escolhe aluno e cobranças.
Nunca presumir quais cobranças uma frase inclui.
Guardar message_id, vencimento antigo/novo, usuário e timestamp.

## Cardápio

`Copiar cardápio` gera texto para clipboard com produto, preço e `Disponível`/`Acabou`, sem quantidade exata por padrão.
Também `Copiar link de reservas`.
Dona cola manualmente no WhatsApp.

## PIX

Configuração guarda chave/dados PIX.
Só dona altera.
Funcionário autorizado pode visualizar/copiar.
`Copiar dados PIX` usa clipboard; não envia mensagem.

## Descartar

Sem motivo obrigatório.
Pode reabrir.
Nova mensagem do mesmo contato é independente.

## Desfazer tratamento

Botão: `↶ Desfazer tratamento desta mensagem`.

Por padrão tenta desfazer **todas as ações produzidas por aquela mensagem**.
Antes mostra preview completo dos efeitos.

Se tudo puder ser revertido com segurança:

- executar reversões;
- preservar histórico;
- voltar mensagem a `PENDING`.

Se alguma ação tiver dependência posterior e não puder ser desfeita diretamente:

- não fazer parcialmente em silêncio;
- avisar o que exige estorno/cancelamento específico;
- permitir abrir operações correspondentes.

“Desfazer” nunca significa DELETE histórico.

## Casos de webhook

- Mesmo message_id: idempotente.
- Texto igual com IDs diferentes: mostrar separado.
- Nova mensagem corrige anterior: segunda usa `Alterar reserva`.
- “Cancela tudo”: dona pesquisa/seleciona manualmente.
- Nova mensagem não interrompe modal atual.
- Webhook atrasado mantém timestamp original e badge de atraso.
- Se persistência falhar, gateway não confirma sucesso definitivo; permitir retry oficial.
- Grupos não são processados na V2.1.

## Auditoria

Toda ação originada em WhatsApp registra:

- message_id(s);
- contact_id;
- action type;
- entity type/id;
- usuário;
- timestamp.

Correções preservam vínculo histórico.
