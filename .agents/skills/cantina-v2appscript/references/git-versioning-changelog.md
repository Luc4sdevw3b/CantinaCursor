# Git, GitHub, versões e changelog

## Toda mudança lógica recebe commit

Antes:

- testes aplicáveis;
- diff review;
- changelog.

Exemplos:

- `feat: add reservation slots`
- `fix: prevent duplicate family payment`
- `test: cover concurrent reservation`
- `docs: record failed stock refactor`

## Falhas da IA também são história

Se não conseguir concluir:

1. não esconder;
2. reverter código quebrado quando possível;
3. deixar branch verde;
4. registrar `Status: Falhou` ou `Parcial`;
5. explicar tentativas e bloqueio;
6. fazer commit do registro, ex. `docs: record failed reservation refactor`.

## Changelog obrigatório

`V2APPSCRIPT_CHANGELOG.md`, entrada nova no topo.

Registrar:

- pedido do usuário;
- implementação adicional da IA;
- correção;
- decisão técnica;
- dependência;
- mudança de schema;
- UX;
- segurança;
- testes;
- falha;
- tentativa abortada;
- revert;
- release.

Formato:

```md
## YYYY-MM-DD HH:mm — Título

**Origem:** Pedido do usuário | Implementação necessária | Correção | Decisão técnica | Tentativa da IA
**Status:** Implementado | Parcial | Falhou | Revertido | Planejado
**Versão alvo:** x.y.z ou não definida
**Fase:** Fase N

### Pedido / objetivo

### Tentativa / implementação

### Resultado

### Diferenças do pedido

### Impacto técnico

### Testes

### Pendências / próxima versão
```

Nunca reescrever entrada antiga para fingir outra história. Criar nova entrada que supersede.
Nunca incluir PII ou secrets.

## Versionamento

SemVer operacional:

- PATCH correção;
- MINOR funcionalidade compatível;
- MAJOR incompatibilidade/arquitetura.
  Durante desenvolvimento: `0.x.y`.

`VERSION` na raiz é a fonte canônica. `package.json.version` e `src/app-version.ts` devem coincidir. Falha reproduzível: `npm run version:check`.

## Toda nova versão/release

1. working tree limpa;
2. todos testes requeridos verdes;
3. E2E remoto verde;
4. backup/migration validados;
5. atualizar `VERSION`;
6. entrada de release no changelog;
7. commit `chore(release): vX.Y.Z`;
8. tag anotada `vX.Y.Z`;
9. push commit/tag GitHub;
10. `clasp version`;
11. deploy/redeploy PROD dessa versão imutável;
12. smoke PROD não destrutivo.

Commit != versão. Commit é cada mudança lógica; versão é um conjunto aprovado para entrega.

## GitHub

Não commitar `.clasprc.json`, tokens, secrets, exports PROD ou traces com PII.
`main` deve ficar verde. Release somente de `main`.
Evitar reescrever histórico publicado; corrigir com novo commit/changelog.
