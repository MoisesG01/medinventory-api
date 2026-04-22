# Exportação de equipamentos (CSV) com Azure Blob Storage

Este documento descreve o que foi implementado: geração do CSV no backend, armazenamento numa **Storage Account dedicada** (separada da conta usada para o estado Terraform) e entrega ao cliente de uma **URL temporária (SAS)** para download direto do blob.

## Visão geral do fluxo

1. O cliente chama `GET /equipamentos/export/csv` com JWT e filtros opcionais (mesmos da listagem).
2. A API consulta o Prisma, monta o CSV (UTF-8 com BOM, compatível com Excel) e faz upload para o container configurado.
3. A resposta é **JSON** com `downloadUrl` (URL do blob + SAS só leitura), `expiresOn`, `blobName` e `fileName` sugerido.
4. O cliente baixa o ficheiro com um **segundo pedido** à `downloadUrl` (não precisa de enviar o JWT da API neste URL; a SAS autoriza o acesso).

## Infraestrutura (Terraform)

Ficheiros relevantes em `infrastructure/terraform/`:

- **`storage-csv-exports.tf`** — cria:
  - conta de armazenamento `{project_name sem hífens}csv{environment}` (ex.: `medinventorycsvdev`);
  - container `equipamentos-csv` (privado);
  - atribuição de papel **Storage Blob Data Contributor** à Managed Identity do Linux Web App.
- **`app-service.tf`** — variáveis de aplicação:
  - `AZURE_STORAGE_ACCOUNT_NAME`
  - `AZURE_STORAGE_CSV_CONTAINER`
  - `AZURE_STORAGE_SAS_TTL_MINUTES` (predefinido `60`)
- **`outputs.tf`** — outputs com nome da conta, endpoint de blobs e nome do container.

A conta onde está o **tfstate** (`medinventorystorage` / container `tfstate`) **não** é usada para os CSV exportados.

## Backend (NestJS)

- **`src/storage/blob-csv.service.ts`** — upload do buffer e geração de SAS de leitura:
  - se existir `AZURE_STORAGE_CONNECTION_STRING`: credencial por chave (adequado a desenvolvimento local ou conta de testes);
  - caso contrário, `AZURE_STORAGE_ACCOUNT_NAME` + `DefaultAzureCredential` (Managed Identity no App Service) e **user delegation SAS**.
- **`src/storage/storage.module.ts`** — módulo global registado em `AppModule`.
- **`EquipamentosService.exportCsvToBlob`** — gera o CSV, grava o blob em `equipamentos/{uuid}.csv` e devolve o DTO de resposta.
- **`GET /equipamentos/export/csv`** — resposta JSON (`ExportCsvResponseDto`), não stream direto.

Variáveis opcionais:

- `AZURE_STORAGE_BLOB_ENDPOINT` — sobrescreve o endpoint predefinido `https://{account}.blob.core.windows.net` (nuvens soberanas / cenários especiais).

## Erros

- **503** — armazenamento não configurado (`AZURE_STORAGE_CONNECTION_STRING` e `AZURE_STORAGE_ACCOUNT_NAME` ausentes) ou falha de configuração/permissões.

## Documentação da API REST

Detalhes de query, exemplos `curl`, integração com fetch/axios e tratamento de erros encontram-se também em [`EQUIPAMENTOS_API.md`](../EQUIPAMENTOS_API.md) (secção de exportação CSV).

## Referência rápida de variáveis

| Variável | Obrigatório | Uso |
|----------|-------------|-----|
| `AZURE_STORAGE_CONNECTION_STRING` | Não* | Local/dev: upload + SAS com chave partilhada |
| `AZURE_STORAGE_ACCOUNT_NAME` | Sim no Azure (sem connection string) | MI + user delegation SAS |
| `AZURE_STORAGE_CSV_CONTAINER` | Não | Predefinição: `equipamentos-csv` |
| `AZURE_STORAGE_SAS_TTL_MINUTES` | Não | Duração do SAS (minutos) |
| `AZURE_STORAGE_BLOB_ENDPOINT` | Não | Endpoint de blobs personalizado |

\* Em produção no App Service, a connection string normalmente **não** é necessária se a MI tiver o papel correto na storage de exportação.
