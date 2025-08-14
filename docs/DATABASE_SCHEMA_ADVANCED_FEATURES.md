# Database Schema Documentation - Supplier Billing Advanced Features

## Overview

This document describes the extended database schema for the Supplier Billing Advanced Features system. The schema includes tables for accounting integration, advanced reporting, POS integration, and automated notifications.

## Migration Files

- `20241214000001_supplier_billing_advanced_features.sql` - Main migration with all tables and basic functions
- `20241214000002_advanced_constraints_and_optimizations.sql` - Additional constraints, indexes, and performance optimizations
- `20241214000003_rollback_advanced_features.sql` - Rollback script to remove all advanced features

## Table Structure

### 1. Accounting Integration Tables

#### journal_entries (Extended)
Enhanced version of the existing journal entries table with additional fields for advanced accounting integration.

**New Columns:**
- `transaction_date` - Date of the actual transaction
- `source_type` - Type of source document ('supplier_invoice', 'supplier_payment', etc.)
- `source_id` - UUID reference to the source document
- `posted_at` - Timestamp when the entry was posted

#### journal_entry_lines (Extended)
Enhanced version of the existing journal entry lines table.

**New Columns:**
- `account_code` - Account code for easier reference
- `account_name` - Account name for display purposes
- `reference` - Additional reference information

### 2. Reporting and Analytics Tables

#### report_definitions
Stores dynamic report definitions that can be executed with parameters.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Report name |
| type | report_type | Type of report (enum) |
| description | TEXT | Report description |
| sql_query | TEXT | SQL query template |
| parameters | JSONB | Parameter definitions |
| is_active | BOOLEAN | Whether report is active |
| created_by | UUID | User who created the report |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### scheduled_reports
Manages automated report generation and delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| report_definition_id | UUID | Reference to report definition |
| name | VARCHAR(255) | Scheduled report name |
| schedule_cron | VARCHAR(100) | Cron expression for scheduling |
| recipients | TEXT[] | Email recipients |
| parameters | JSONB | Report parameters |
| export_format | VARCHAR(20) | Export format (pdf, excel, csv) |
| last_run_at | TIMESTAMP | Last execution time |
| next_run_at | TIMESTAMP | Next scheduled execution |
| is_active | BOOLEAN | Whether schedule is active |

#### supplier_performance_metrics
Stores calculated performance metrics for suppliers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| supplier_id | UUID | Reference to supplier |
| period_start | DATE | Metric period start |
| period_end | DATE | Metric period end |
| total_spend | DECIMAL(12,2) | Total spending in period |
| invoice_count | INTEGER | Number of invoices |
| payment_count | INTEGER | Number of payments |
| average_payment_days | DECIMAL(5,2) | Average days to pay |
| on_time_delivery_rate | DECIMAL(5,2) | On-time delivery percentage |
| quality_score | DECIMAL(3,2) | Quality rating (0-10) |
| reliability_score | DECIMAL(3,2) | Reliability rating (0-10) |
| cost_efficiency_rating | DECIMAL(3,2) | Cost efficiency rating (0-10) |
| calculated_at | TIMESTAMP | When metrics were calculated |

#### report_execution_history
Tracks report execution history and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| report_definition_id | UUID | Reference to report definition |
| scheduled_report_id | UUID | Reference to scheduled report (if applicable) |
| execution_start | TIMESTAMP | Execution start time |
| execution_end | TIMESTAMP | Execution end time |
| status | VARCHAR(20) | Execution status |
| records_processed | INTEGER | Number of records processed |
| file_path | TEXT | Path to generated file |
| error_message | TEXT | Error message if failed |

### 3. POS Integration Tables

#### stock_alerts
Stores stock alerts received from POS system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Product identifier |
| product_name | VARCHAR(255) | Product name |
| product_code | VARCHAR(50) | Product code |
| current_stock | INTEGER | Current stock level |
| reorder_point | INTEGER | Reorder threshold |
| reorder_quantity | INTEGER | Suggested reorder quantity |
| preferred_supplier_id | UUID | Preferred supplier |
| urgency_level | urgency_level | Alert urgency (enum) |
| status | VARCHAR(20) | Processing status |
| processed_at | TIMESTAMP | When alert was processed |

#### auto_purchase_orders
Automatically generated purchase orders from stock alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_number | VARCHAR(50) | Unique order number |
| supplier_id | UUID | Reference to supplier |
| total_amount | DECIMAL(12,2) | Total order amount |
| expected_delivery_date | DATE | Expected delivery date |
| status | VARCHAR(20) | Order status |
| automation_reason | TEXT | Reason for automation |
| stock_alert_id | UUID | Reference to triggering stock alert |
| created_by | UUID | User who created (system for auto) |

#### auto_purchase_order_items
Line items for automatic purchase orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| purchase_order_id | UUID | Reference to purchase order |
| product_id | UUID | Product identifier |
| product_name | VARCHAR(255) | Product name |
| quantity | INTEGER | Order quantity |
| unit_cost | DECIMAL(10,2) | Unit cost |
| total_cost | DECIMAL(10,2) | Total line cost |

#### supplier_products
Manages supplier-product relationships and preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| supplier_id | UUID | Reference to supplier |
| product_id | UUID | Product identifier |
| product_code | VARCHAR(50) | Product code |
| supplier_product_code | VARCHAR(50) | Supplier's product code |
| unit_cost | DECIMAL(10,2) | Unit cost from supplier |
| minimum_order_quantity | INTEGER | Minimum order quantity |
| lead_time_days | INTEGER | Lead time in days |
| is_preferred | BOOLEAN | Whether this is preferred supplier |
| is_active | BOOLEAN | Whether relationship is active |

#### integration_sync_log
Logs all integration synchronization activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| integration_type | integration_type | Type of integration (enum) |
| sync_type | VARCHAR(50) | Type of sync operation |
| status | VARCHAR(20) | Sync status |
| records_processed | INTEGER | Records processed |
| records_failed | INTEGER | Records that failed |
| errors_count | INTEGER | Number of errors |
| error_details | JSONB | Detailed error information |
| sync_data | JSONB | Additional sync data |
| started_at | TIMESTAMP | Sync start time |
| completed_at | TIMESTAMP | Sync completion time |

### 4. Notification System Tables

#### notification_templates
Stores customizable notification templates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Template name |
| type | notification_type | Notification type (enum) |
| subject | VARCHAR(500) | Email subject template |
| html_content | TEXT | HTML email content |
| text_content | TEXT | Plain text content |
| variables | JSONB | Available template variables |
| is_active | BOOLEAN | Whether template is active |
| created_by | UUID | User who created template |

#### scheduled_notifications
Manages scheduled and queued notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | notification_type | Notification type |
| recipient_email | VARCHAR(255) | Recipient email address |
| recipient_name | VARCHAR(255) | Recipient name |
| subject | VARCHAR(500) | Email subject |
| content | TEXT | Plain text content |
| html_content | TEXT | HTML content |
| scheduled_for | TIMESTAMP | When to send notification |
| status | VARCHAR(20) | Notification status |
| template_id | UUID | Reference to template used |
| related_entity_id | UUID | Related entity (invoice, supplier, etc.) |
| related_entity_type | VARCHAR(50) | Type of related entity |
| sent_at | TIMESTAMP | When notification was sent |
| error_message | TEXT | Error message if failed |
| retry_count | INTEGER | Number of retry attempts |
| max_retries | INTEGER | Maximum retry attempts |

#### notification_history
Tracks notification delivery attempts and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| notification_id | UUID | Reference to scheduled notification |
| status | VARCHAR(20) | Delivery status |
| response_data | JSONB | Response from email service |
| error_message | TEXT | Error message if failed |
| delivery_attempt | INTEGER | Attempt number |

#### supplier_communication_preferences
Stores communication preferences for each supplier.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| supplier_id | UUID | Reference to supplier |
| email_reminders | BOOLEAN | Enable email reminders |
| sms_reminders | BOOLEAN | Enable SMS reminders |
| reminder_days_before | INTEGER[] | Days before due date to remind |
| preferred_contact_method | VARCHAR(20) | Preferred contact method |
| language_preference | VARCHAR(10) | Language preference |

## Enums

### notification_type
- `payment_reminder` - Payment due reminders
- `overdue_notice` - Overdue payment notices
- `monthly_statement` - Monthly statements
- `custom_reminder` - Custom reminders
- `system_alert` - System alerts

### report_type
- `supplier_performance` - Supplier performance reports
- `spending_analysis` - Spending analysis reports
- `aging_report` - Aging reports
- `cash_flow_projection` - Cash flow projections
- `supplier_comparison` - Supplier comparison reports
- `custom_report` - Custom reports

### integration_type
- `pos_system` - POS system integration
- `accounting_system` - Accounting system integration
- `banking_system` - Banking system integration
- `email_service` - Email service integration

### urgency_level
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `critical` - Critical priority

## Views

### supplier_performance_dashboard
Comprehensive view combining supplier data with performance metrics, stock alerts, and purchase orders.

### stock_alerts_summary
Summary view of stock alerts grouped by urgency level.

### notification_performance
Performance metrics for notification delivery by type.

### mv_supplier_performance_summary (Materialized View)
Materialized view for high-performance supplier performance queries, refreshed daily.

## Functions

### generate_auto_purchase_order_number()
Generates unique purchase order numbers in format APO{YYYYMM}{NNN}.

### calculate_supplier_performance_metrics(supplier_id, period_start, period_end)
Calculates and stores performance metrics for a supplier in a given period.

### process_stock_alert(alert_id)
Processes a stock alert and creates an automatic purchase order.

### cleanup_old_notification_history(days_to_keep)
Removes old notification history records.

### cleanup_old_sync_logs(days_to_keep)
Removes old integration sync logs.

### cleanup_old_report_history(days_to_keep)
Removes old report execution history.

### get_supplier_dashboard_metrics(supplier_id)
Returns dashboard metrics for suppliers.

### get_notification_statistics(days_back)
Returns notification delivery statistics.

## Indexes

The schema includes comprehensive indexing for performance:

- **Primary indexes** on all primary keys
- **Foreign key indexes** on all foreign key columns
- **Partial indexes** for filtered queries (active records, pending items)
- **Composite indexes** for complex queries
- **Unique indexes** on materialized views

## Constraints

### Check Constraints
- Journal entries must balance (debit = credit)
- Quantities and amounts must be positive
- Performance metrics within valid ranges
- Retry counts within limits

### Foreign Key Constraints
- All references to suppliers, invoices, etc.
- Cascade deletes where appropriate
- Restrict deletes for critical references

### Unique Constraints
- Report names per type
- Notification template names per type
- Supplier-product relationships

## Security

### Row Level Security (RLS)
RLS is enabled on sensitive tables:
- `report_definitions`
- `scheduled_reports`
- `notification_templates`
- `scheduled_notifications`

### Policies
Example policies are provided but should be customized based on your authentication system.

## Maintenance

### Automated Cleanup
Functions are provided for cleaning up old data:
- Notification history (90 days default)
- Integration sync logs (30 days default)
- Report execution history (180 days default)

### Scheduled Jobs
Example pg_cron jobs are provided for:
- Daily materialized view refresh
- Weekly cleanup of old logs
- Daily performance metrics calculation

## Performance Considerations

1. **Materialized Views**: Use for frequently accessed aggregated data
2. **Partial Indexes**: Index only relevant records to save space
3. **Composite Indexes**: Support complex query patterns
4. **Regular Cleanup**: Remove old data to maintain performance
5. **Connection Pooling**: Use connection pooling for high-concurrency scenarios

## Migration Strategy

1. Run the main migration first
2. Apply constraints and optimizations
3. Test all functions and views
4. Set up scheduled jobs if using pg_cron
5. Configure security policies
6. Monitor performance and adjust indexes as needed

## Rollback

Use the rollback script if you need to remove all advanced features. **Warning**: This will permanently delete all data in the advanced features tables.

## Support

For questions or issues with the database schema, refer to:
- Requirements document for business logic
- Design document for architectural decisions
- This documentation for technical details