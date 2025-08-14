# Supplier Billing Advanced Features - Database Migration Guide

## Overview

This guide covers the database migration for the Supplier Billing Advanced Features, which extends the existing supplier billing system with:

- **Accounting Integration**: Enhanced journal entries, chart of accounts management, and external system integration
- **Advanced Reporting**: Dynamic reports, scheduled reports, and supplier performance analytics
- **POS Integration**: Stock alerts, automatic purchase orders, and inventory synchronization
- **Automated Notifications**: Customizable templates, scheduled reminders, and communication tracking

## Migration Files

### 1. Main Migration
**File**: `supabase/migrations/20241214000001_supplier_billing_advanced_features.sql`

This is the primary migration file that creates:
- All new tables for advanced features
- Extended columns for existing tables
- New enum types
- Basic stored functions
- Views for data access
- Performance indexes
- Sample data

### 2. Constraints and Optimizations
**File**: `supabase/migrations/20241214000002_advanced_constraints_and_optimizations.sql`

This file adds:
- Check constraints for data integrity
- Additional foreign key constraints
- Partial and composite indexes for performance
- Advanced stored procedures
- Materialized views
- Security policies (RLS)
- Cleanup procedures

### 3. Rollback Script
**File**: `supabase/migrations/20241214000003_rollback_advanced_features.sql`

Use this file to completely remove all advanced features if needed.
**⚠️ WARNING**: This will permanently delete all data in the advanced features tables.

## Prerequisites

Before running the migration, ensure:

1. **Existing Schema**: The basic supplier billing tables must already exist:
   - `suppliers`
   - `supplier_invoices`
   - `supplier_invoice_items`
   - `supplier_payments`
   - `chart_of_accounts`
   - `journal_entries`
   - `journal_entry_lines`

2. **Database Extensions**: The following PostgreSQL extensions should be available:
   - `uuid-ossp` (for UUID generation)
   - `pgcrypto` (for encryption functions)

3. **Permissions**: The database user must have:
   - CREATE TABLE permissions
   - CREATE FUNCTION permissions
   - CREATE INDEX permissions
   - CREATE TRIGGER permissions

## Migration Steps

### Step 1: Backup Your Database
```bash
# Create a backup before migration
pg_dump -h your-host -U your-user -d your-database > backup_before_advanced_features.sql
```

### Step 2: Run the Main Migration
```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241214000001_supplier_billing_advanced_features.sql
```

### Step 3: Apply Constraints and Optimizations
```bash
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241214000002_advanced_constraints_and_optimizations.sql
```

### Step 4: Verify Migration
```bash
# Run the test script
node scripts/test-advanced-schema.js
```

## Verification Checklist

After migration, verify:

- [ ] All tables created successfully
- [ ] All functions are callable
- [ ] All views return data
- [ ] Indexes are created
- [ ] Sample data is inserted
- [ ] No constraint violations
- [ ] Application can connect and query

## Post-Migration Configuration

### 1. Security Policies
Review and customize the Row Level Security policies based on your authentication system:

```sql
-- Example: Customize based on your auth system
CREATE POLICY "Users can view their own reports" ON report_definitions
    FOR SELECT USING (created_by = auth.uid());
```

### 2. Scheduled Jobs (Optional)
If you have `pg_cron` extension, enable the scheduled jobs:

```sql
-- Daily materialized view refresh
SELECT cron.schedule('refresh-supplier-performance', '0 1 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_supplier_performance_summary;');

-- Weekly cleanup
SELECT cron.schedule('cleanup-old-logs', '0 2 * * 0', 
    'SELECT cleanup_old_notification_history(90); SELECT cleanup_old_sync_logs(30);');
```

### 3. Application Configuration
Update your application configuration to use the new features:

- Configure email service for notifications
- Set up POS system integration endpoints
- Configure accounting system connections
- Set up report generation schedules

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   ERROR: permission denied for schema public
   ```
   **Solution**: Ensure the database user has CREATE permissions.

2. **Extension Not Found**
   ```
   ERROR: extension "uuid-ossp" is not available
   ```
   **Solution**: Install the required extensions or contact your database administrator.

3. **Table Already Exists**
   ```
   ERROR: relation "table_name" already exists
   ```
   **Solution**: The migration uses `IF NOT EXISTS` clauses, but if you see this error, check if you're running the migration multiple times.

4. **Function Conflicts**
   ```
   ERROR: function "function_name" already exists
   ```
   **Solution**: The migration uses `CREATE OR REPLACE FUNCTION` to handle this.

### Performance Issues

If you experience performance issues after migration:

1. **Analyze Tables**
   ```sql
   ANALYZE suppliers;
   ANALYZE supplier_invoices;
   -- Analyze all new tables
   ```

2. **Check Index Usage**
   ```sql
   SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public';
   ```

3. **Monitor Query Performance**
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   WHERE query LIKE '%supplier%' 
   ORDER BY mean_time DESC;
   ```

## Rollback Procedure

If you need to rollback the migration:

1. **Backup Current State** (if you want to preserve any data)
   ```bash
   pg_dump -h your-host -U your-user -d your-database > backup_before_rollback.sql
   ```

2. **Run Rollback Script**
   ```bash
   psql -h your-host -U your-user -d your-database -f supabase/migrations/20241214000003_rollback_advanced_features.sql
   ```

3. **Verify Rollback**
   ```sql
   -- Check that advanced tables are removed
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE '%stock_alerts%';
   ```

## Data Migration (If Needed)

If you have existing data that needs to be migrated to the new structure:

### 1. Supplier Performance Metrics
```sql
-- Calculate historical performance metrics
SELECT calculate_supplier_performance_metrics(
    id, 
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'
) FROM suppliers WHERE status = 'active';
```

### 2. Communication Preferences
```sql
-- Set default communication preferences for existing suppliers
INSERT INTO supplier_communication_preferences (supplier_id)
SELECT id FROM suppliers WHERE status = 'active'
ON CONFLICT (supplier_id) DO NOTHING;
```

## Monitoring and Maintenance

### 1. Regular Cleanup
Set up regular cleanup of old data:

```sql
-- Run monthly
SELECT cleanup_old_notification_history(90);
SELECT cleanup_old_sync_logs(30);
SELECT cleanup_old_report_history(180);
```

### 2. Performance Monitoring
Monitor key metrics:

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;
```

### 3. Data Quality Checks
Regular data quality checks:

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM stock_alerts WHERE preferred_supplier_id NOT IN (SELECT id FROM suppliers);

-- Check notification delivery rates
SELECT type, 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
       ROUND(COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM scheduled_notifications 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY type;
```

## Support and Documentation

- **Schema Documentation**: `docs/DATABASE_SCHEMA_ADVANCED_FEATURES.md`
- **Requirements**: `.kiro/specs/supplier-billing-advanced/requirements.md`
- **Design Document**: `.kiro/specs/supplier-billing-advanced/design.md`
- **Implementation Tasks**: `.kiro/specs/supplier-billing-advanced/tasks.md`

## Next Steps

After successful migration:

1. **Update Application Code**: Implement the service layer to use the new tables
2. **Configure Integrations**: Set up connections to POS, accounting, and email systems
3. **Create Reports**: Build the reporting interface using the new report definitions
4. **Set Up Notifications**: Configure notification templates and schedules
5. **User Training**: Train users on the new advanced features

## Version History

- **v1.0** (2024-12-14): Initial advanced features migration
  - Added accounting integration tables
  - Added reporting and analytics tables
  - Added POS integration tables
  - Added notification system tables
  - Added performance optimizations and constraints