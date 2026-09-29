output "virtual_network_id" { value = azurerm_virtual_network.main.id }
output "aks_subnet_id" { value = azurerm_subnet.aks.id }
output "postgres_subnet_id" { value = azurerm_subnet.postgres.id }
output "nat_public_ip_address" { value = azurerm_public_ip.nat.ip_address }
output "ingress_public_ip_id" { value = azurerm_public_ip.ingress.id }
output "ingress_public_ip_name" { value = azurerm_public_ip.ingress.name }
output "ingress_public_ip_address" { value = azurerm_public_ip.ingress.ip_address }
