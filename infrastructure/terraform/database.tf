# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "main" {
  name                   = "${var.project_name}-mysql-${var.environment}"
  resource_group_name    = data.azurerm_resource_group.main.name
  location               = data.azurerm_resource_group.main.location
  administrator_login    = var.mysql_admin_username
  administrator_password = random_password.mysql_password.result
  
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  
  sku_name   = var.mysql_sku_name
  zone       = "3"
  
  storage {
    size_gb = var.mysql_storage_size_gb
  }

  tags = var.tags
}

# MySQL Database
resource "azurerm_mysql_flexible_database" "main" {
  name                = "${var.project_name}_db"
  resource_group_name = data.azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb3"
  collation           = "utf8mb3_unicode_ci"
}

# Firewall rule to allow Azure services
resource "azurerm_mysql_flexible_server_firewall_rule" "azure_services" {
  name                = "AllowAzureServices"
  resource_group_name = data.azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Firewall rule for development (remove in production)
resource "azurerm_mysql_flexible_server_firewall_rule" "dev_access" {
  count               = var.environment == "dev" ? 1 : 0
  name                = "AllowDevelopmentAccess"
  resource_group_name = data.azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "255.255.255.255"
}

# MySQL Configuration for timezone
resource "azurerm_mysql_flexible_server_configuration" "timezone" {
  name                = "time_zone"
  resource_group_name = data.azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  value               = "-03:00"  # Brazil timezone
}

# MySQL Configuration for SQL mode
resource "azurerm_mysql_flexible_server_configuration" "sql_mode" {
  name                = "sql_mode"
  resource_group_name = data.azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  value               = "STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
}