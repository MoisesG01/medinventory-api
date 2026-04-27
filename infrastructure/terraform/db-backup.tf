locals {
  db_backup_container_name = "mysql-dumps"
}

# Container para armazenar dumps do MySQL (gzip)
resource "azurerm_storage_container" "db_backups" {
  name                  = local.db_backup_container_name
  storage_account_name  = azurerm_storage_account.artifacts.name
  container_access_type = "private"
}

# Identidade para o job de backup (acesso ao Blob via RBAC)
resource "azurerm_user_assigned_identity" "db_backup_job" {
  name                = "${var.project_name}-db-backup-mi-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  tags                = var.tags
}

resource "azurerm_role_assignment" "db_backup_blob_contributor" {
  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.db_backup_job.principal_id

  skip_service_principal_aad_check = true
  depends_on = [
    azurerm_user_assigned_identity.db_backup_job,
    azurerm_storage_account.artifacts,
  ]
}

# Infra para Container Apps Job (logs e environment)
resource "azurerm_log_analytics_workspace" "jobs" {
  name = "${var.project_name}-jobs-law-${var.environment}"
  # Log Analytics Workspace location can't be changed in-place.
  # Keep it in the Resource Group's location to avoid replacement conflicts.
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_container_app_environment" "jobs" {
  name                       = "${var.project_name}-jobs-cae-${var.environment}"
  location                   = var.jobs_location
  resource_group_name        = data.azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.jobs.id
  tags                       = var.tags
}

# Job agendado: dump diário meia-noite (America/Sao_Paulo) e upload para Blob
resource "azurerm_container_app_job" "mysql_dump" {
  name                         = "${var.project_name}-mysql-dump-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.jobs.id
  resource_group_name          = data.azurerm_resource_group.main.name
  location                     = var.jobs_location

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.db_backup_job.id]
  }

  # Max runtime for a replica (e.g., 30 minutes)
  replica_timeout_in_seconds = 1800
  replica_retry_limit        = 1

  schedule_trigger_config {
    # Cron is evaluated in UTC. 03:00 UTC == 00:00 America/Sao_Paulo (UTC-3)
    cron_expression          = "0 3 * * *"
    parallelism              = 1
    replica_completion_count = 1
  }

  secret {
    name  = "mysql-password"
    value = random_password.mysql_password.result
  }

  template {
    container {
      name   = "mysql-dump"
      image  = "mcr.microsoft.com/azure-cli:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "MYSQL_HOST"
        value = azurerm_mysql_flexible_server.main.fqdn
      }
      env {
        name  = "MYSQL_USER"
        value = var.mysql_admin_username
      }
      env {
        name        = "MYSQL_PASSWORD"
        secret_name = "mysql-password"
      }
      env {
        name  = "MYSQL_DATABASE"
        value = azurerm_mysql_flexible_database.main.name
      }
      env {
        name  = "STORAGE_ACCOUNT"
        value = azurerm_storage_account.artifacts.name
      }
      env {
        name  = "STORAGE_CONTAINER"
        value = azurerm_storage_container.db_backups.name
      }

      # Instala cliente mysql, faz dump com SSL e envia para o Blob usando Managed Identity
      command = ["/bin/sh", "-lc"]
      args = [
        join(" && ", [
          "set -euo pipefail",
          "echo 'Installing mysql client...'",
          "apt-get update -y",
          "DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends mysql-client ca-certificates gzip",
          "ts=$(date -u +%Y-%m-%dT%H-%M-%SZ)",
          "file=/tmp/$${MYSQL_DATABASE}_$${ts}.sql.gz",
          "echo 'Running mysqldump...'",
          "mysqldump --ssl-mode=REQUIRED -h \"$${MYSQL_HOST}\" -u \"$${MYSQL_USER}\" -p\"$${MYSQL_PASSWORD}\" \"$${MYSQL_DATABASE}\" | gzip > \"$file\"",
          "echo 'Logging into Azure with managed identity...'",
          "az login --identity --allow-no-subscriptions 1>/dev/null",
          "blob_name=$${MYSQL_DATABASE}/$${ts}.sql.gz",
          "echo \"Uploading to blob: $${blob_name}\"",
          "az storage blob upload --auth-mode login --account-name \"$${STORAGE_ACCOUNT}\" --container-name \"$${STORAGE_CONTAINER}\" --name \"$${blob_name}\" --file \"$file\" --overwrite true",
          "echo 'Done.'",
        ])
      ]
    }
  }

  tags = var.tags
}

