resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = var.monitoring_namespace
  }
}

resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = var.kube_prometheus_stack_chart_version

  create_namespace = false

  # Keep services internal by default; expose later via Ingress/LoadBalancer.
  values = [
    yamlencode({
      grafana = {
        service = { type = "ClusterIP" }
      }
      prometheus = {
        service = { type = "ClusterIP" }
      }
      alertmanager = {
        service = { type = "ClusterIP" }
      }
    })
  ]

  depends_on = [
    azurerm_kubernetes_cluster.main
  ]
}

