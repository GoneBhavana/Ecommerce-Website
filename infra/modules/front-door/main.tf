resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "fd-${var.name_prefix}"
  resource_group_name = var.resource_group_name
  sku_name            = "Premium_AzureFrontDoor"
  response_timeout_seconds = 60
  tags                = var.tags
}

resource "azurerm_cdn_frontdoor_endpoint" "main" {
  name                     = "${replace(var.name_prefix, "-", "")}fd"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = true
  tags                     = var.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "main" {
  name                     = "og-${var.name_prefix}-aks"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  session_affinity_enabled = false

  load_balancing {
    additional_latency_in_milliseconds = 50
    sample_size                        = 4
    successful_samples_required        = 3
  }

  health_probe {
    interval_in_seconds = 30
    path                = "/api/health"
    protocol            = "Http"
    request_type        = "GET"
  }
}

resource "azurerm_cdn_frontdoor_origin" "aks" {
  name                          = "aks-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main.id
  enabled                       = true
  certificate_name_check_enabled = false
  host_name                     = var.origin_hostname
  origin_host_header            = var.origin_host_header
  http_port                     = 80
  https_port                    = 443
  priority                      = 1
  weight                        = 1000

  custom_header {
    name  = "X-Northstar-Origin"
    value = var.origin_verification_token
  }
}

resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "api"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.aks.id]
  enabled                       = true
  forwarding_protocol           = "HttpOnly"
  https_redirect_enabled        = true
  link_to_default_domain        = true
  patterns_to_match             = ["/api/*"]
  supported_protocols           = ["Http", "Https"]
}

resource "azurerm_cdn_frontdoor_route" "web" {
  name                          = "web"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.aks.id]
  enabled                       = true
  forwarding_protocol           = "HttpOnly"
  https_redirect_enabled        = true
  link_to_default_domain        = true
  patterns_to_match             = ["/*"]
  supported_protocols           = ["Http", "Https"]

  cache {
    query_string_caching_behavior = "IgnoreQueryString"
    compression_enabled           = true
    content_types_to_compress = [
      "text/html", "text/css", "application/javascript", "application/json",
      "image/svg+xml", "font/woff2"
    ]
  }
}

resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  name                = upper(substr(replace("waf${var.name_prefix}", "-", ""), 0, 128))
  resource_group_name = var.resource_group_name
  sku_name            = "Premium_AzureFrontDoor"
  enabled             = true
  mode                = "Prevention"
  custom_block_response_status_code = 403
  custom_block_response_body        = base64encode("Request blocked by Northstar edge policy.")
  tags                = var.tags

  custom_rule {
    name                           = "ApiRateLimit"
    enabled                        = true
    priority                       = 1
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.api_rate_limit_per_minute
    type                           = "RateLimitRule"
    action                         = "Block"
    match_condition {
      match_variable = "RequestUri"
      operator       = "BeginsWith"
      match_values   = ["/api/"]
      transforms     = ["Lowercase"]
    }
  }

  managed_rule {
    type    = "DefaultRuleSet"
    version = "2.1"
    action  = "Block"
  }
}

resource "azurerm_cdn_frontdoor_security_policy" "main" {
  name                     = "sp-${var.name_prefix}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.main.id
      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.main.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}
