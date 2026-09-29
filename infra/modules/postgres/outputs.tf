output "id" { value = azurerm_postgresql_flexible_server.main.id }
output "name" { value = azurerm_postgresql_flexible_server.main.name }
output "fqdn" { value = azurerm_postgresql_flexible_server.main.fqdn }
output "database_name" { value = azurerm_postgresql_flexible_server_database.main.name }
output "private_dns_zone_id" { value = azurerm_private_dns_zone.postgres.id }
