# Linux Web App
resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-app-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = var.app_service_sku != "F1" # Free tier doesn't support always_on
    
    application_stack {
      docker_image_name = "${azurerm_container_registry.main.login_server}/${var.project_name}-api:latest"
    }

    container_registry_use_managed_identity = true
  }

  app_settings = {
    # Database configuration (URL encoded password for special characters)
    # Using sslaccept=strict instead of sslmode=required (Prisma specific)
    DATABASE_URL = format("mysql://%s:%s@%s:3306/%s?sslaccept=strict",
      var.mysql_admin_username,
      urlencode(random_password.mysql_password.result),
      azurerm_mysql_flexible_server.main.fqdn,
      azurerm_mysql_flexible_database.main.name
    )
    
    # JWT configuration
    JWT_SECRET = random_password.jwt_secret.result
    JWT_EXPIRES_IN = "24h"
    
    # Application configuration
    NODE_ENV = var.environment
    PORT = "8080"
    
    # Tell App Service to use Managed Identity for ACR
    DOCKER_REGISTRY_SERVER_URL = "https://${azurerm_container_registry.main.login_server}"
    
    # Enable logging
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITES_CONTAINER_START_TIME_LIMIT = "1800"
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true
    
    application_logs {
      file_system_level = "Information"
    }
    
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = var.tags
}

# Random JWT secret
resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}