# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline setup for the blog application using GitHub Actions.

## 🚀 Pipeline Overview

The CI/CD pipeline consists of multiple workflows that handle different aspects of the development and deployment process:

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests to `main`
- **Features**:
  - Automated testing for both API and Client
  - Security scanning
  - Docker image building and pushing
  - Automated deployment to staging and production
  - Performance testing
  - Slack notifications

### 2. Security Scanning (`.github/workflows/security-scan.yml`)
- **Triggers**: Daily schedule, manual dispatch, security-related file changes
- **Features**:
  - Dependency vulnerability scanning with Snyk
  - Container image scanning with Trivy
  - Secrets scanning with GitLeaks
  - Infrastructure as Code scanning with Checkov

### 3. Database Backup (`.github/workflows/database-backup.yml`)
- **Triggers**: Daily schedule, manual dispatch
- **Features**:
  - Automated database backups
  - Cloud storage upload
  - Backup verification and restore testing
  - Cleanup of old backups

### 4. Application Monitoring (`.github/workflows/monitoring.yml`)
- **Triggers**: Every 15 minutes, manual dispatch
- **Features**:
  - Health checks for all services
  - SSL certificate monitoring
  - Performance monitoring
  - Resource usage monitoring
  - Database health checks

## 🔧 Setup Instructions

### 1. Repository Secrets

Configure the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Production Environment
```
PRODUCTION_HOST=your-production-server-ip
PRODUCTION_USER=your-ssh-username
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_DOMAIN=yourdomain.com
PRODUCTION_API_URL=https://yourdomain.com/api
```

#### Staging Environment
```
STAGING_HOST=your-staging-server-ip
STAGING_USER=your-ssh-username
STAGING_SSH_KEY=your-private-ssh-key
STAGING_DOMAIN=staging.yourdomain.com
```

#### Cloud Storage (Optional)
```
AWS_S3_BUCKET=your-backup-bucket
AZURE_STORAGE_ACCOUNT=your-storage-account
AZURE_STORAGE_KEY=your-storage-key
```

#### Security Tools
```
SNYK_TOKEN=your-snyk-api-token
GITLEAKS_LICENSE=your-gitleaks-license
```

#### Notifications
```
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### 2. Server Setup

#### Production Server
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/blog-app
sudo chown $USER:$USER /opt/blog-app

# Clone repository
cd /opt/blog-app
git clone https://github.com/your-username/your-repo.git .

# Set up secrets
mkdir -p secrets
# Add your secret files here

# Initial deployment
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

#### Staging Server
```bash
# Same as production server setup
# Use staging-specific configurations
```

### 3. GitHub Environments

Create environments in GitHub (`Settings > Environments`):

#### Production Environment
- **Protection rules**: Require review from administrators
- **Deployment branches**: Limit to `main` branch only
- **Environment secrets**: Production-specific secrets

#### Staging Environment
- **Protection rules**: None (automatic deployment)
- **Deployment branches**: Allow `develop` and `main` branches
- **Environment secrets**: Staging-specific secrets

## 📋 Workflow Details

### Main CI/CD Workflow

#### Test Jobs
- **test-api**: Runs Go tests with MSSQL service container
- **test-client**: Runs Next.js tests, linting, and type checking
- **security-scan**: Vulnerability scanning with multiple tools

#### Build and Push
- **build-and-push**: Builds Docker images and pushes to GitHub Container Registry
- Only runs on `main` branch pushes
- Uses multi-stage builds for optimization
- Implements layer caching for faster builds

#### Deployment Jobs
- **deploy-staging**: Deploys to staging environment on `develop` branch
- **deploy-production**: Deploys to production environment on `main` branch
- Includes health checks and rollback capabilities
- Sends notifications on success/failure

### Security Workflow

#### Dependency Scanning
```yaml
# Example Snyk configuration
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=medium
```

#### Container Scanning
```yaml
# Example Trivy configuration
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'blog-api:scan'
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### Backup Workflow

#### Backup Types
- **Incremental**: Daily backups (differential)
- **Full**: Weekly backups (complete database)
- **Manual**: On-demand backups via workflow dispatch

#### Backup Process
1. Create database backup using SQL Server tools
2. Verify backup integrity
3. Upload to cloud storage (S3/Azure)
4. Clean up old backups
5. Test restore on staging (for full backups)

### Monitoring Workflow

#### Health Checks
- Frontend availability and response time
- API endpoint functionality
- SSL certificate expiration
- Database connectivity

#### Resource Monitoring
- Disk usage alerts (>80%)
- Memory usage alerts (>80%)
- Docker container status
- Log file sizes

## 🔄 Deployment Process

### Staging Deployment
1. Developer pushes to `develop` branch
2. CI/CD pipeline runs tests and security scans
3. Docker images are built and pushed
4. Automatic deployment to staging environment
5. Performance tests are executed
6. Notifications sent to team

### Production Deployment
1. Pull request merged to `main` branch
2. Full CI/CD pipeline execution
3. Manual approval required (if configured)
4. Database backup created before deployment
5. Production deployment with health checks
6. Rollback capability if health checks fail
7. Success/failure notifications

## 🚨 Monitoring and Alerting

### Automated Alerts
- **Health Check Failures**: Immediate Slack notifications
- **SSL Certificate Expiry**: 30-day warning notifications
- **High Resource Usage**: Disk/memory usage alerts
- **Security Vulnerabilities**: Daily security scan reports
- **Backup Failures**: Database backup status alerts

### Manual Monitoring
- **Performance Metrics**: Lighthouse CI reports
- **Security Reports**: GitHub Security tab
- **Deployment Status**: GitHub Actions dashboard
- **Resource Usage**: Server monitoring via SSH

## 🛠️ Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check deployment logs
docker-compose logs -f

# Verify service health
docker-compose ps
curl https://yourdomain.com/health

# Rollback if necessary
git revert <commit-hash>
```

#### Test Failures
```bash
# Run tests locally
cd api && go test ./...
cd client && npm test

# Check test environment
docker-compose -f docker-compose.test.yml up
```

#### Security Scan Issues
```bash
# Update dependencies
cd api && go mod tidy
cd client && npm audit fix

# Check security reports
# GitHub > Security > Code scanning alerts
```

### Pipeline Debugging

#### Enable Debug Logging
```yaml
# Add to workflow file
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### Manual Workflow Execution
```bash
# Trigger workflows manually
gh workflow run ci-cd.yml
gh workflow run security-scan.yml
gh workflow run database-backup.yml
```

## 📈 Performance Optimization

### Build Optimization
- **Multi-stage Dockerfiles**: Reduce image sizes
- **Layer Caching**: Speed up builds with GitHub Actions cache
- **Parallel Jobs**: Run tests and scans concurrently
- **Conditional Execution**: Skip unnecessary jobs based on file changes

### Deployment Optimization
- **Blue-Green Deployment**: Zero-downtime deployments
- **Health Checks**: Automatic rollback on failure
- **Resource Limits**: Prevent resource exhaustion
- **Load Balancing**: Distribute traffic across instances

## 🔒 Security Best Practices

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets
- Never commit secrets to repository

### Access Control
- Require reviews for production deployments
- Use branch protection rules
- Implement least privilege access
- Regular access audits

### Vulnerability Management
- Daily security scans
- Automated dependency updates
- Container image scanning
- Infrastructure as Code scanning

## 📚 Additional Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Scanning Tools](https://github.com/marketplace?category=security)

### Monitoring Tools
- [Prometheus + Grafana](https://prometheus.io/)
- [DataDog](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)

### Backup Solutions
- [AWS RDS Automated Backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [Azure SQL Database Backup](https://docs.microsoft.com/en-us/azure/azure-sql/database/automated-backups-overview)