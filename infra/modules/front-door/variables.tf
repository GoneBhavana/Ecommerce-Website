variable "name_prefix" { type = string }
variable "resource_group_name" { type = string }
variable "origin_hostname" { type = string }
variable "origin_host_header" { type = string }
variable "origin_verification_token" { type = string; sensitive = true }
variable "api_rate_limit_per_minute" { type = number }
variable "tags" { type = map(string) }
