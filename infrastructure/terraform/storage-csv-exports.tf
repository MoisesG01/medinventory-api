# Storage account dedicado a CSV exportados (separado do backend tfstate em medinventorystorage/tfstate)
resource "azurerm_storage_account" "csv_exports" {
  name                     = "${replace(var.project_name, "-", "")}csv${var.environment}"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = var.tags
}

resource "azurerm_storage_container" "csv_exports" {
  name                  = "equipamentos-csv"
  storage_account_name  = azurerm_storage_account.csv_exports.name
  container_access_type = "private"
}

# Permite à API (App Service MI) gravar blobs e emitir SAS de delegação de usuário para leitura
resource "azurerm_role_assignment" "app_csv_blob_data_contributor" {
  scope                = azurerm_storage_account.csv_exports.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id

  skip_service_principal_aad_check = true

  depends_on = [
    azurerm_linux_web_app.main,
    azurerm_storage_account.csv_exports,
  ]
}
