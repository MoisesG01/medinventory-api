resource "kubernetes_namespace" "medinventory" {
  metadata {
    name = "medinventory"
  }
}

resource "kubernetes_service_account" "api" {
  metadata {
    name      = "medinventory-api"
    namespace = kubernetes_namespace.medinventory.metadata[0].name
    annotations = {
      "azure.workload.identity/client-id" = azurerm_user_assigned_identity.api_workload.client_id
    }
  }
}

resource "kubernetes_deployment" "api" {
  metadata {
    name      = "medinventory-api"
    namespace = kubernetes_namespace.medinventory.metadata[0].name
    labels = {
      app = "medinventory-api"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "medinventory-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "medinventory-api"
        }
        annotations = {
          "azure.workload.identity/use" = "true"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.api.metadata[0].name

        container {
          name  = "api"
          image = "${azurerm_container_registry.main.login_server}/${var.project_name}-api:latest"

          port {
            container_port = 8080
          }

          env {
            name = "DATABASE_URL"
            value = format("mysql://%s:%s@%s:3306/%s?sslaccept=strict",
              var.mysql_admin_username,
              urlencode(random_password.mysql_password.result),
              azurerm_mysql_flexible_server.main.fqdn,
              azurerm_mysql_flexible_database.main.name
            )
          }

          env {
            name  = "JWT_SECRET"
            value = random_password.jwt_secret.result
          }
          env {
            name  = "JWT_EXPIRES_IN"
            value = "24h"
          }
          env {
            name  = "NODE_ENV"
            value = var.environment
          }
          env {
            name  = "PORT"
            value = "8080"
          }

          env {
            name  = "AZURE_STORAGE_ACCOUNT_NAME"
            value = azurerm_storage_account.artifacts.name
          }
          env {
            name  = "AZURE_STORAGE_CSV_CONTAINER"
            value = azurerm_storage_container.csv_exports.name
          }
          env {
            name  = "AZURE_STORAGE_SAS_TTL_MINUTES"
            value = "60"
          }

          env {
            name  = "REDIS_HOST"
            value = azurerm_redis_cache.main.hostname
          }
          env {
            name  = "REDIS_PORT"
            value = tostring(azurerm_redis_cache.main.ssl_port)
          }
          env {
            name  = "REDIS_TLS"
            value = "true"
          }
          env {
            name  = "REDIS_URL"
            value = format("rediss://:%s@%s:%s/0", urlencode(azurerm_redis_cache.main.primary_access_key), azurerm_redis_cache.main.hostname, azurerm_redis_cache.main.ssl_port)
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "api_lb" {
  metadata {
    name      = "medinventory-api"
    namespace = kubernetes_namespace.medinventory.metadata[0].name
  }

  spec {
    selector = {
      app = "medinventory-api"
    }

    port {
      port        = 80
      target_port = 8080
    }

    type = "LoadBalancer"
  }
}

