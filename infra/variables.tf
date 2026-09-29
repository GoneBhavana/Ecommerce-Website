variable "subscription_id" {
  description = "Azure subscription ID for this deployment."
  type        = string
}

variable "project_name" {
  description = "Short lowercase prefix used in Azure resource names."
  type        = string
  default     = "northstar"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,10}$", var.project_name))
    error_message = "project_name must be 3-11 lowercase letters, numbers, or hyphens and start with a letter."
  }
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "test", "stage", "prod"], var.environment)
    error_message = "environment must be dev, test, stage, or prod."
  }
}

variable "location" {
  description = "Azure region. Select one supporting the chosen VM and zone-redundant PostgreSQL SKU."
  type        = string
  default     = "eastus"
}

variable "alert_email" {
  description = "Email receiving p99 latency and API error-rate alerts."
  type        = string
  validation {
    condition     = can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", var.alert_email))
    error_message = "alert_email must be a valid email address."
  }
}

variable "api_server_authorized_ip_ranges" {
  description = "CIDR allowlist for the AKS Kubernetes API endpoint; supply trusted operator/CI egress IPs."
  type        = list(string)
  validation {
    condition     = length(var.api_server_authorized_ip_ranges) > 0
    error_message = "Set at least one trusted CIDR; do not expose the AKS API to all addresses."
  }
}

variable "vnet_address_space" {
  type        = list(string)
  default     = ["10.42.0.0/16"]
  description = "VNet address space."
}
variable "aks_subnet_cidr" {
  type        = string
  default     = "10.42.0.0/20"
  description = "AKS node subnet; Azure CNI Overlay keeps pod addressing separate."
}
variable "postgres_subnet_cidr" {
  type        = string
  default     = "10.42.16.0/24"
  description = "Delegated private subnet for Azure Database for PostgreSQL Flexible Server."
}

variable "aks_system_vm_size" {
  type        = string
  default     = "Standard_D4ds_v5"
  description = "System node pool VM size."
}
variable "aks_app_vm_size" {
  type        = string
  default     = "Standard_D4ds_v5"
  description = "Autoscaled user node pool VM size."
}
variable "aks_app_node_min_count" {
  type        = number
  default     = 3
  validation {
    condition     = var.aks_app_node_min_count >= 3
    error_message = "Keep at least three workload nodes for zone spread and disruption tolerance."
  }
}
variable "aks_app_node_max_count" {
  type        = number
  default     = 50
  validation {
    condition     = var.aks_app_node_max_count >= var.aks_app_node_min_count && var.aks_app_node_max_count <= 100
    error_message = "Workload node maximum must be >= minimum and <= 100. Validate Azure regional quota before apply."
  }
}
variable "aks_admin_group_object_ids" {
  type        = list(string)
  default     = []
  description = "Optional Entra ID group object IDs granted Azure Kubernetes Service RBAC cluster-admin."
}
variable "postgres_sku_name" {
  type        = string
  default     = "GP_Standard_D8ds_v5"
  description = "PostgreSQL primary SKU; size from representative load tests and DB telemetry."
}
variable "postgres_storage_mb" {
  type        = number
  default     = 262144
  description = "PostgreSQL storage in MiB (default 256 GiB)."
}
variable "postgres_geo_redundant_backup_enabled" {
  type        = bool
  default     = true
}
variable "postgres_admin_username" {
  type        = string
  default     = "northstaradmin"
  description = "PostgreSQL administrator login; the password is generated and stored in Key Vault."
}
variable "app_min_replicas" {
  type        = number
  default     = 12
  description = "Minimum API/frontend replicas in the AKS HPA manifest."
}
variable "app_max_replicas" {
  type        = number
  default     = 100
  description = "Maximum API/frontend replicas in the AKS HPA manifest. Verify pod capacity and database connection budget."
}
variable "app_cpu_target_percent" {
  type        = number
  default     = 60
  description = "HPA average CPU utilization target."
}
variable "p99_sla_ms" {
  type        = number
  default     = 750
  description = "Measured API p99 latency alert threshold in milliseconds; this is an alert target, not a guaranteed SLA."
}
variable "api_rate_limit_per_minute" {
  type        = number
  default     = 1200
  description = "Per-client-IP Front Door WAF API request threshold per minute. Tune for NAT-heavy customer populations."
}
