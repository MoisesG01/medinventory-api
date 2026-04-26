locals {
  aks_name      = "${var.project_name}-aks-${var.environment}"
  aks_dns_prefix = "${replace(var.project_name, "-", "")}-${var.environment}"
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = local.aks_name
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  dns_prefix          = local.aks_dns_prefix

  kubernetes_version = var.aks_kubernetes_version

  identity {
    type = "SystemAssigned"
  }

  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  default_node_pool {
    name                = "system"
    vm_size             = var.aks_vm_size
    enable_auto_scaling = true
    min_count           = var.aks_node_min_count
    max_count           = var.aks_node_max_count
    node_count          = var.aks_node_min_count
    os_disk_size_gb     = 50
    type                = "VirtualMachineScaleSets"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  tags = var.tags
}

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.main.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.main.kube_config[0].host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  }
}

resource "azurerm_user_assigned_identity" "api_workload" {
  name                = "${var.project_name}-api-wi-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  tags                = var.tags
}

resource "azurerm_federated_identity_credential" "api_workload" {
  name                = "${var.project_name}-api-fic-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = azurerm_kubernetes_cluster.main.oidc_issuer_url
  parent_id           = azurerm_user_assigned_identity.api_workload.id
  subject             = "system:serviceaccount:medinventory:medinventory-api"
}

