resource "azurerm_container_registry" "main" {
  name                          = replace("acr${var.name_prefix}", "-", "")
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = "Premium"
  admin_enabled                 = false
  public_network_access_enabled = true
  zone_redundancy_enabled      = true
  tags                          = var.tags
}
