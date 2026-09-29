resource "azurerm_kubernetes_cluster" "main" {
  name                          = "aks-${var.name_prefix}"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  dns_prefix                    = substr("dns-${var.name_prefix}", 0, 54)
  kubernetes_version            = var.kubernetes_version
  automatic_channel_upgrade     = "patch"
  node_os_channel_upgrade       = "NodeImage"
  sku_tier                      = "Standard"
  local_account_disabled        = true
  oidc_issuer_enabled           = true
  workload_identity_enabled      = true
  azure_policy_enabled          = true
  public_network_access_enabled = true
  tags                          = var.tags

  default_node_pool {
    name                         = "system"
    vm_size                      = var.system_vm_size
    auto_scaling_enabled         = true
    node_count                   = 3
    min_count                    = 3
    max_count                    = 6
    max_pods                     = 110
    os_sku                       = "AzureLinux"
    vnet_subnet_id               = var.subnet_id
    zones                        = ["1", "2", "3"]
    only_critical_addons_enabled = true
    temporary_name_for_rotation = "sysrotate"
    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity { type = "SystemAssigned" }

  azure_active_directory_role_based_access_control {
    azure_rbac_enabled     = true
    tenant_id              = var.tenant_id
    admin_group_object_ids = var.admin_group_object_ids
  }

  api_server_access_profile {
    authorized_ip_ranges = var.api_server_authorized_ip_ranges
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    network_data_plane  = "cilium"
    network_policy      = "cilium"
    outbound_type       = "userAssignedNATGateway"
    load_balancer_sku   = "standard"
    service_cidr        = "10.43.0.0/16"
    dns_service_ip      = "10.43.0.10"
    pod_cidr            = "10.244.0.0/16"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  lifecycle {
    ignore_changes = [default_node_pool[0].node_count]
  }
}

resource "azurerm_kubernetes_cluster_node_pool" "apps" {
  name                  = "apps"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.app_vm_size
  mode                  = "User"
  auto_scaling_enabled  = true
  min_count             = var.app_node_min_count
  max_count             = var.app_node_max_count
  max_pods              = 110
  os_sku                = "AzureLinux"
  vnet_subnet_id        = var.subnet_id
  zones                 = ["1", "2", "3"]
  node_labels           = { workload = "application" }

  upgrade_settings {
    max_surge = "33%"
  }

  lifecycle {
    ignore_changes = [node_count]
  }
}
