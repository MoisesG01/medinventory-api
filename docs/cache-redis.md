# Cache Redis (12h) nos endpoints `/users/:id` e `/equipamentos/:id`

Este documento descreve a implementação de cache usando **Redis** no backend (NestJS) para otimizar as requisições aos endpoints:

- `GET /users/:id`
- `GET /equipamentos/:id`

A solução é **transparente para o frontend**: não muda o contrato dos endpoints, apenas reduz tempo de resposta em chamadas repetidas (cache hit) e reduz carga no banco (Prisma/MySQL).

---

## Objetivo

- **Reduzir latência** e **diminuir carga no banco** para consultas por ID (read-heavy).
- **TTL fixo de 12h**: \(12 \times 60 \times 60 = 43200\) segundos.
- **Garantir consistência aceitável** via **invalidação** em operações de `update/delete`.
- **Resiliência**: se o Redis estiver indisponível, o sistema deve **continuar funcionando** com fallback para o banco.

---

## Componentes adicionados

### 1) Serviço de cache Redis

Arquivo: [`src/cache/redis-cache.service.ts`](../src/cache/redis-cache.service.ts)

Responsabilidades:

- Conectar ao Redis **sob demanda** (`lazyConnect`), evitando travar o boot da aplicação.
- Operações utilitárias:
  - `getJson<T>(key)` → retorna `T | null`
  - `setJson(key, value, ttlSeconds)` → grava JSON com TTL
  - `del(key)` → remove a chave
- **Fallback**: qualquer erro em Redis (`get/set/del`) é tratado de forma silenciosa e retorna `null`/`void`, mantendo o fluxo do endpoint via banco.

Configuração importante:

- TTL padrão: **12h (43200s)**.
- `enableOfflineQueue: false` e `maxRetriesPerRequest: 0` para evitar que requisições fiquem “presas” em fila quando o Redis cair.

### 2) Módulo de cache

Arquivo: [`src/cache/cache.module.ts`](../src/cache/cache.module.ts)

- Define `CacheModule` como **global** (`@Global()`), exportando `RedisCacheService`.
- Importa `ConfigModule` para disponibilizar `ConfigService` no contexto do módulo (inclusive em testes).

### 3) Registro no `AppModule`

Arquivo: [`src/app.module.ts`](../src/app.module.ts)

- Importa `CacheModule` para disponibilizar o serviço globalmente.

---

## Como o cache foi aplicado nos endpoints

### Cache de usuários (`GET /users/:id`)

Arquivo: [`src/user/user.service.ts`](../src/user/user.service.ts)

- Chave: `users:{id}`
- Fluxo:
  1. tenta buscar do cache (`getJson`)
  2. se **hit**, retorna imediatamente
  3. se **miss**, consulta o Prisma (`findUnique`)
  4. se encontrado, grava em cache com TTL 12h (`setJson`)

**Invalidação:**

- `update(id, ...)` → `DEL users:{id}`
- `remove(id)` → `DEL users:{id}`

### Cache de equipamentos (`GET /equipamentos/:id`)

Arquivo: [`src/equipamentos/equipamentos.service.ts`](../src/equipamentos/equipamentos.service.ts)

- Chave: `equipamentos:{id}`
- Fluxo idêntico ao de usuários:
  - cache hit → retorna
  - cache miss → busca no banco → grava em cache com TTL 12h

**Invalidação:**

- `update(id, ...)` → `DEL equipamentos:{id}`
- `updateStatus(id, ...)` → `DEL equipamentos:{id}`
- `remove(id)` → `DEL equipamentos:{id}`

---

## Variáveis de ambiente

O cache é ativado quando existe pelo menos uma destas configurações:

- `REDIS_URL` (recomendado, ex.: fornecido via Terraform/App Service)
- ou `REDIS_HOST`

Variáveis suportadas:

- `REDIS_URL`: connection string (ex.: `rediss://:PASSWORD@HOST:6380/0`)
- `REDIS_HOST`: hostname do Redis
- `REDIS_PORT`: porta (default: `6380`)
- `REDIS_TLS`: `"true"`/`"false"` (default: `true`)
- `CACHE_TTL_SECONDS`: opcional, para sobrescrever o TTL padrão (default: `43200`)

> Observação: via Terraform, o App Service já recebe `REDIS_HOST`, `REDIS_PORT`, `REDIS_TLS` e `REDIS_URL` automaticamente.

---

## Resiliência (Redis indisponível)

Mesmo que o Redis esteja fora:

- `getJson` retorna `null` → endpoint cai no banco (Prisma)
- `setJson` falha silenciosamente → endpoint retorna normalmente
- `del` falha silenciosamente → endpoint retorna normalmente

Assim, **não há indisponibilidade do sistema** por causa do Redis (apenas perda do benefício de cache).

---

## Testes ajustados

- [`src/user/user.service.spec.ts`](../src/user/user.service.spec.ts)
  - adicionados testes de **cache hit** (não chama Prisma) e invalidação em `update/remove`.
  - `RedisCacheService` é mockado.

- [`src/equipamentos/equipamentos.service.spec.ts`](../src/equipamentos/equipamentos.service.spec.ts)
  - adicionados testes de **cache hit**, gravação em cache e invalidação em `update/updateStatus/remove`.
  - `RedisCacheService` é mockado.

- [`src/user/user.module.spec.ts`](../src/user/user.module.spec.ts)
  - ajustado para incluir `CacheModule` no contexto de teste.

---

## Observações de consistência

- **Consistência** é garantida por **invalidação** sempre que houver alteração do registro (update/delete).
- O TTL de 12h limita a permanência máxima em cache caso alguma invalidação não ocorra (ex.: alteração feita fora do fluxo da aplicação).

