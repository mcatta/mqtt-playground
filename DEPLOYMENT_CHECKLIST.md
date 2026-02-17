# Railway Deployment Checklist

Use this checklist to ensure your Meshtastic Monitoring Platform is correctly deployed on Railway.

## Pre-Deployment ✅

- [ ] GitHub repository is accessible
- [ ] Railway account created
- [ ] MQTT broker URL available (or plan to deploy one)
- [ ] Meshtastic channel key obtained (if using encryption)

---

## Railway Project Setup ✅

- [ ] Railway project created
- [ ] Repository connected to Railway
- [ ] Project has descriptive name

---

## MySQL Database ✅

- [ ] MySQL service added to project
- [ ] Database is running (check status indicator)
- [ ] Environment variables auto-generated:
  - [ ] `MYSQLHOST`
  - [ ] `MYSQLPORT`
  - [ ] `MYSQLUSER`
  - [ ] `MYSQLPASSWORD`
  - [ ] `MYSQLDATABASE`

---

## Logger Service ✅

### Configuration
- [ ] Service created from GitHub repo
- [ ] **Root directory** set to `/logger`
- [ ] **Builder** set to `DOCKERFILE` or `NIXPACKS`

### Environment Variables
- [ ] `MQTT_BROKER` - MQTT broker URL
- [ ] `MQTT_USERNAME` - (if required)
- [ ] `MQTT_PASSWORD` - (if required)
- [ ] `MESHTASTIC_ROOT_TOPIC` - MQTT topic (e.g., `msh/US/#`)
- [ ] `MESHTASTIC_CHANNEL_KEY` - (optional, for encrypted messages)
- [ ] `DB_HOST` - References `${{MySQL.MYSQLHOST}}`
- [ ] `DB_PORT` - References `${{MySQL.MYSQLPORT}}`
- [ ] `DB_USER` - References `${{MySQL.MYSQLUSER}}`
- [ ] `DB_PASSWORD` - References `${{MySQL.MYSQLPASSWORD}}`
- [ ] `DB_DATABASE` - References `${{MySQL.MYSQLDATABASE}}`
- [ ] `NODE_ENV` - Set to `production`

### Deployment Status
- [ ] Build completed successfully
- [ ] Service is running
- [ ] No critical errors in logs
- [ ] Logs show: "Connected to MQTT broker"
- [ ] Logs show: "Database connected"

---

## API Service ✅

### Configuration
- [ ] Service created from GitHub repo
- [ ] **Root directory** set to `/api`
- [ ] **Builder** set to `DOCKERFILE` or `NIXPACKS`

### Environment Variables
- [ ] `DB_HOST` - References `${{MySQL.MYSQLHOST}}`
- [ ] `DB_PORT` - References `${{MySQL.MYSQLPORT}}`
- [ ] `DB_USER` - References `${{MySQL.MYSQLUSER}}`
- [ ] `DB_PASSWORD` - References `${{MySQL.MYSQLPASSWORD}}`
- [ ] `DB_DATABASE` - References `${{MySQL.MYSQLDATABASE}}`
- [ ] `JWT_SECRET` - Secure random string (min 32 chars)
- [ ] `JWT_EXPIRES_IN` - Token expiry (default: `3600`)
- [ ] `CORS_ORIGIN` - Allowed origins (use `*` for testing)
- [ ] `INITIAL_ADMIN_PASSWORD` - Admin password (default: `admin`)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `3000`

### Deployment Status
- [ ] Build completed successfully
- [ ] Service is running
- [ ] Public domain generated
- [ ] No critical errors in logs

---

## Testing ✅

### API Health Check
```bash
curl https://your-api.up.railway.app/api/health
```
- [ ] Returns `{"status":"healthy"}`
- [ ] Shows `"database":"connected"`

### Authentication Test
```bash
curl -X POST https://your-api.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```
- [ ] Returns JWT token
- [ ] No 401 or 500 errors

### Data Access Test
```bash
# Use token from login
curl https://your-api.up.railway.app/api/v1/coordinates \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
- [ ] Returns JSON response
- [ ] Shows coordinates data (or empty array if no data yet)

### Logger Data Collection
- [ ] Check MySQL database for `meshtastic_events` table
- [ ] Verify data is being inserted
- [ ] Check timestamp of latest entries

---

## Security ✅

- [ ] `JWT_SECRET` is strong and unique (min 32 characters)
- [ ] Default admin password changed after first login
- [ ] `CORS_ORIGIN` set to specific domain in production
- [ ] MQTT credentials secured (if applicable)
- [ ] `.env` files not committed to git
- [ ] Environment variables backed up securely

---

## Optional Enhancements ✅

### Custom Domain
- [ ] Custom domain added to API service
- [ ] DNS records updated
- [ ] SSL certificate provisioned automatically
- [ ] `CORS_ORIGIN` updated to custom domain

### MQTT Broker on Railway
- [ ] Mosquitto service deployed
- [ ] Logger updated to use internal Railway URL
- [ ] Credentials configured

### Monitoring
- [ ] Railway email notifications enabled
- [ ] Health check endpoints configured
- [ ] Log aggregation set up

### Database Optimization
- [ ] Indexes created for frequently queried fields
- [ ] Database size monitored
- [ ] Backup strategy implemented

---

## Troubleshooting Reference ✅

If any checks fail, refer to:
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Complete deployment guide
- **[README.md](./README.md)** - Project overview
- **Service Logs** - Check Railway deployment logs
- **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - API documentation

---

## Post-Deployment Tasks ✅

- [ ] Document your deployment details:
  - API URL
  - Database credentials backup
  - JWT secret backup
- [ ] Set up monitoring/alerts
- [ ] Share API documentation with team
- [ ] Plan for scaling (if needed)
- [ ] Schedule regular database backups

---

## Success Criteria ✅

Your deployment is successful when:

1. ✅ All three services (MySQL, Logger, API) are running
2. ✅ Logger is collecting data from MQTT
3. ✅ API returns data via authenticated requests
4. ✅ No critical errors in service logs
5. ✅ Health check returns "healthy" status

---

**Congratulations! Your Meshtastic Monitoring Platform is deployed! 🎉**

For support, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) troubleshooting section.
