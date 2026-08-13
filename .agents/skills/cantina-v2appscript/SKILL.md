---
name: cantina-v2appscript
description: Desenvolver, revisar, testar, versionar e manter a Cantina V2 AppScript deste repositório: Google Apps Script Web App + Google Sheets + Google Drive, incluindo alunos, responsáveis, irmãos, produtos, estoque, vendas, fiado, créditos, caixa, agenda, reservas públicas, Inbox oficial do WhatsApp Business, auditoria, backup, Git/GitHub, CI, testes unitários, integração e E2E. Use em toda mudança, correção, pedido, tentativa parcial ou falha. Não use Electron ou SQLite como arquitetura principal.
---

# Cantina V2 AppScript

Trabalhar como engenheiro cuidadoso da Cantina V2 AppScript. Priorizar integridade financeira, rastreabilidade, privacidade, UX simples e evolução auditável.

## Antes de editar

1. Ler `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md`.
2. Ler `V2APPSCRIPT_CHANGELOG.md`.
3. Ler somente as referências necessárias:
   - arquitetura: `references/architecture.md`
   - regras: `references/business-rules.md`
   - modelo Sheets: `references/data-model-sheets.md`
   - reservas: `references/reservations.md`
   - WhatsApp oficial e Inbox V2.1: `references/whatsapp-inbox-v2.1.md`
   - testes/E2E/CI: `references/testing-e2e-ci.md`
   - Git/versões/changelog: `references/git-versioning-changelog.md`
   - segurança/backup/logs: `references/security-maintenance.md`
   - convenções: `references/engineering-conventions.md`
4. Inspecionar código e Git.
5. Não avançar de fase sem pedido explícito.

## Fluxo obrigatório

1. Classificar a tarefa: pedido, correção, decisão técnica, manutenção ou tentativa.
2. Inspecionar o código afetado.
3. Criar/ajustar testes antes ou junto da implementação.
4. Implementar a menor mudança completa possível.
5. Rodar unit/integration/E2E aplicáveis, typecheck, lint e build.
6. Revisar o diff.
7. Atualizar `V2APPSCRIPT_CHANGELOG.md` inclusive se a tarefa ficar parcial, falhar, for revertida ou a IA não conseguir concluir.
8. Se falhar, deixar o código verde/limpo quando possível e registrar claramente o bloqueio.
9. Fazer commit Git da mudança lógica. Se nada pôde ser implementado, fazer commit somente do registro da tentativa/falha.
10. Informar resultado, testes, commit e pendências.

## Regras inegociáveis

- Arquitetura: Apps Script Web App + Sheets + Drive; desenvolvimento local com `clasp`.
- Git é a fonte de verdade do código. Evitar edição manual no editor Apps Script depois de o fluxo Git/clasp existir.
- Separar DEV/E2E/PROD. Testes nunca usam a planilha PROD.
- Dinheiro em centavos inteiros.
- IDs imutáveis; nunca usar número da linha como identidade.
- Operações críticas usam `LockService`, idempotência e escrita em lote/atômica quando possível.
- Nunca alterar saldo, dívida, crédito, estoque ou caixa por sobrescrita silenciosa; usar movimentos/eventos.
- Estornos preservam o original e criam reversões.
- Frontend chama apenas funções específicas do domínio; nunca ranges/SQL/Sheets genéricos.
- Validar novamente no backend.
- Portal público de reservas nunca expõe cadastro privado.
- Logs não contêm nomes, telefones, notas, itens comprados, valores individuais, conteúdo de planilha ou secrets.
- Não commitar `.clasprc.json`, tokens, credenciais, secrets ou dados reais.
- Não esconder falha de teste, tentativa ou limitação.
- Toda mudança relevante atualiza changelog.
- Toda mudança lógica recebe commit.
- Toda nova versão recebe commit de release + tag Git + versão Apps Script.
- `main`/release deve permanecer verde.
- Não afirmar que testou algo que não foi executado.

## Princípio de escolha

Quando houver mais de uma interpretação financeira válida, oferecer escolhas claras à dona. Automatizar somente regras já aprovadas e rastreáveis.

## Como explicar

O usuário faz vibecoding e conhece programação básica:

- linguagem simples primeiro;
- termo técnico depois;
- mudanças pequenas;
- explicar riscos/migrations;
- mostrar comandos exatos para ações manuais do Google/GitHub.

## Pronto quando

- comportamento solicitado implementado ou falha registrada;
- testes relevantes criados/ajustados;
- checks aplicáveis passaram;
- changelog atualizado;
- sem vazamento de PII/secrets;
- diff revisado;
- commit criado.
