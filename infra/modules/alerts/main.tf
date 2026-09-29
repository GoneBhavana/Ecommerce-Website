resource "azurerm_monitor_action_group" "on_call" {
  name                = "ag-${var.name_prefix}-oncall"
  resource_group_name = var.resource_group_name
  short_name          = "northstar"
  tags                = var.tags

  email_receiver {
    name                    = "primary-on-call"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "api_p99" {
  name                = "alert-${var.name_prefix}-api-p99"
  resource_group_name = var.resource_group_name
  location            = var.location
  description         = "API request p99 is above the configured latency objective."
  display_name        = "Northstar API p99 latency"
  enabled             = true
  evaluation_frequency = "PT1M"
  window_duration      = "PT5M"
  scopes               = [var.application_insights_id]
  severity             = 2
  auto_mitigation_enabled = true
  tags                 = var.tags

  criteria {
    query = <<-KQL
      requests
      | summarize p99_ms = percentile(duration, 99)
      | where p99_ms > ${var.p99_sla_ms}
    KQL
    time_aggregation_method = "Maximum"
    metric_measure_column   = "p99_ms"
    operator                = "GreaterThan"
    threshold               = 0
    failing_periods {
      minimum_failing_periods_to_trigger_alert = 2
      number_of_evaluation_periods             = 3
    }
  }

  action { action_groups = [azurerm_monitor_action_group.on_call.id] }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "api_errors" {
  name                = "alert-${var.name_prefix}-api-errors"
  resource_group_name = var.resource_group_name
  location            = var.location
  description         = "More than two percent of API requests failed in the alert window."
  display_name        = "Northstar API error rate"
  enabled             = true
  evaluation_frequency = "PT1M"
  window_duration      = "PT5M"
  scopes               = [var.application_insights_id]
  severity             = 1
  auto_mitigation_enabled = true
  tags                 = var.tags

  criteria {
    query = <<-KQL
      requests
      | summarize total = count(), failed = countif(success == false)
      | extend error_percent = 100.0 * todouble(failed) / iif(total == 0, 1.0, todouble(total))
      | where error_percent > 2
    KQL
    time_aggregation_method = "Maximum"
    metric_measure_column   = "error_percent"
    operator                = "GreaterThan"
    threshold               = 0
    failing_periods {
      minimum_failing_periods_to_trigger_alert = 2
      number_of_evaluation_periods             = 3
    }
  }

  action { action_groups = [azurerm_monitor_action_group.on_call.id] }
}
