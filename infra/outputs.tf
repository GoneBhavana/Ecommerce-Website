output "resource_group_name" { value = azurerm_resource_group.main.name }
output "acr_login_server" { value = module.registry.login_server }
output "acr_name" { value = module.registry.name }
output "aks_cluster_name" { value = module.aks.name }
output "aks_node_resource_group" { value = module.aks.node_resource_group }
output "aks_oidc_issuer_url" { value = module.aks.oidc_issuer_url }
output "aks_public_fqdn" { value = module.aks.fqdn }
output "postgres_fqdn" { value = module.database.fqdn }
output "key_vault_name" { value = module.secrets.name }
output "application_insights_connection_string" {
  value     = module.observability.application_insights_connection_string
  sensitive = true
}
output "ingress_origin_ip" { value = module.network.ingress_public_ip_address }
output "front_door_url" { value = "https://${module.edge.endpoint_host_name}" }
output "workload_identity_client_id" { value = azurerm_user_assigned_identity.app.client_id }
output "app_min_replicas" { value = var.app_min_replicas }
output "app_max_replicas" { value = var.app_max_replicas }
