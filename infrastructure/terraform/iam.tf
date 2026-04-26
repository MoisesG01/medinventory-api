# Role assignment for AKS kubelet identity to pull images from ACR
resource "azurerm_role_assignment" "acrpull_role" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  depends_on = [
    azurerm_kubernetes_cluster.main,
    azurerm_container_registry.main
  ]
}

# Role assignment for GitHub Actions Service Principal to push images to ACR
resource "azurerm_role_assignment" "github_actions_acrpush" {
  count                = var.sp_object_id != "" ? 1 : 0
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id         = var.sp_object_id
  depends_on = [
    azurerm_container_registry.main
  ]
}
