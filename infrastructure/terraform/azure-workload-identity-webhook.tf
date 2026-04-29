/*
AKS já instalou o Azure Workload Identity webhook como um release gerenciado:
- release-name: aks-managed-workload-identity
- release-namespace: kube-system

Tentar instalar outro release via Terraform falha com:
  ClusterRole "...manager-role" exists and cannot be imported... invalid ownership metadata

Por isso, não gerenciamos a instalação do webhook aqui. A validação de presença pode ser feita via:
  kubectl -n kube-system get deploy azure-wi-webhook-controller-manager
*/

# Mantemos apenas o namespace (não destrutivo) caso ele já exista no cluster.
resource "kubernetes_namespace" "azure_workload_identity" {
  count = var.enable_k8s_resources ? 1 : 0

  metadata {
    name = "azure-workload-identity-system"
    labels = {
      "azure-workload-identity.io/system" = "true"
    }
  }
}

