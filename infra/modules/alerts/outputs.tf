output "action_group_id" { value = azurerm_monitor_action_group.on_call.id }
output "p99_alert_id" { value = azurerm_monitor_scheduled_query_rules_alert_v2.api_p99.id }
