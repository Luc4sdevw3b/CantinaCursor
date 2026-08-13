# Convenções de engenharia

Regras estáveis da V2 AppScript. Não substituem as referências de domínio; complementam a Skill com contratos pequenos e explícitos.

Gerenciador oficial: `npm`. Lockfile oficial: `package-lock.json`. Não usar pnpm nem yarn.

Versão canônica: arquivo `VERSION` na raiz. `package.json.version` e `src/app-version.ts` devem coincidir. Conferir com `npm run version:check`.

## Dinheiro

- armazenar e calcular em **inteiro de centavos**;
- nunca usar float como fonte de verdade;
- BRL (`R$ 12,50`) somente na apresentação.

## Estoque

- quantidades inteiras na V2;
- nunca número decimal para unidade de produto.

## Datas

- data civil: `YYYY-MM-DD`;
- timestamps: ISO 8601;
- timezone do negócio: `America/Sao_Paulo`;
- UI: `Segunda-feira • 17/08/26`.

## IDs

- IDs imutáveis;
- nunca usar número da linha do Sheets como identidade;
- formato inicial: UUID, salvo justificativa já registrada no changelog.

## Request IDs

Operações mutáveis críticas terão `request_id` para idempotência quando essa infraestrutura entrar (locks/batch). Não antecipar o mecanismo agora.

## Erros

Contrato simples, sem hierarquia de classes:

```ts
type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
      };
    };
```

Implementação atual: `src/domain/result.ts`.

- `code`: estável para o programa;
- `message`: segura para a dona, sem stack e sem PII;
- `retryable`: se a operação pode ser tentada de novo.

Não converter APIs já estáveis só para usar `Result`. Adotar em operações novas de domínio quando elas existirem.
