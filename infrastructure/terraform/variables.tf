variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "medinventory"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Mexico Central"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "mysql_admin_username" {
  description = "MySQL admin username"
  type        = string
  default     = "adminuser"
}

variable "mysql_sku_name" {
  description = "MySQL SKU name"
  type        = string
  default     = "B_Standard_B1ms"  # Basic tier, 1 vCore, 2GB RAM
}

variable "mysql_storage_size_gb" {
  description = "MySQL storage size in GB"
  type        = number
  default     = 20
}

variable "app_service_sku" {
  description = "App Service SKU"
  type        = string
  default     = "B1"  # Basic tier
}

variable "sp_object_id" {
  description = "Object ID of the GitHub Actions Service Principal (for ACR push permissions)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project     = "MedInventory"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}