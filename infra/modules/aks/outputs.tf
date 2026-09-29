output "id" { value = azurerm_kubernetes_cluster.main.id }
output "name" { value = azurerm_kubernetes_cluster.main.name }
output "node_resource_group" { value = azurerm_kubernetes_cluster.main.node_resource_group }
output "fqdn" { value = azurerm_kubernetes_cluster.main.fqdn }
output "oidc_issuer_url" { value = azurerm_kubernetes_cluster.main.oidc_issuer_url }
output "kubelet_identity_object_id" { value = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id }
