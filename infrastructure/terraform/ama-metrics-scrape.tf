resource "kubernetes_config_map" "ama_metrics_settings" {
  count = (var.enable_k8s_resources && var.enable_managed_prometheus) ? 1 : 0

  metadata {
    name      = "ama-metrics-settings-configmap"
    namespace = "kube-system"
  }

  data = {
    # Enable pod annotation based scraping for the medinventory namespace
    "pod-annotation-based-scraping" = <<-EOT
      podannotationnamespaceregex = "medinventory"
    EOT

    # Disable minimal ingestion profile (avoid dropping non-default app metrics)
    "default-targets-metrics-keep-list" = <<-EOT
      minimalingestionprofile = false
    EOT
  }

  depends_on = [azurerm_kubernetes_cluster.main]
}

resource "kubernetes_config_map" "ama_metrics_prometheus_config" {
  count = (var.enable_k8s_resources && var.enable_managed_prometheus) ? 1 : 0

  metadata {
    name      = "ama-metrics-prometheus-config"
    namespace = "kube-system"
  }

  data = {
    "prometheus-config" = <<-EOT
      scrape_configs:
        - job_name: "medinventory-api"
          metrics_path: /metrics
          scheme: http
          static_configs:
            - targets: ["medinventory-api.medinventory.svc.cluster.local:80"]
          metric_relabel_configs:
            - source_labels: [__name__]
              action: keep
              regex: "http_requests_total|process_.*|nodejs_.*|nestjs_.*|up"
    EOT
  }

  depends_on = [azurerm_kubernetes_cluster.main]
}

