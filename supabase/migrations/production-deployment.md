# Production Database Migration Guide

## Migration Strategy

### Pre-deployment Checklist
- [ ] Backup existing database
- [ ] Test migrations on staging environment
- [ ] Verify data integrity after migration
- [ ] Check application compatibility
- [ ] Plan rollback strategy

### Migration Order
1. Run structural migrations first
2. Run data migrations
3. Update indexes and constraints
4. Verify foreign key relationships

### Production Migration Commands
```bash
# 1. Backup database
supabase db dump --file backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Run migrations
supabase db push --include-all

# 3. Verify migration status
supabase migration list

# 4. Test critical queries
supabase db test
```

### Rollback Procedure
```bash
# If migration fails, restore from backup
supabase db reset --file backup-YYYYMMDD-HHMMSS.sql
```

## Post-Migration Verification

### Data Integrity Checks
- Verify all tables exist with correct schema
- Check foreign key constraints
- Validate data types and constraints
- Test critical business logic queries

### Performance Verification
- Check query execution times
- Verify indexes are created
- Monitor database performance metrics
- Test concurrent access patterns