# Production Deployment Guide

This guide covers the complete process of deploying the Warehouse Stock System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Application Build](#application-build)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Supabase CLI**: Latest version
- **Git**: For version control
- **SSL Certificate**: For HTTPS deployment

### Access Requirements

- Supabase project with production database
- Domain name and DNS access
- Web server or hosting platform access
- Email service for notifications (optional)

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested on staging
- [ ] SSL certificates ready
- [ ] Backup procedures tested
- [ ] Monitoring tools configured

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd warehouse-stock-system
```

### 2. Install Dependencies

```bash
npm ci --production=false
```

### 3. Configure Environment Variables

```bash
# Copy production environment template
cp .env.production .env.local

# Edit environment variables
nano .env.local
```

**Required Environment Variables:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
VITE_APP_ENV=production
VITE_APP_NAME="Warehouse Stock System"
VITE_APP_VERSION=1.0.0

# Security Configuration
VITE_ENABLE_AUDIT_TRAIL=true
VITE_SESSION_TIMEOUT=3600000

# Monitoring Configuration
VITE_ENABLE_ERROR_REPORTING=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 4. Validate Environment

```bash
./scripts/setup-environment.sh validate
```

## Database Migration

### 1. Backup Current Database

```bash
# Create backup before migration
./scripts/backup-database.sh
```

### 2. Run Database Migrations

```bash
# Run production migration script
./scripts/migrate-production.sh
```

### 3. Verify Migration

```bash
# Check migration status
supabase migration list

# Verify data integrity
supabase db test
```

## Application Build

### 1. Run Production Build

```bash
# Build application for production
./scripts/build-production.sh
```

### 2. Verify Build Output

```bash
# Check build directory
ls -la dist/

# Verify bundle sizes
du -sh dist/*
```

### 3. Test Build Locally

```bash
# Serve production build locally
npm run preview
```

## Deployment Process

### Option 1: Static Hosting (Recommended)

#### Netlify Deployment

1. **Connect Repository**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Initialize site
   netlify init
   ```

2. **Configure Build Settings**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy**
   ```bash
   # Deploy to production
   netlify deploy --prod
   ```

#### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

### Option 2: Self-Hosted Deployment

#### Using Nginx

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/warehouse-system
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       root /var/www/warehouse-system/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass https://your-project.supabase.co;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       # Security headers
       add_header X-Frame-Options DENY;
       add_header X-Content-Type-Options nosniff;
       add_header X-XSS-Protection "1; mode=block";
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
   }
   ```

3. **Deploy Files**
   ```bash
   # Copy build files to web server
   sudo cp -r dist/* /var/www/warehouse-system/
   sudo chown -R www-data:www-data /var/www/warehouse-system/
   
   # Enable site
   sudo ln -s /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Test application endpoints
curl -I https://your-domain.com
curl -I https://your-domain.com/api/health

# Test database connectivity
./scripts/test-database-connection.sh
```

### 2. Performance Testing

```bash
# Run performance tests
npm run test:performance

# Check Core Web Vitals
# Use Google PageSpeed Insights or Lighthouse
```

### 3. Security Testing

```bash
# Check SSL configuration
openssl s_client -connect your-domain.com:443

# Verify security headers
curl -I https://your-domain.com
```

### 4. Monitoring Setup

1. **Configure Error Monitoring**
   - Set up Sentry or similar service
   - Verify error reporting is working

2. **Set up Uptime Monitoring**
   - Configure uptime checks
   - Set up alert notifications

3. **Database Monitoring**
   - Monitor database performance
   - Set up backup monitoring

## Monitoring and Maintenance

### Application Monitoring

1. **Error Tracking**
   ```javascript
   // Errors are automatically tracked via errorLogger utility
   // Check dashboard at your monitoring service
   ```

2. **Performance Monitoring**
   ```javascript
   // Performance metrics are collected automatically
   // Access via monitor.getSystemMetrics()
   ```

3. **Health Checks**
   ```bash
   # Manual health check
   curl https://your-domain.com/api/health
   ```

### Database Monitoring

1. **Query Performance**
   - Monitor slow queries in Supabase dashboard
   - Set up alerts for performance degradation

2. **Storage Usage**
   - Monitor database size growth
   - Set up alerts for storage limits

3. **Connection Monitoring**
   - Monitor connection pool usage
   - Set up alerts for connection issues

### Automated Backups

```bash
# Set up automated daily backups
./scripts/setup-cron-backup.sh --schedule "0 2 * * *" --email admin@company.com

# Verify backup setup
crontab -l
```

## Backup and Recovery

### Backup Strategy

1. **Automated Daily Backups**
   ```bash
   # Database backups at 2 AM daily
   0 2 * * * /path/to/scripts/backup-database.sh
   ```

2. **Pre-deployment Backups**
   ```bash
   # Always backup before deployments
   ./scripts/backup-database.sh
   ```

3. **Retention Policy**
   - Keep daily backups for 30 days
   - Keep weekly backups for 3 months
   - Keep monthly backups for 1 year

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # List available backups
   ./scripts/restore-database.sh --list
   
   # Restore from backup
   ./scripts/restore-database.sh backup_file.sql.gz
   ```

2. **Application Recovery**
   ```bash
   # Rollback to previous version
   git checkout previous-release-tag
   npm run build
   # Deploy previous version
   ```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 24 hours
3. **Recovery Steps**:
   - Assess damage and scope
   - Restore database from latest backup
   - Deploy last known good application version
   - Verify system functionality
   - Communicate status to stakeholders

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci
npm run build
```

#### Database Connection Issues

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
supabase db ping
```

#### Performance Issues

```bash
# Check bundle sizes
npm run build
ls -la dist/js/

# Analyze performance
npm run test:performance
```

#### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in certificate.crt -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
certbot renew
```

### Logging and Debugging

1. **Application Logs**
   ```bash
   # Check browser console for errors
   # Check network tab for failed requests
   ```

2. **Server Logs**
   ```bash
   # Nginx logs
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Database Logs**
   ```bash
   # Check Supabase dashboard for query logs
   # Monitor slow query log
   ```

### Emergency Contacts

- **System Administrator**: admin@company.com
- **Database Administrator**: dba@company.com
- **Development Team**: dev-team@company.com
- **Hosting Provider Support**: support@hosting-provider.com

### Rollback Procedures

1. **Application Rollback**
   ```bash
   # Revert to previous Git tag
   git checkout v1.0.0
   npm run build
   # Deploy previous version
   ```

2. **Database Rollback**
   ```bash
   # Restore from pre-deployment backup
   ./scripts/restore-database.sh pre_deployment_backup.sql.gz
   ```

3. **DNS Rollback**
   ```bash
   # Point DNS back to previous server
   # Update A/CNAME records
   ```

## Security Considerations

### Production Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular security updates applied
- [ ] Audit logging enabled
- [ ] Access controls implemented
- [ ] Backup encryption enabled

### Security Monitoring

1. **Failed Login Attempts**
2. **Unusual Database Activity**
3. **SSL Certificate Expiry**
4. **Security Header Compliance**
5. **Dependency Vulnerabilities**

## Performance Optimization

### Frontend Optimization

1. **Bundle Optimization**
   - Code splitting implemented
   - Tree shaking enabled
   - Compression enabled

2. **Caching Strategy**
   - Static assets cached
   - API responses cached
   - Service worker implemented

3. **CDN Configuration**
   - Static assets served from CDN
   - Geographic distribution

### Database Optimization

1. **Query Optimization**
   - Indexes created for frequent queries
   - Query performance monitored
   - Connection pooling configured

2. **Data Management**
   - Regular data cleanup
   - Archive old data
   - Monitor storage usage

## Compliance and Auditing

### Audit Trail

- All user actions logged
- Database changes tracked
- System access monitored
- Backup operations logged

### Compliance Requirements

- Data retention policies
- Access control policies
- Security incident procedures
- Regular security assessments

---

## Support and Maintenance

For ongoing support and maintenance:

1. **Regular Updates**
   - Security patches
   - Dependency updates
   - Feature enhancements

2. **Monitoring**
   - System health checks
   - Performance monitoring
   - Error tracking

3. **Documentation**
   - Keep deployment guide updated
   - Document configuration changes
   - Maintain runbooks

For technical support, contact the development team or refer to the project documentation.