variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "medinventory"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  # Default location for resources that follow the Resource Group region.
  # Note: many resources in this repo use `data.azurerm_resource_group.main.location`.
  default     = "mexicocentral"
}

variable "jobs_location" {
  description = "Azure region for Container Apps Environment / Jobs (must support Microsoft.App/managedEnvironments)"
  type        = string
  default     = "brazilsouth"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "enable_k8s_resources" {
  description = "Whether to manage in-cluster Kubernetes/Helm resources (app + monitoring) via Terraform"
  type        = bool
  default     = false
}

variable "aks_kubernetes_version" {
  description = "AKS Kubernetes version (optional). Leave null to use Azure default."
  type        = string
  default     = null
}

variable "aks_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_B2s"
}

variable "aks_node_min_count" {
  description = "Minimum number of AKS nodes"
  type        = number
  default     = 2
}

variable "aks_node_max_count" {
  description = "Maximum number of AKS nodes"
  type        = number
  default     = 3
}

variable "monitoring_namespace" {
  description = "Namespace for Prometheus/Grafana stack"
  type        = string
  default     = "monitoring"
}

variable "kube_prometheus_stack_chart_version" {
  description = "Helm chart version for kube-prometheus-stack"
  type        = string
  default     = "69.8.2"
}

variable "mysql_admin_username" {
  description = "MySQL admin username"
  type        = string
  default     = "adminuser"
}

variable "mysql_sku_name" {
  description = "MySQL SKU name"
  type        = string
  default     = "B_Standard_B1ms" # Basic tier, 1 vCore, 2GB RAM
}

variable "mysql_storage_size_gb" {
  description = "MySQL storage size in GB"
  type        = number
  default     = 20
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