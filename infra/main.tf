data "azurerm_client_config" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    application = "northstar-market"
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.tags
}

resource "random_password" "postgres_admin" {
  length           = 40
  special          = true
  override_special = "_-!@#%"
}
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}
resource "random_password" "origin_token" {
  length  = 48
  special = false
}

module "network" {
  source              = "./modules/network"
  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  vnet_address_space  = var.vnet_address_space
  aks_subnet_cidr     = var.aks_subnet_cidr
  postgres_subnet_cidr = var.postgres_subnet_cidr
  tags                = local.tags
}

module "registry" {
  source              = "./modules/registry"
  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "observability" {
  source              = "./modules/observability"
  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "secrets" {
  source              = "./modules/key-vault"
  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  allowed_ip_ranges   = concat(var.api_server_authorized_ip_ranges, ["${module.network.nat_public_ip_address}/32"])
  tags                = local.tags
}

module "database" {
  source                      = "./modules/postgres"
  name_prefix                 = local.name_prefix
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  delegated_subnet_id         = module.network.postgres_subnet_id
  virtual_network_id          = module.network.virtual_network_id
  administrator_login         = var.postgres_admin_username
  administrator_password      = random_password.postgres_admin.result
  sku_name                    = var.postgres_sku_name
  storage_mb                  = var.postgres_storage_mb
  geo_redundant_backup_enabled = var.postgres_geo_redundant_backup_enabled
  tags                        = local.tags
}

module "aks" {
  source                       = "./modules/aks"
  name_prefix                  = local.name_prefix
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  kubernetes_version           = null
  tenant_id                    = data.azurerm_client_config.current.tenant_id
  admin_group_object_ids       = var.aks_admin_group_object_ids
  api_server_authorized_ip_ranges = var.api_server_authorized_ip_ranges
  subnet_id                    = module.network.aks_subnet_id
  system_vm_size               = var.aks_system_vm_size
  app_vm_size                  = var.aks_app_vm_size
  app_node_min_count           = var.aks_app_node_min_count
  app_node_max_count           = var.aks_app_node_max_count
  log_analytics_workspace_id   = module.observability.log_analytics_workspace_id
  tags                         = local.tags
}

module "edge" {
  source                      = "./modules/front-door"
  name_prefix                 = local.name_prefix
  resource_group_name         = azurerm_resource_group.main.name
  origin_hostname             = module.network.ingress_public_ip_address
  origin_host_header          = module.network.ingress_public_ip_address
  origin_verification_token   = random_password.origin_token.result
  api_rate_limit_per_minute   = var.api_rate_limit_per_minute
  tags                        = local.tags
}

resource "azurerm_user_assigned_identity" "app" {
  name                = "id-${local.name_prefix}-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_federated_identity_credential" "app" {
  name                = "fic-${local.name_prefix}-app"
  resource_group_name = azurerm_resource_group.main.name
  parent_id           = azurerm_user_assigned_identity.app.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = module.aks.oidc_issuer_url
  subject             = "system:serviceaccount:northstar:northstar-api"
}

resource "azurerm_role_assignment" "app_key_vault_reader" {
  scope                = module.secrets.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = module.registry.id
  role_definition_name = "AcrPull"
  principal_id         = module.aks.kubelet_identity_object_id
}
resource "azurerm_role_assignment" "aks_ingress_ip" {
  scope                = module.network.ingress_public_ip_id
  role_definition_name = "Network Contributor"
  principal_id         = module.aks.kubelet_identity_object_id
}
resource "azurerm_role_assignment" "terraform_aks_admin" {
  scope                = module.aks.id
  role_definition_name = "Azure Kubernetes Service RBAC Cluster Admin"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "northstar-database-url"
  value        = "postgresql://${var.postgres_admin_username}:${urlencode(random_password.postgres_admin.result)}@${module.database.fqdn}:6432/northstar?sslmode=require"
  key_vault_id = module.secrets.id
  depends_on   = [azurerm_role_assignment.app_key_vault_reader]
}
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "northstar-jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = module.secrets.id
  depends_on   = [azurerm_role_assignment.app_key_vault_reader]
}
resource "azurerm_key_vault_secret" "origin_token" {
  name         = "northstar-origin-token"
  value        = random_password.origin_token.result
  key_vault_id = module.secrets.id
  depends_on   = [azurerm_role_assignment.app_key_vault_reader]
}
resource "azurerm_key_vault_secret" "app_insights" {
  name         = "northstar-app-insights-connection-string"
  value        = module.observability.application_insights_connection_string
  key_vault_id = module.secrets.id
  depends_on   = [azurerm_role_assignment.app_key_vault_reader]
}

module "alerts" {
  source              = "./modules/alerts"
  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_insights_id = module.observability.application_insights_id
  alert_email         = var.alert_email
  p99_sla_ms          = var.p99_sla_ms
  tags                = local.tags
}
