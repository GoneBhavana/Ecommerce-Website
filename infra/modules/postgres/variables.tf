variable "name_prefix" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "delegated_subnet_id" { type = string }
variable "virtual_network_id" { type = string }
variable "administrator_login" { type = string }
variable "administrator_password" { type = string; sensitive = true }
variable "sku_name" { type = string }
variable "storage_mb" { type = number }
variable "geo_redundant_backup_enabled" { type = bool }
variable "tags" { type = map(string) }
