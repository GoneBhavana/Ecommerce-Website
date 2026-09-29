variable "name_prefix" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "kubernetes_version" { type = string; default = null; nullable = true }
variable "tenant_id" { type = string }
variable "admin_group_object_ids" { type = list(string) }
variable "api_server_authorized_ip_ranges" { type = list(string) }
variable "subnet_id" { type = string }
variable "system_vm_size" { type = string }
variable "app_vm_size" { type = string }
variable "app_node_min_count" { type = number }
variable "app_node_max_count" { type = number }
variable "log_analytics_workspace_id" { type = string }
variable "tags" { type = map(string) }
