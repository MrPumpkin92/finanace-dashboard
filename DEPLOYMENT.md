/**
 * Deployment Guide
 * Instructions for deploying to production environments
 */

# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] `.env` configured for target environment
- [ ] Database migrations tested
- [ ] Power BI credentials verified
- [ ] Azure AD app registration completed
- [ ] SSL certificates configured
- [ ] Backup strategy planned
- [ ] Monitoring configured

---

## Local Deployment

### Build
```bash
npm run build
```

### Run Production Build
```bash
NODE_ENV=production npm run start
```

### Verify
```bash
curl http://localhost:3000/api/health
```

---

## Docker Deployment

### Build Image
```bash
docker build -t finance-dashboard:latest .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AZURE_TENANT_ID=your-tenant-id \
  -e AZURE_CLIENT_ID=your-client-id \
  -e AZURE_CLIENT_SECRET=your-secret \
  -e POWER_BI_WORKSPACE_ID=workspace-id \
  -e POWER_BI_REPORT_ID=report-id \
  -e DB_PATH=/app/data/finance.db \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  finance-dashboard:latest
```

### Docker Compose
```bash
docker-compose up -d
```

---

## Azure App Service Deployment

### Prerequisites
- Azure subscription
- Azure CLI installed
- App Service plan created

### Deploy using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name finance-dashboard --location eastus

# Create App Service plan
az appservice plan create \
  --name finance-dashboard-plan \
  --resource-group finance-dashboard \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group finance-dashboard \
  --plan finance-dashboard-plan \
  --name finance-dashboard-app \
  --runtime "node|18-lts"

# Set environment variables
az webapp config appsettings set \
  --resource-group finance-dashboard \
  --name finance-dashboard-app \
  --settings \
    NODE_ENV=production \
    AZURE_TENANT_ID=your-tenant-id \
    AZURE_CLIENT_ID=your-client-id \
    AZURE_CLIENT_SECRET=your-secret \
    POWER_BI_WORKSPACE_ID=workspace-id \
    POWER_BI_REPORT_ID=report-id

# Deploy from local git
git remote add azure <git-url>
git push azure main
```

### Configure Azure DevOps Pipeline
1. Create `azure-pipelines.yml` in root
2. Configure Build and Release stages
3. Set up deployment slots
4. Configure auto-scaling

---

## Environment Configuration

### Production `.env`
```env
NODE_ENV=production
PORT=3000
DB_PATH=/var/lib/finance-dashboard/finance.db

# Azure AD
AZURE_TENANT_ID=<production-tenant-id>
AZURE_CLIENT_ID=<production-client-id>
AZURE_CLIENT_SECRET=<production-secret>

# Power BI
POWER_BI_WORKSPACE_ID=<workspace-id>
POWER_BI_REPORT_ID=<report-id>

# CORS
CORS_ORIGIN=https://finance.yourdomain.com

# Database
DB_PATH=/var/lib/finance-dashboard/finance.db
UPLOAD_DIR=/var/lib/finance-dashboard/uploads
```

---

## Database Management

### Production Database Setup
```bash
# Create database directory with proper permissions
mkdir -p /var/lib/finance-dashboard/data
chmod 700 /var/lib/finance-dashboard/data

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/finance-dashboard"
mkdir -p $BACKUP_DIR
cp /var/lib/finance-dashboard/finance.db \
   $BACKUP_DIR/finance.db.$(date +%Y%m%d_%H%M%S)

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### Database Maintenance
- Monitor database size
- Reindex tables periodically
- Archive old transactions (optional)
- Maintain transaction log

---

## SSL/TLS Configuration

### Self-Signed Certificate (Development)
```bash
openssl req -x509 -newkey rsa:4096 -nodes \
  -out cert.pem -keyout key.pem -days 365
```

### Let's Encrypt (Production)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Configure Express for HTTPS
```typescript
import https from 'https';
import fs from 'fs';
import { createApp } from './app';

const app = createApp();
const options = {
  key: fs.readFileSync('/path/to/key.pem'),
  cert: fs.readFileSync('/path/to/cert.pem'),
};

https.createServer(options, app).listen(443);
```

---

## Monitoring & Logging

### Application Logs
```bash
# Redirect logs to file
npm run start > /var/log/finance-dashboard.log 2>&1 &

# Watch logs
tail -f /var/log/finance-dashboard.log
```

### Health Monitoring
```bash
# Setup health check with cron
*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart finance-dashboard
```

### Performance Monitoring
- Monitor response times
- Track error rates
- Monitor database performance
- Track resource usage

---

## Scaling Considerations

### Single Instance
- Works for small deployments
- Use SQLite with WAL mode
- Monitor disk space

### Multiple Instances
- Use shared database (PostgreSQL recommended)
- Configure load balancer
- Use Redis for session management
- Enable data replication

### Database Migration (SQLite → PostgreSQL)
```bash
# Install migration tools
npm install --save-dev better-sqlite3-to-postgres

# Run migration
npm run migrate-to-postgres
```

---

## Rollback Plan

### Version Management
```bash
# Tag releases
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0

# Checkout previous version
git checkout v1.0.0
npm ci
npm run build
npm run start
```

### Database Rollback
```bash
# Restore from backup
cp /var/backups/finance-dashboard/finance.db.YYYYMMDD_HHMMSS \
   /var/lib/finance-dashboard/finance.db

# Restart application
systemctl restart finance-dashboard
```

---

## Security Hardening

### Firewall Rules
```bash
# Allow HTTP/HTTPS only
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### Rate Limiting (Nginx)
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api {
        limit_req zone=api burst=20 nodelay;
    }
}
```

### Security Headers
Already configured in Express with Helmet.js:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

### Data Encryption
```typescript
import crypto from 'crypto';

// Encrypt sensitive data before storage
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  // ... encryption logic
}
```

---

## Performance Optimization

### Response Caching
```typescript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### Compression
```typescript
import compression from 'compression';
app.use(compression());
```

### Database Connection Pooling
SQLite doesn't support pooling, but for PostgreSQL:
```typescript
import { Pool } from 'pg';
const pool = new Pool({ max: 20 });
```

---

## Disaster Recovery

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): Daily

### Backup Locations
- Local backup: `/var/backups/finance-dashboard/`
- Cloud backup: Azure Blob Storage
- Off-site backup: AWS S3

### Recovery Procedures
1. Restore latest backup
2. Verify data integrity
3. Update DNS (if needed)
4. Run migrations
5. Verify all services online

---

## Production Checklist

### Pre-Launch
- [ ] Security audit completed
- [ ] Performance tested under load
- [ ] Database backups configured
- [ ] Monitoring alerts configured
- [ ] Error tracking set up
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] SSL/TLS certificates installed

### Post-Launch
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all endpoints working
- [ ] Test Power BI integration
- [ ] Verify database backups running
- [ ] Check log rotation
- [ ] Monitor resource usage

---

## Common Issues

### High Memory Usage
- Check for memory leaks
- Implement connection pooling
- Monitor Node.js heap

### Slow Responses
- Analyze slow queries
- Optimize database indices
- Enable response compression
- Consider caching

### Database Locked
- Check for concurrent access
- Implement WAL mode for SQLite
- Consider migrating to PostgreSQL

### Authentication Failures
- Verify Azure AD credentials
- Check token expiration
- Validate CORS settings

---

## Support & Escalation

1. Check application logs
2. Review system metrics
3. Check external service status (Power BI, Azure AD)
4. Review recent changes
5. Escalate if unresolved

---

## References

- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Production Deployment](https://nodejs.org/en/docs/guides/nodejs-on-windows/)
- [Azure App Service Best Practices](https://learn.microsoft.com/en-us/azure/app-service/app-service-best-practices)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)
