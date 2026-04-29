# Storage account dedicado a artefatos da aplicação (CSV exports, dumps, etc.)
# (separado do backend tfstate em medinventorystorage/tfstate)
resource "azurerm_storage_account" "artifacts" {
  name                     = "${replace(var.project_name, "-", "")}csv${var.environment}"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # Keep explicit to avoid provider trying to clear it (which Azure rejects with 400).
  allowed_copy_scope = "PrivateLink"

  allow_nested_items_to_be_public = false

  tags = var.tags
}

resource "azurerm_storage_container" "csv_exports" {
  name                  = "equipamentos-csv"
  storage_account_name  = azurerm_storage_account.artifacts.name
  container_access_type = "private"
}

# Permite à API (AKS Workload Identity) gravar blobs e emitir SAS de delegação de usuário para leitura
resource "azurerm_role_assignment" "app_csv_blob_data_contributor" {
  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.api_workload.principal_id

  skip_service_principal_aad_check = true

  depends_on = [
    azurerm_user_assigned_identity.api_workload,
    azurerm_storage_account.artifacts,
  ]
}

# Necessário para emitir **user delegation key** (usada na geração de SAS)
# quando a API autentica via Workload Identity / Managed Identity.
resource "azurerm_role_assignment" "app_csv_blob_delegator" {
  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Blob Delegator"
  principal_id         = azurerm_user_assigned_identity.api_workload.principal_id

  skip_service_principal_aad_check = true

  depends_on = [
    azurerm_user_assigned_identity.api_workload,
    azurerm_storage_account.artifacts,
  ]
}
