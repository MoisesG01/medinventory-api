# Backup e restauração do MySQL (Blob Storage)

Este projeto implementa **backup automático do banco MySQL** para **Azure Blob Storage** e permite **restauração manual** a partir de qualquer dump armazenado.

## Visão geral (como o backup funciona)

O backup é feito por um **Azure Container Apps Job** (agendado) definido em `infrastructure/terraform/db-backup.tf`.

- **Job**: `azurerm_container_app_job.mysql_dump`
- **Agenda**: diária, `cron_expression = "0 3 * * *"`
  - Cron é avaliado em **UTC**
  - `03:00 UTC` = `00:00` em **America/Sao_Paulo (UTC-3)** (conforme comentário no Terraform)
- **Origem**: Azure Database for MySQL Flexible Server (`azurerm_mysql_flexible_server.main.fqdn`)
- **Destino**: Azure Storage Account de artefatos (`azurerm_storage_account.artifacts`)
  - **Container de backups**: `mysql-dumps` (`azurerm_storage_container.db_backups`)

### O que o job executa

O container do job usa a imagem `mcr.microsoft.com/azure-cli:latest` e executa:

1. Instala `mysql-client`, `gzip` e certificados
2. Gera timestamp UTC: `ts=$(date -u +%Y-%m-%dT%H-%M-%SZ)`
3. Cria dump com SSL obrigatório:
   - `mysqldump --ssl-mode=REQUIRED ... | gzip > /tmp/<db>_<ts>.sql.gz`
4. Autentica no Azure via **Managed Identity**:
   - `az login --identity --allow-no-subscriptions`
5. Envia para o Blob usando RBAC (sem chave da storage):
   - `az storage blob upload --auth-mode login ...`

### Formato e caminho do arquivo no Blob

- **Arquivo local**: `/tmp/<MYSQL_DATABASE>_<ts>.sql.gz`
- **Nome do blob (path)**:
  - `blob_name=<MYSQL_DATABASE>/<ts>.sql.gz`
- **Exemplo**:
  - `medinventory_db/2026-04-26T03-00-00Z.sql.gz`

## Onde encontrar as informações (Terraform outputs)

Você pode obter os dados principais via outputs do Terraform em `infrastructure/terraform/outputs.tf`:

- `mysql_server_fqdn` (sensível)
- `mysql_database_name`
- `mysql_admin_username` (sensível)
- `mysql_admin_password` (sensível)
- `db_backup_container_name` (container de dumps)
- `csv_exports_storage_account_name` (storage account de artefatos; inclui backups)

## Pré-requisitos para restauração

Na sua máquina (restore manual), você precisa de:

- **Azure CLI** (`az`)
- **MySQL client** (`mysql`) e/ou `mysqldump`
- Acesso à subscription (login no Azure)
- Credenciais do MySQL (ou acesso equivalente)

> Observação: o Terraform cria uma regra de firewall `AllowAzureServices (0.0.0.0)` para o MySQL. Mesmo assim, dependendo do seu cenário, para restaurar a partir da sua máquina pode ser necessário:
> - liberar seu IP no firewall do Flexible Server, ou
> - executar o restore de dentro da Azure (ex.: Azure Cloud Shell, VM/Container na mesma rede), ou
> - usar Private Networking (se vocês migrarem para Private Endpoint no futuro).

## Restauração (passo a passo)

### Passo 1) Login no Azure

```bash
az login
az account set --subscription "<SUA_SUBSCRIPTION_ID>"
```

### Passo 2) Definir variáveis do ambiente (Storage + MySQL)

Preencha com os valores do seu ambiente (dev/staging/prod):

```bash
# Storage (artefatos)
export STORAGE_ACCOUNT="<nome-da-storage-de-artefatos>"
export BACKUP_CONTAINER="mysql-dumps"

# MySQL Flexible Server
export MYSQL_HOST="<fqdn-do-mysql-flexible>"     # ex: medinventory-mysql-dev.mysql.database.azure.com
export MYSQL_USER="<admin-username>"
export MYSQL_PASSWORD="<admin-password>"
export MYSQL_DATABASE="<nome-do-database>"      # ex: medinventory_db
```

Dica: se você estiver com Terraform disponível localmente e acesso ao state:

```bash
cd infrastructure/terraform
export STORAGE_ACCOUNT="$(terraform output -raw csv_exports_storage_account_name)"
export BACKUP_CONTAINER="$(terraform output -raw db_backup_container_name)"
export MYSQL_HOST="$(terraform output -raw mysql_server_fqdn)"
export MYSQL_USER="$(terraform output -raw mysql_admin_username)"
export MYSQL_PASSWORD="$(terraform output -raw mysql_admin_password)"
export MYSQL_DATABASE="$(terraform output -raw mysql_database_name)"
```

### Passo 3) Listar backups disponíveis no Blob

O job salva em um “diretório” igual ao nome do database: `<db>/<timestamp>.sql.gz`.

```bash
az storage blob list \
  --auth-mode login \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$BACKUP_CONTAINER" \
  --prefix "${MYSQL_DATABASE}/" \
  --query "[].name" \
  -o tsv
```

Escolha um blob para restaurar, por exemplo:

```bash
export BACKUP_BLOB="${MYSQL_DATABASE}/2026-04-26T03-00-00Z.sql.gz"
```

### Passo 4) Baixar o backup selecionado

```bash
mkdir -p .restore
az storage blob download \
  --auth-mode login \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$BACKUP_CONTAINER" \
  --name "$BACKUP_BLOB" \
  --file ".restore/backup.sql.gz" \
  --overwrite true
```

### Passo 5) Descompactar o dump

```bash
gzip -d -c ".restore/backup.sql.gz" > ".restore/backup.sql"
```

### Passo 6) (Opcional) Criar o database (se não existir)

Se você estiver restaurando para um servidor limpo, crie o database:

```bash
mysql \
  --ssl-mode=REQUIRED \
  -h "$MYSQL_HOST" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;"
```

### Passo 7) Restaurar (importar) o dump para o database

> Atenção: este procedimento **sobrescreve dados existentes** (o dump pode conter `DROP TABLE`, `CREATE TABLE`, etc., dependendo de como foi gerado). Use com cuidado.

```bash
mysql \
  --ssl-mode=REQUIRED \
  -h "$MYSQL_HOST" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASSWORD" \
  "$MYSQL_DATABASE" < ".restore/backup.sql"
```

### Passo 8) Validar a restauração

Exemplos de validação rápida:

```bash
mysql \
  --ssl-mode=REQUIRED \
  -h "$MYSQL_HOST" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASSWORD" \
  -e "SHOW DATABASES;"
```

```bash
mysql \
  --ssl-mode=REQUIRED \
  -h "$MYSQL_HOST" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASSWORD" \
  "$MYSQL_DATABASE" \
  -e "SHOW TABLES;"
```

## Restauro “para outro database” (opcional / recomendado para testes)

Para validar um backup sem tocar no banco atual, você pode restaurar em outro database:

```bash
export MYSQL_DATABASE_RESTORE="${MYSQL_DATABASE}_restore_test"

mysql --ssl-mode=REQUIRED -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE_RESTORE}\`;"

mysql --ssl-mode=REQUIRED -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  "$MYSQL_DATABASE_RESTORE" < ".restore/backup.sql"
```

## Troubleshooting

### Erro: acesso negado ao Blob (RBAC)

- Garanta que seu usuário tenha permissão no Storage Account (ex.: **Storage Blob Data Reader**).
- Confirme que você está usando `--auth-mode login` (RBAC) e não chave.

### Erro: não consegue conectar no MySQL (firewall)

- Verifique regras de firewall do MySQL Flexible Server.
- Em `dev`, existe regra aberta; em `staging/prod`, talvez seja necessário liberar seu IP.

### Erro: SSL/TLS

- O dump é gerado com `--ssl-mode=REQUIRED`. Use também `--ssl-mode=REQUIRED` no `mysql` durante o restore.

