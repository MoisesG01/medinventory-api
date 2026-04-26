output "resource_group_name" {
  description = "Name of the resource group"
  value       = data.azurerm_resource_group.main.name
}

output "mysql_server_fqdn" {
  description = "MySQL server FQDN"
  value       = azurerm_mysql_flexible_server.main.fqdn
  sensitive   = true
}

output "mysql_database_name" {
  description = "MySQL database name"
  value       = azurerm_mysql_flexible_database.main.name
}

output "mysql_admin_username" {
  description = "MySQL admin username"
  value       = var.mysql_admin_username
  sensitive   = true
}

output "mysql_admin_password" {
  description = "MySQL admin password"
  value       = random_password.mysql_password.result
  sensitive   = true
}

output "database_url" {
  description = "Database connection URL for Prisma"
  value       = "mysql://${var.mysql_admin_username}:${random_password.mysql_password.result}@${azurerm_mysql_flexible_server.main.fqdn}:3306/${azurerm_mysql_flexible_database.main.name}?sslmode=required"
  sensitive   = true
}

output "container_registry_name" {
  description = "ACR name"
  value       = azurerm_container_registry.main.name
}

output "container_registry_login_server" {
  description = "ACR login server"
  value       = azurerm_container_registry.main.login_server
}

output "container_registry_admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "container_registry_admin_password" {
  description = "ACR admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

output "aks_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "aks_oidc_issuer_url" {
  description = "OIDC issuer URL (Workload Identity)"
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

output "api_load_balancer_ip" {
  description = "Public IP address of the Kubernetes Service (after apply)"
  value = var.enable_k8s_resources ? try(
    kubernetes_service.api_lb[0].status[0].load_balancer[0].ingress[0].ip,
    null
  ) : null
}

output "db_backup_container_name" {
  description = "Blob container where MySQL dumps are stored"
  value       = azurerm_storage_container.db_backups.name
}

output "csv_exports_storage_account_name" {
  description = "Storage account name for generated equipment CSV files (not Terraform state)"
  value       = azurerm_storage_account.artifacts.name
}

output "csv_exports_blob_endpoint" {
  description = "Primary blob endpoint for CSV export storage"
  value       = azurerm_storage_account.artifacts.primary_blob_endpoint
}

output "csv_exports_container_name" {
  description = "Blob container name for CSV exports"
  value       = azurerm_storage_container.csv_exports.name
}

output "redis_hostname" {
  description = "Azure Cache for Redis — hostname (SSL porta 6380)"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_port" {
  description = "Porta SSL do Redis (6380)"
  value       = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_access_key" {
  description = "Chave primária do Redis (sensível)"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "redis_connection_string" {
  description = "URL estilo rediss:// para clientes que aceitam connection string (chave na URL)"
  value       = format("rediss://:%s@%s:%s/0", urlencode(azurerm_redis_cache.main.primary_access_key), azurerm_redis_cache.main.hostname, azurerm_redis_cache.main.ssl_port)
  sensitive   = true
}