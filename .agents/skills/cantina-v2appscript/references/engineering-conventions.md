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

Operações mutáveis críticas recebem `request_id` (UUID). Retry e double submit com o mesmo `request_id` reutilizam o resultado em `_operation_requests`; não duplicam a mutação. Número da linha nunca é `request_id`.

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

## Sessão

Token de sessão é UUID, nunca número da linha. A autorização de papéis (`owner` / `staff`) vale no servidor; esconder botão na UI não autoriza.

## Performance (Fase 26.5)

- Interação só de interface (quantidade, produto, modal, filtro, navegação, carrinho) não chama Apps Script.
- Uma operação de negócio usa uma chamada de servidor quando possível e devolve os deltas/tela necessários.
- `CacheService` só para catálogo/categorias/turmas/configurações. Nunca é fonte da verdade financeira.
- `LockService` cobre só a mutação crítica; leitura de tela não espera lock.
- Após mutação, atualizar o estado local. Full refresh só no botão **Atualizar**.
- Não transformar tempo de rede Google em teste CI rígido.
