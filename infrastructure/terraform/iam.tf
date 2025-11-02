# Role assignment for the Web App to pull images from ACR
resource "azurerm_role_assignment" "acrpull_role" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = try(azurerm_linux_web_app.main.identity[0].principal_id, null)
  depends_on = [
    azurerm_linux_web_app.main
  ]
}
