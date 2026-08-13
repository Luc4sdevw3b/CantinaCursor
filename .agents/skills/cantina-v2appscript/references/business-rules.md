# Regras de negócio e UX

## Princípios gerais

- A interface deve ser mais simples que uma planilha.
- Operações comuns em poucos cliques.
- Valores agregados sempre podem ser explicados em detalhes.
- Havendo mais de uma distribuição financeira válida, a dona escolhe.
- Nunca apagar silenciosamente histórico financeiro.

## Alunos e turmas

Aluno:

- nome completo;
- ativo/inativo;
- nascimento opcional;
- ou idade aproximada + ano de referência;
- histórico de turma.

Idade aproximada avança por ano e aparece com `~`.
Reativação exige revisão do cadastro.
Venda à vista pode ser anônima; se aluno for selecionado, mostrar situação, turma, dívida, crédito e responsável principal.

Turmas pertencem ao ano letivo e preservam histórico.

## Responsáveis

- vários por aluno;
- um principal para contato/cobrança;
- um responsável pode ter vários filhos;
- pai/mãe podem ter créditos separados;
- nome, telefone, flag WhatsApp, relação opcional/genérica.

Configuração de idade mínima para exigir responsável é operacional, não jurídica.

## Irmãos e autorizações

Autorização direcional:

- lançar compra/fiado na conta de outro;
- usar crédito pessoal do outro é permissão separada.

Guardar criação, revogação, autor e nota.
Compras antigas preservam contexto.

## Produtos

- categoria;
- nome;
- preço;
- ativo;
- permite desconto;
- controla estoque;
- reservável.

Categorias iniciais: salgados, bebidas, doces, outros.
Produto inativo mantém histórico.
Mudança de preço não muda venda antiga.
Item avulso: só dona, não vira produto automaticamente.

## Vendas

- múltiplos itens/quantidades;
- snapshot de descrição/preço/desconto;
- consumidor e conta cobrada podem ser diferentes;
- venda anônima quando não há conta.

Meios combináveis:

- PIX;
- dinheiro;
- crédito pessoal;
- crédito do responsável;
- fiado.

Soma dos settlements = total líquido.

## Desconto

Somente dona e somente produto que permite.
Por item:

- valor;
- percentual.

## Fiado, vencimentos e agenda

Cada cobrança tem vencimento próprio.
Uma venda pode ser dividida em vários vencimentos por escolha explícita.

Date picker:

- calendário;
- amanhã;
- próxima sexta;
- +7 dias;
- exibição `Segunda-feira • 17/08/26`.

Agenda:

- atrasados;
- hoje;
- próximos;
- calendário/dia.

## Pagamento parcial

Padrão: dívida mais antiga primeiro.
Também permitir selecionar dívidas e alocação manual.

## Juros/acréscimos

Só dona.
Em cobrança específica.
Valor ou percentual.
Motivo obrigatório.
Nunca automático só por atraso.

## Renegociação

Preserva vencimento anterior, novo vencimento, motivo, usuário e timestamp.

## Crédito pessoal

Ledger por aluno.
Aluno pode preferir PIX/dinheiro mesmo tendo crédito.
Se escolher fiado e tiver crédito pessoal, consumir crédito primeiro e criar dívida só no restante.
Nova entrada de crédito pessoal quita dívida pessoal antes; sobra vira crédito.
Ao fim da operação, não coexistem dívida pessoal positiva + crédito pessoal positivo.
Dona pode devolver crédito.

## Crédito de responsável/familiar

Conta pertence ao responsável.
Pai/mãe separados podem ter contas separadas.
Por filho:

- pode usar;
- pode autoquitar dívida quando autorizado.

Crédito do responsável pode coexistir com dívida do filho se não houver uso/autorização.
Irmão sem vínculo não herda crédito do responsável.

## Pagamento de responsável

Opções:

- quitar um filho;
- quitar selecionados;
- todos selecionados;
- valores manuais;
- dívida + crédito;
- tudo como crédito do responsável.

Todo centavo recebido precisa ser explicado.
Sobra nunca vai automaticamente para alguém.

## PIX

Entra no financeiro, não no caixa físico.
Sem integração bancária automática.

## Dinheiro e caixa

Venda R$8, entrega R$10:

- +R$10 entrada física;
- -R$2 troco;
- +R$8 líquido.

Caixa:

- abertura opcional;
- PIX funciona sem caixa;
- dinheiro exige caixa;
- troco inicial não é receita;
- adicionar dinheiro para troco;
- retirar dinheiro do caixa;
- fechamento esperado/contado/diferença;
- motivo/nota;
- caixa antigo aberto bloqueia dinheiro novo, não PIX.

Não controlar água/luz/aluguel/fornecedores na V2.

## Estornos

Só dona em ações privilegiadas.
Original permanece.
Criar reversão.
Permitir devolução em meio diferente com confirmação.
Perguntar se item voltou ao estoque.

## Estoque

Ao abrir o dia, dona informa quantidade inicial por produto controlado.
Quantidade física = abertura + movimentos.
Venda confirmada baixa estoque, qualquer que seja o pagamento.
Ajuste: só dona, com motivo/movimento.
Zero aparece `ACABOU`.

Disponível = físico - reservado ativo.

## Anotações

Escopos:

- operação;
- dia;
- semana (segunda a domingo).

Menções estruturadas:

- `@aluno`;
- `@responsável`;
- múltiplas.

Autocomplete privado diferencia homônimos.
Edição preserva versões/autores.
Anulação preserva histórico.

## Usuários

V2 inicial:

- dona;
- funcionário;
- permissões fixas simples.
  Customização detalhada futura.
  Toda autorização checada no backend.

## Relatórios

Dia/semana/mês:

- vendas brutas;
- descontos;
- vendas líquidas;
- recebido;
- PIX;
- dinheiro;
- fiado;
- créditos recebidos/consumidos;
- acréscimos;
- a receber;
- atrasos;
- caixa;
- estoque;
- reservas.

Não chamar de lucro.

## WhatsApp V2.1

Seguir integralmente `whatsapp-inbox-v2.1.md`.

- unidade de trabalho é mensagem;
- nenhuma classificação semântica automática;
- dona escolhe cada ação;
- programa não envia respostas;
- cardápio/PIX podem ser copiados;
- retenção configurável, padrão 90 dias;
- telefone pode pertencer a aluno ou responsável;
- cada mensagem pode gerar várias ações;
- ação concluída não significa resposta concluída;
- Inbox usa mais antigas primeiro.

## Histórico completo do aluno

Cada aluno possui histórico filtrável de compras, pagamentos, fiado, créditos, acréscimos, renegociações e estornos, sempre com data e hora completas. Compras preservam itens, quantidades, preço histórico, descontos, total, origem balcão/reserva, consumidor/conta cobrada e meios de pagamento. Reservas canceladas/no-show ficam em visão própria de reservas.
