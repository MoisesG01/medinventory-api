# Stack local (docker-compose): MySQL + Redis + Blob (Azurite) + Prometheus + Grafana + API

Este guia sobe localmente (via Docker Compose) os serviços equivalentes aos que vocês provisionam na Azure: **MySQL**, **Redis**, **Blob Storage** (via **Azurite**), **Prometheus** e **Grafana** (e também a **API** deste repositório).

## Pré-requisitos

- Docker Desktop (com Docker Compose v2)

## Subir o ambiente

Na raiz do repo:

```bash
docker compose up -d --build
```

## Endereços locais

- **API**: `http://localhost:8080/health`
- **Métricas (Prometheus format)**: `http://localhost:8080/metrics`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001`
  - Usuário: `admin`
  - Senha: `admin` (altere via variáveis `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- **Azurite (Blob)**: `http://localhost:10000`

## Variáveis úteis (opcional)

Você pode sobrescrever portas e credenciais via variáveis de ambiente ao rodar o compose:

- `MYSQL_ROOT_PASSWORD` (default: `root`)
- `MYSQL_DATABASE` (default: `medinventory_db`)
- `MYSQL_USER` / `MYSQL_PASSWORD` (default: `medinventory` / `medinventory`)
- `MYSQL_PORT` (default: `3307`) — mapeamento da porta do MySQL no host
- `API_PORT` (default: `8080`)
- `GRAFANA_PORT` (default: `3001`)
- `PROMETHEUS_PORT` (default: `9090`)
- `AZURITE_BLOB_PORT` (default: `10000`)
- `DATABASE_URL_LOCAL` (opcional) — **sobrescreve** a conexão do Prisma no container da API (por padrão aponta para o MySQL do compose)

Exemplo:

```bash
MYSQL_ROOT_PASSWORD=strongpass \
MYSQL_PASSWORD=strongpass \
GRAFANA_ADMIN_PASSWORD=strongpass \
docker compose up -d --build
```

## Network (DNS interno entre serviços)

O compose cria uma network dedicada chamada `medinventory_net`. Dentro dela, os serviços se enxergam por DNS usando o nome do service:

- **MySQL**: `mysql:3306`
- **Redis**: `redis:6379`
- **Azurite (Blob)**: `azurite:10000`
- **API**: `api:8080`

## Dados persistentes

Os dados ficam persistidos em volumes Docker:

- `mysql_data`
- `redis_data`
- `prometheus_data`
- `grafana_data`
- `azurite_data`

## Parar e remover

Parar containers:

```bash
docker compose down
```

Parar e remover volumes (apaga dados):

```bash
docker compose down -v
```

## Observabilidade (Prometheus/Grafana)

- O Grafana já vem provisionado com datasource do Prometheus (`docker/grafana/provisioning/datasources/datasource.yml`).
- O Prometheus está configurado para coletar métricas dele mesmo e também da API em `/metrics` (`docker/prometheus/prometheus.yml`).

## Blob Storage local (Azurite)

O Azurite emula o **Azure Blob Storage** localmente.

- **Endpoint interno (entre containers)**: `http://azurite:10000/devstoreaccount1`
- **Endpoint no host**: `http://localhost:10000/devstoreaccount1`

Connection string padrão (já definida no container da API via `AZURE_STORAGE_CONNECTION_STRING`):

```text
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNoGFkFQxUQ==;BlobEndpoint=http://azurite:10000/devstoreaccount1;
```

### Criar container e enviar um arquivo (exemplo)

Se você tiver o Azure CLI com storage extension, dá para testar assim:

```bash
# cria container
az storage container create \
  --name equipamentos-csv \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNoGFkFQxUQ==;BlobEndpoint=http://localhost:10000/devstoreaccount1;"

# upload de um arquivo
az storage blob upload \
  --container-name equipamentos-csv \
  --name test.txt \
  --file test.txt \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNoGFkFQxUQ==;BlobEndpoint=http://localhost:10000/devstoreaccount1;"
```

