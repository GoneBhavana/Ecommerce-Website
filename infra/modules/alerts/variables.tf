variable "name_prefix" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "application_insights_id" { type = string }
variable "alert_email" { type = string }
variable "p99_sla_ms" { type = number }
variable "tags" { type = map(string) }
