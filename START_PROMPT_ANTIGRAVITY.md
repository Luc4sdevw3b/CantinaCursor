# Prompt inicial — Antigravity

Use `$cantina-v2appscript`.

Antes de alterar qualquer coisa:

1. leia `.agents/skills/cantina-v2appscript/SKILL.md`;
2. leia as referências relevantes;
3. leia `IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md`;
4. leia `V2APPSCRIPT_CHANGELOG.md`;
5. inspecione Git e o repositório.

Implemente **somente a Fase 0 e a Fase 1**. Pare antes da Fase 2.

Regras:

- Apps Script + Sheets + Drive; nunca Electron/SQLite.
- Git obrigatório.
- Toda mudança lógica: testes aplicáveis → changelog → commit.
- Toda tentativa falha também vai ao changelog; reverta código quebrado quando possível e faça commit do registro da falha.
- Testes automatizados desde agora.
- Configure Vitest e Playwright.
- Crie E2E local smoke desde a primeira tela.
- Configure GitHub Actions CI se o remote já existir; se depender de mim, prepare e diga exatamente o que fazer.
- Não commite secrets.
- Não avance para alunos, produtos, vendas, estoque ou `clasp`/deploy da Fase 2.

Pronto quando:

- `VERSION` existe;
- Git está limpo após commits;
- package + lockfile;
- TypeScript;
- lint/typecheck/build;
- Vitest;
- Playwright E2E local;
- tela placeholder Cantina V2 AppScript;
- Sistema/Claro/Escuro;
- adapter AppApi fake;
- changelog atualizado com tudo feito ou não concluído;
- commits claros.

Ao terminar, informe:

- commits;
- testes/resultados;
- arquivos principais;
- ações manuais que dependem de mim;
- não inicie a Fase 2.
