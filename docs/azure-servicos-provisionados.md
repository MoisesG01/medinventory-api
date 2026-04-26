# Serviços Azure provisionados (Terraform)

Este documento descreve **todos os serviços/recursos Azure** que são provisionados pelo Terraform neste repositório, com base nos arquivos em `infrastructure/terraform/`.

> Importante: alguns recursos “dentro do cluster” (Kubernetes/Helm) são **condicionais** e só são criados quando `enable_k8s_resources=true` (workflow **Terraform Start Application**).

## Recursos pré-existentes (não gerenciados pelo Terraform)

O Terraform **não cria** estes itens; ele apenas referencia como *data sources* em `infrastructure/terraform/main.tf`:

- **Resource Group**: `${var.project_name}-rg` (ex.: `medinventory-rg`)
- **Storage Account do tfstate**: `${replace(var.project_name, "-", "")}storage` (ex.: `medinventorystorage`)
- **Container do tfstate**: `tfstate` (backend remoto do Terraform)

## Recursos Azure provisionados (gerenciados pelo Terraform)

### 1) AKS (Azure Kubernetes Service)

- **Recurso**: `azurerm_kubernetes_cluster.main` (`infrastructure/terraform/aks.tf`)
- **O que entrega**:
  - Cluster AKS com `network_plugin = "azure"` e Load Balancer `standard`
  - **OIDC issuer** e **Workload Identity** habilitados (`oidc_issuer_enabled = true`, `workload_identity_enabled = true`)
  - Node pool com autoscaling (min/max por variáveis)

### 2) Managed Identity + Federated Identity (para Workload Identity no AKS)

- **Recursos** (`infrastructure/terraform/aks.tf`):
  - `azurerm_user_assigned_identity.api_workload`
  - `azurerm_federated_identity_credential.api_workload`
- **Uso**:
  - Permite que a ServiceAccount `medinventory/medinventory-api` use identidade Azure sem segredo (federation via OIDC).

### 3) ACR (Azure Container Registry)

- **Recurso**: `azurerm_container_registry.main` (`infrastructure/terraform/container.tf`)
- **SKU**: Basic
- **Admin user**: habilitado (`admin_enabled = true`)

### 4) RBAC do ACR (pull para o AKS, push para o GitHub Actions)

- **Recursos** (`infrastructure/terraform/iam.tf`):
  - `azurerm_role_assignment.acrpull_role`:
    - Concede `AcrPull` para a identidade kubelet do AKS, permitindo *image pull* do ACR.
  - `azurerm_role_assignment.github_actions_acrpush`:
    - Concede `AcrPush` para o Service Principal do GitHub Actions (quando `sp_object_id` é informado).

### 5) MySQL Flexible Server + Database

- **Recursos** (`infrastructure/terraform/database.tf`):
  - `azurerm_mysql_flexible_server.main`
  - `azurerm_mysql_flexible_database.main`
  - `azurerm_mysql_flexible_server_configuration.timezone`
  - `azurerm_mysql_flexible_server_configuration.sql_mode`
- **Firewall**:
  - `AllowAzureServices` (`0.0.0.0` → `0.0.0.0`) para permitir conexões originadas de serviços Azure.
  - `AllowDevelopmentAccess` **somente em `dev`** (`0.0.0.0` → `255.255.255.255`) — não recomendado para produção.

### 6) Azure Cache for Redis

- **Recurso**: `azurerm_redis_cache.main` (`infrastructure/terraform/redis.tf`)
- **Configuração relevante**:
  - TLS mínimo `1.2`
  - Porta sem SSL desabilitada (`non_ssl_port_enabled = false`)
  - Acesso público habilitado (`public_network_access_enabled = true`)
  - Política de memória: `allkeys-lru`

### 7) Storage de artefatos (exports CSV e backups)

- **Recursos** (`infrastructure/terraform/storage-csv-exports.tf` e `db-backup.tf`):
  - `azurerm_storage_account.artifacts` (conta dedicada para artefatos da aplicação)
  - `azurerm_storage_container.csv_exports` (container `equipamentos-csv`)
  - `azurerm_storage_container.db_backups` (container `mysql-dumps`)

### 8) RBAC no Storage (API no AKS)

- **Recursos** (`infrastructure/terraform/storage-csv-exports.tf`):
  - `azurerm_role_assignment.app_csv_blob_data_contributor` (`Storage Blob Data Contributor`)
  - `azurerm_role_assignment.app_csv_blob_delegator` (`Storage Blob Delegator`)
- **Uso**:
  - A API (via Workload Identity) consegue gravar blobs e gerar SAS via *user delegation key*.

### 9) Backup do MySQL (Container Apps Job)

- **Recursos** (`infrastructure/terraform/db-backup.tf`):
  - `azurerm_log_analytics_workspace.jobs` (logs do ambiente de jobs)
  - `azurerm_container_app_environment.jobs`
  - `azurerm_user_assigned_identity.db_backup_job`
  - `azurerm_role_assignment.db_backup_blob_contributor` (MI do job com `Storage Blob Data Contributor`)
  - `azurerm_container_app_job.mysql_dump` (job agendado)
- **Comportamento**:
  - Agenda diária (cron em UTC) para gerar dump (`mysqldump --ssl-mode=REQUIRED`), compactar (`gzip`) e enviar para Blob.
  - Autenticação no Storage via **Managed Identity** (RBAC), sem chave de storage.

## Recursos dentro do cluster (condicionais)

Estes recursos só são gerenciados pelo Terraform quando `enable_k8s_resources=true`:

### 10) Namespace, ServiceAccount, Deployment e Service (LoadBalancer) da API

- **Recursos** (`infrastructure/terraform/k8s-app.tf`):
  - `kubernetes_namespace.medinventory`
  - `kubernetes_service_account.api` (anotada com `azure.workload.identity/client-id`)
  - `kubernetes_deployment.api`
  - `kubernetes_service.api_lb` (`type = "LoadBalancer"`)
- **Variáveis de ambiente injetadas no Pod** (principais):
  - `DATABASE_URL` apontando para `azurerm_mysql_flexible_server.main.fqdn`
  - `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` apontando para `azurerm_redis_cache.main` (TLS via `rediss://`)
  - `AZURE_STORAGE_ACCOUNT_NAME` e containers de artifacts

### 11) Monitoring (kube-prometheus-stack)

- **Recursos** (`infrastructure/terraform/monitoring.tf`):
  - `kubernetes_namespace.monitoring`
  - `helm_release.kube_prometheus_stack`
- **Exposição**:
  - Services em `ClusterIP` por padrão (sem exposição pública).

## Mudança em CI/CD relevante (GitHub Actions)

Para evitar falhas de `terraform init` por assinatura expirada de providers (`openpgp: key expired`), os workflows foram atualizados para usar uma versão moderna do Terraform e, no destroy, executar init com upgrade:

- **Workflows**:
  - `.github/workflows/terraform-create.yml` → Terraform `1.10.5`
  - `.github/workflows/terraform-start.yml` → Terraform `1.10.5`
  - `.github/workflows/terraform-destroy.yml` → Terraform `1.10.5` e `terraform init -upgrade`

## Observações de operação (AKS + Redis + MySQL)

- **MySQL**: com `AllowAzureServices (0.0.0.0)` o AKS consegue conectar **desde que** o servidor esteja com acesso público habilitado (padrão do Flexible Server quando não há rede privada configurada). Em `dev`, existe ainda uma regra de firewall totalmente aberta (remover em produção).
- **Redis**: está configurado com **TLS** e acesso público habilitado; a API usa `rediss://` e porta SSL.
- **Privatização (futuro)**: se vocês migrarem MySQL/Redis para acesso privado (VNet/Private Endpoint), será necessário integrar a rede do AKS (subnets, DNS privado, etc.).

