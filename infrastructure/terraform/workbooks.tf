resource "random_uuid" "metrics_workbook" {}

data "azurerm_resources" "aks_node_vmss" {
  count               = var.enable_managed_prometheus ? 1 : 0
  resource_group_name = azurerm_kubernetes_cluster.main.node_resource_group
  type                = "Microsoft.Compute/virtualMachineScaleSets"
}

resource "azurerm_application_insights_workbook" "metrics" {
  count = var.enable_managed_prometheus ? 1 : 0

  name                = random_uuid.metrics_workbook.result
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  display_name        = "${var.project_name}-${var.environment} - Metrics"

  data_json = jsonencode({
    version = "Notebook/1.0"
    items = [
      {
        type = 1
        name = "text - 0"
        content = {
          json = join("\n", [
            "# ${var.project_name}-${var.environment} metrics",
            "",
            "Este workbook foi criado para substituir o Azure Managed Grafana, usando Azure Monitor.",
            "",
            "- **Fonte**: Azure Monitor Metrics (AKS e Node VMSS)",
            "- **Ajustes**: se algum metricName não existir na sua assinatura/região, troque pelo nome exibido no Metrics Explorer do recurso.",
          ])
        }
      },
      {
        type = 9
        name = "parameters - tabs"
        content = {
          version = "KqlParameterItem/1.0"
          parameters = [
            {
              id         = "b9f7c7cc-4bba-4b41-9fbd-8f3a2bcf2e07"
              version    = "KqlParameterItem/1.0"
              name       = "selectedTab"
              label      = "Tab"
              type       = 2
              isRequired = true
              typeSettings = {
                selectableValues = [
                  { value = "Infra", label = "Infra", selected = true },
                  { value = "HTTP Users", label = "HTTP Users" },
                  { value = "HTTP Equipamentos", label = "HTTP Equipamentos" },
                ]
              }
            }
          ]
          style     = "above"
          queryType = 0
        }
        styleSettings = {
          margin = "10px 0 10px 0"
        }
      },
      {
        type = 11
        name = "nav - tabs"
        content = {
          version = "LinkItem/1.0"
          style   = "tabs"
          links = [
            {
              cellValue  = "selectedTab"
              linkTarget = "parameter"
              linkLabel  = "Infra"
              subTarget  = "Infra"
            },
            {
              cellValue  = "selectedTab"
              linkTarget = "parameter"
              linkLabel  = "HTTP Users"
              subTarget  = "HTTP Users"
            },
            {
              cellValue  = "selectedTab"
              linkTarget = "parameter"
              linkLabel  = "HTTP Equipamentos"
              subTarget  = "HTTP Equipamentos"
            },
          ]
        }
        styleSettings = {
          margin = "0 0 15px 0"
        }
      },
      {
        type = 1
        name = "text - http"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isNotEqualTo"
          value         = "Infra"
        }
        content = {
          json = join("\n", [
            "## HTTP (Prometheus / Managed Prometheus)",
            "",
            "Os itens abaixo são a tradução direta dos painéis do Grafana em `docker/grafana/provisioning/dashboards/medinventory-api.json`.",
            "",
            "- **Data source**: Prometheus (preview) no Azure Workbook",
            "- **Resource**: Azure Monitor Workspace (`azurerm_monitor_workspace.prometheus`)",
          ])
        }
      },
      {
        type = 1
        name = "text - http summary"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isNotEqualTo"
          value         = "Infra"
        }
        content = {
          json = join("\n", [
            "### Resumo (15m)",
            "",
            "Visões agregadas para ficar com cara de dashboard. Abaixo ficam os painéis detalhados por rota (como no Grafana).",
          ])
        }
      },
      {
        type = 3
        name = "promql - users all routes 15m"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=~\"/users.*\"}[15m])) by (route, method, status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos all routes 15m"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=~\"/equipamentos.*\"}[15m])) by (route, method, status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 1
        name = "text - http users details"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          json = "### Users (detalhado por rota)"
        }
      },
      {
        type = 3
        name = "promql - users post 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users\", method=\"POST\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users post 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users\", method=\"POST\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users me get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/me\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users me get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/me\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users protected get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/protected\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users protected get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/protected\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users id get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users id get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users id put 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"PUT\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users id put 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"PUT\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - users id delete 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"DELETE\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - users id delete 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Users"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/users/:id\", method=\"DELETE\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 1
        name = "text - http equipamentos details"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          json = "### Equipamentos (detalhado por rota)"
        }
      },
      {
        type = 3
        name = "promql - equipamentos post 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos\", method=\"POST\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos post 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos\", method=\"POST\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos export csv get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/export/csv\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos export csv get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/export/csv\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id get 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"GET\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id get 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"GET\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id status patch 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id/status\", method=\"PATCH\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id status patch 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id/status\", method=\"PATCH\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id put 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"PUT\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id put 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"PUT\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id delete 15m by status"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 1
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"DELETE\"}[15m])) by (status_code)"
          timeContext = {
            durationMs = 900000
          }
        }
      },
      {
        type = 3
        name = "promql - equipamentos id delete 12h total"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "HTTP Equipamentos"
        }
        content = {
          version         = "PrometheusQueryItem/1.0"
          resourceUri     = azurerm_monitor_workspace.prometheus[0].id
          queryType       = 0
          prometheusQuery = "sum(increase(http_requests_total{route=\"/equipamentos/:id\", method=\"DELETE\"}[12h]))"
          timeContext = {
            durationMs = 43200000
          }
        }
      },
      {
        type = 9
        name = "metrics - vmss cpu percentage"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.compute/virtualmachinescalesets"
          resourceIds = [
            data.azurerm_resources.aks_node_vmss[0].resources[0].id
          ]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.Compute/virtualMachineScaleSets"
              name        = "Percentage CPU"
              aggregation = "Average"
            }
          ]
        }
      },
      {
        type = 9
        name = "metrics - vmss network in/out"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.compute/virtualmachinescalesets"
          resourceIds = [
            data.azurerm_resources.aks_node_vmss[0].resources[0].id
          ]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.Compute/virtualMachineScaleSets"
              name        = "Network In Total"
              aggregation = "Total"
            },
            {
              namespace   = "Microsoft.Compute/virtualMachineScaleSets"
              name        = "Network Out Total"
              aggregation = "Total"
            }
          ]
        }
      },
      {
        type = 9
        name = "metrics - vmss disk read/write bytes"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.compute/virtualmachinescalesets"
          resourceIds = [
            data.azurerm_resources.aks_node_vmss[0].resources[0].id
          ]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.Compute/virtualMachineScaleSets"
              name        = "Disk Read Bytes"
              aggregation = "Total"
            },
            {
              namespace   = "Microsoft.Compute/virtualMachineScaleSets"
              name        = "Disk Write Bytes"
              aggregation = "Total"
            }
          ]
        }
      },
      {
        type = 9
        name = "metrics - cpu"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.containerservice/managedclusters"
          resourceIds  = [azurerm_kubernetes_cluster.main.id]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.ContainerService/managedClusters"
              name        = "node_cpu_usage_percentage"
              aggregation = "Average"
            }
          ]
        }
      },
      {
        type = 9
        name = "metrics - memory"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.containerservice/managedclusters"
          resourceIds  = [azurerm_kubernetes_cluster.main.id]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.ContainerService/managedClusters"
              name        = "node_memory_working_set_percentage"
              aggregation = "Average"
            }
          ]
        }
      },
      {
        type = 9
        name = "metrics - pod count"
        conditionalVisibility = {
          parameterName = "selectedTab"
          comparison    = "isEqualTo"
          value         = "Infra"
        }
        content = {
          version      = "MetricsItem/1.0"
          size         = 0
          chartType    = 2
          resourceType = "microsoft.containerservice/managedclusters"
          resourceIds  = [azurerm_kubernetes_cluster.main.id]
          timeContext = {
            durationMs = 900000
          }
          metrics = [
            {
              namespace   = "Microsoft.ContainerService/managedClusters"
              name        = "pod_count"
              aggregation = "Average"
            }
          ]
        }
      }
    ]
    isLocked            = false
    fallbackResourceIds = ["Azure Monitor"]
  })

  tags = var.tags
}

