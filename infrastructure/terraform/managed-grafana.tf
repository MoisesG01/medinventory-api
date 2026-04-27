locals {
  # Azure Managed Grafana name constraints: 2-23 chars, [a-zA-Z0-9-], start with letter, end with letter/digit.
  # Keep it deterministic and safe even if a longer name is provided.
  managed_grafana_name_safe = substr(replace(var.managed_grafana_name, "_", "-"), 0, 23)
}

#
# Provision datasource + dashboard using Azure CLI (amg extension).
# This avoids requiring Grafana API keys/secrets in Terraform.
#
resource "null_resource" "grafana_provisioning" {
  count = (var.enable_managed_prometheus && var.enable_managed_grafana) ? 1 : 0

  triggers = {
    grafana_name   = local.managed_grafana_name_safe
    grafana_region = var.managed_grafana_location
    grafana_rg     = data.azurerm_resource_group.main.name
    amw_id         = azurerm_monitor_workspace.prometheus[0].id
    dashboard_hash = filemd5("${path.module}/../../docker/grafana/provisioning/dashboards/medinventory-api.json")
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-lc"]
    command     = <<-EOT
      set -euo pipefail
      export MSYS_NO_PATHCONV=1

      GRAFANA_RG="${data.azurerm_resource_group.main.name}"
      GRAFANA_NAME="${local.managed_grafana_name_safe}"
      GRAFANA_LOCATION="${var.managed_grafana_location}"

      AMW_ID="${azurerm_monitor_workspace.prometheus[0].id}"
      export PROM_URL="$(az resource show --ids "$AMW_ID" --query 'properties.metrics.prometheusQueryEndpoint' -o tsv)"

      # Create (idempotent) Azure Managed Grafana workspace.
      # We use CLI because current azurerm provider constraints don't match Azure's allowed versions in this subscription.
      az grafana create \
        --resource-group "$GRAFANA_RG" \
        --workspace-name "$GRAFANA_NAME" \
        --location "$GRAFANA_LOCATION" \
        --sku-tier Standard \
        --public-network-access Enabled \
        --grafana-major-version 11 \
        --api-key Disabled \
        --principal-ids "${data.azurerm_client_config.current.object_id}"

      # Wait for the workspace provisioning to complete before calling data-plane APIs.
      az grafana wait \
        --resource-group "$GRAFANA_RG" \
        --workspace-name "$GRAFANA_NAME" \
        --created

      # Link Azure Monitor Workspace to the Grafana workspace (Preview, safe if already linked).
      az grafana integrations monitor add \
        --resource-group "$GRAFANA_RG" \
        --name "$GRAFANA_NAME" \
        --monitor-rg-name "${data.azurerm_resource_group.main.name}" \
        --monitor-name "${azurerm_monitor_workspace.prometheus[0].name}" || true

      # The integration call can trigger an update; wait again before using data-plane APIs.
      az grafana wait \
        --resource-group "$GRAFANA_RG" \
        --workspace-name "$GRAFANA_NAME" \
        --updated

      # Create/Update Prometheus datasource (Azure Auth via Managed Identity is handled by AMG)
      # Note: name must match your dashboard variable current value ("Prometheus") unless you update the JSON.
      DS_DEF="$(python - <<PY
import json
import os
print(json.dumps({
  "name": "Prometheus",
  "type": "prometheus",
  "access": "proxy",
  "url": os.environ["PROM_URL"],
  "basicAuth": False,
  "isDefault": True,
  "jsonData": {
    "httpMethod": "POST",
    "azureCredentials": { "authType": "msi" }
  }
}))
PY
)"

      if ! az grafana data-source create \
        --name "$GRAFANA_NAME" \
        --resource-group "$GRAFANA_RG" \
        --definition "$DS_DEF"; then
        az grafana data-source update \
          --name "$GRAFANA_NAME" \
          --resource-group "$GRAFANA_RG" \
          --data-source "Prometheus" \
          --definition "$DS_DEF"
      fi

      # Import/Upsert dashboard
      az grafana dashboard import \
        --resource-group "$GRAFANA_RG" \
        --name "$GRAFANA_NAME" \
        --definition "${path.module}/../../docker/grafana/provisioning/dashboards/medinventory-api.json" \
        --overwrite true
    EOT
  }

  depends_on = [
    azurerm_monitor_workspace.prometheus,
  ]
}

