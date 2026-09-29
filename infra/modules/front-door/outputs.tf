output "endpoint_host_name" { value = azurerm_cdn_frontdoor_endpoint.main.host_name }
output "endpoint_id" { value = azurerm_cdn_frontdoor_endpoint.main.id }
output "profile_id" { value = azurerm_cdn_frontdoor_profile.main.id }
output "web_route_id" { value = azurerm_cdn_frontdoor_route.web.id }
