locals {
  azure_monitor_workspace_name = "${var.project_name}-amw-${var.environment}"
  # Azure naming can be picky; keep under 64 chars and deterministic.
  prometheus_dce_name  = substr("MSProm-${data.azurerm_resource_group.main.location}-${azurerm_kubernetes_cluster.main.name}", 0, 63)
  prometheus_dcr_name  = substr("MSProm-${data.azurerm_resource_group.main.location}-${azurerm_kubernetes_cluster.main.name}", 0, 63)
  prometheus_dcra_name = substr("MSProm-${data.azurerm_resource_group.main.location}-${azurerm_kubernetes_cluster.main.name}", 0, 63)
}

# Azure Monitor Workspace (Managed Prometheus storage/account)
resource "azurerm_monitor_workspace" "prometheus" {
  count               = var.enable_managed_prometheus ? 1 : 0
  name                = local.azure_monitor_workspace_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location

  tags = var.tags
}

resource "azurerm_monitor_data_collection_endpoint" "prometheus" {
  count               = var.enable_managed_prometheus ? 1 : 0
  name                = local.prometheus_dce_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location

  kind = "Linux"
  tags = var.tags
}

resource "azurerm_monitor_data_collection_rule" "prometheus" {
  count                       = var.enable_managed_prometheus ? 1 : 0
  name                        = local.prometheus_dcr_name
  resource_group_name         = data.azurerm_resource_group.main.name
  location                    = data.azurerm_resource_group.main.location
  data_collection_endpoint_id = azurerm_monitor_data_collection_endpoint.prometheus[0].id
  kind                        = "Linux"

  description = "DCR for AKS Azure Managed Prometheus (Microsoft-PrometheusMetrics stream)."
  tags        = var.tags

  destinations {
    monitor_account {
      monitor_account_id = azurerm_monitor_workspace.prometheus[0].id
      name               = "MonitoringAccount1"
    }
  }

  data_flow {
    streams      = ["Microsoft-PrometheusMetrics"]
    destinations = ["MonitoringAccount1"]
  }

  data_sources {
    prometheus_forwarder {
      name    = "PrometheusDataSource"
      streams = ["Microsoft-PrometheusMetrics"]
    }
  }
}

resource "azurerm_monitor_data_collection_rule_association" "prometheus" {
  count                   = var.enable_managed_prometheus ? 1 : 0
  name                    = local.prometheus_dcra_name
  target_resource_id      = azurerm_kubernetes_cluster.main.id
  data_collection_rule_id = azurerm_monitor_data_collection_rule.prometheus[0].id

  description = "Associate AKS with Managed Prometheus DCR."
}

