# Observabilidade: Prometheus (métricas) + Grafana (dashboards)

Este documento descreve tudo o que foi implementado na aplicação para **métricas Prometheus** e **dashboards no Grafana**, além de como rodar e validar localmente via `docker-compose`.

## Visão geral

Foram adicionados:

- **Endpoint `GET /metrics`** na API, expondo métricas no formato Prometheus.
- **Métrica customizada `http_requests_total`** (Counter) para contar requests por endpoint e status code.
- **Prometheus** configurado para raspar a API em `/metrics`.
- **Grafana** com datasource do Prometheus provisionado + **1 dashboard provisionado** (`MedInventory API`) contendo **2 painéis por rota+método** (time series 15m e gauge 12h).

## Métricas na API (NestJS)

### Dependência adicionada

- Pacote: `prom-client` (em `package.json`)

### Endpoint `/metrics`

- Implementado no controller `src/metrics/metrics.controller.ts`
- Rota: **`GET /metrics`**
- Retorna o conteúdo do registry do `prom-client` com `Content-Type` adequado.
- O endpoint é excluído do Swagger via `@ApiExcludeEndpoint()`.

### Registry e métricas padrão

Definido em `src/metrics/metrics.ts`:

- `metricsRegistry`: registry dedicado do `prom-client`
- `collectDefaultMetrics(...)`: habilita métricas padrão do Node.js/processo (CPU, memória, event loop, etc.)

### Counter por endpoint e status code

Também em `src/metrics/metrics.ts`:

- **Nome**: `http_requests_total`
- **Tipo**: Counter
- **Labels**:
  - `method` (ex.: `GET`, `POST`)
  - `route` (rota normalizada)
  - `status_code` (ex.: `200`, `400`, `404`, `500`)

### Como o contador é incrementado (middleware global)

Implementado em `src/main.ts` via `app.use(...)`:

- Usa `res.on('finish')` para capturar o status final (inclui 404/500).
- **Ignora** o próprio endpoint `/metrics` para não gerar auto-tráfego no dashboard.
- Para reduzir cardinalidade:
  - tenta usar a rota do Express (`baseUrl + route.path`) quando disponível
  - caso não exista (`404`), usa `req.path`
  - aplica `normalizeRoute(...)` para evitar valores vazios e truncar strings muito longas

Exemplos de séries geradas:

- `http_requests_total{method="GET",route="/health",status_code="200"} 123`
- `http_requests_total{method="GET",route="/rota-inexistente",status_code="404"} 10`

## Prometheus (scrape da API)

Arquivo: `docker/prometheus/prometheus.yml`

Configuração relevante:

- Job `medinventory-api`
- Target: `api:8080`
- `metrics_path: /metrics`

Com o `docker-compose`, o Prometheus fica acessível em:

- `http://localhost:9090`

E você pode verificar os targets em:

- `http://localhost:9090/api/v1/targets`

## Grafana (datasource e dashboard provisionados)

### Datasource do Prometheus

Arquivo:

- `docker/grafana/provisioning/datasources/datasource.yml`

Cria automaticamente o datasource:

- Nome: `Prometheus`
- URL: `http://prometheus:9090`
- Default: `true`

### Provisionamento de dashboards

Arquivos:

- `docker/grafana/provisioning/dashboards/dashboards.yml`
- `docker/grafana/provisioning/dashboards/medinventory-api.json`

O provisioning:

- cria a pasta **“MedInventory”**
- carrega o dashboard **“MedInventory API”** automaticamente no startup do Grafana

### Dashboard: “MedInventory API”

Este dashboard consolida a visão de tráfego HTTP para `users` e `equipamentos` e é composto por **28 painéis** (2 por rota+método):

- **Painel time series (15m)**: soma por `status_code` nos últimos 15 minutos

```promql
sum(increase(http_requests_total{route="<ROTA>", method="<METODO>"}[15m])) by (status_code)
```

- **Painel gauge (12h)**: soma por `status_code` nas últimas 12 horas

```promql
sum(increase(http_requests_total{route="<ROTA>", method="<METODO>"}[12h])) by (status_code)
```

#### Rotas e métodos incluídos

Somente rotas de `users` e `equipamentos`. **Não** são criados painéis para `/metrics` e `/health`.

**Users**

- `POST /users`
- `GET /users`
- `GET /users/me`
- `GET /users/protected`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

**Equipamentos**

- `POST /equipamentos`
- `GET /equipamentos`
- `GET /equipamentos/export/csv`
- `GET /equipamentos/:id`
- `PATCH /equipamentos/:id/status`
- `PUT /equipamentos/:id`
- `DELETE /equipamentos/:id`

Grafana local:

- `http://localhost:3001`
- Credenciais default: `admin` / `admin` (ajustáveis via `GRAFANA_ADMIN_USER` e `GRAFANA_ADMIN_PASSWORD` no compose)

## Como validar fim-a-fim (local)

1) Subir o stack:

```bash
docker compose up -d --build
```

2) Gerar tráfego:

- `GET http://localhost:8080/health` (200)
- Acessar uma rota inexistente (404), ex.: `GET http://localhost:8080/nao-existe`

3) Verificar se o counter aparece:

- `GET http://localhost:8080/metrics`
  - procure por linhas `http_requests_total{...}`

4) Verificar o Prometheus raspando a API:

- `http://localhost:9090/targets` (deve mostrar `medinventory-api` como **UP**)

5) Verificar o dashboard no Grafana:

- `http://localhost:3001`
- Abra a pasta **MedInventory** → dashboard **“MedInventory API”**
- Você verá 2 painéis por rota+método: **(15m)** à esquerda e **(12h)** à direita.

## Notas e boas práticas

- **Cardinalidade**: manter `route` com baixa variação é importante. O middleware tenta usar a rota do Express (`/users/:id`) quando possível; para 404, cai para o path real.
- **Evitar auto-métrica**: `/metrics` não incrementa `http_requests_total`.
- **Unidades**: o counter usa `increase(...)` no PromQL para calcular contagens em janelas de tempo, o que é o padrão para counters.

