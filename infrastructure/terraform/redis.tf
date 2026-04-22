# Azure Cache for Redis — provisionamento completo via Terraform (create / destroy).
# Nota: o serviço fica disponível automaticamente após o provisionamento; não existe
# operação separada de "start" como em VMs — o estado é gerido pela plataforma Azure.
#
# Variáveis declaradas neste ficheiro para o analisador/IDE resolver referências no mesmo módulo.

variable "redis_sku_name" {
  description = "SKU do Redis: Basic, Standard ou Premium"
  type        = string
  default     = "Basic"
}

variable "redis_family" {
  description = "Família: C (Basic/Standard) ou P (Premium)"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Capacidade (ex.: 0 = Basic C0, menor custo; ver documentação Azure para cada SKU)"
  type        = number
  default     = 0
}

resource "azurerm_redis_cache" "main" {
  name                = "${replace(var.project_name, "-", "")}redis${var.environment}"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name

  minimum_tls_version           = "1.2"
  non_ssl_port_enabled          = false
  public_network_access_enabled = true

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = var.tags
}
