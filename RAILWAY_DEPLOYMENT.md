# Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Meshtastic Monitoring Platform to Railway.

## Architecture Overview

```
Railway Project
├── MySQL Database (shared by both services)
├── Logger Service (monitors MQTT and writes to DB)
└── API Service (provides REST API access to data)
```

## Prerequisites

1. [Railway Account](https://railway.app/) (free tier available)
2. GitHub repository with this code
3. Meshtastic channel encryption key (optional, for encrypted messages)

---

## Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select this repository

---

## Step 2: Deploy MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision MySQL and create environment variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

**Note:** Keep this service running - both Logger and API will reference it.

---

## Step 3: Deploy Logger Service

### 3.1 Create Logger Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select this repository
3. **Important:** In service settings:
   - Set **Root Directory** to: `/logger`
   - Set **Builder** to: `DOCKERFILE`

### 3.2 Configure Environment Variables

Add these variables in the Logger service settings:

#### MQTT Configuration
```env
# Use your MQTT broker URL (Railway, external, or public broker)
MQTT_BROKER=mqtt://public.broker.url:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=meshtastic-logger-railway

# Meshtastic topic (change region if needed)
MESHTASTIC_ROOT_TOPIC=msh/US/#

# Optional: Encryption key from your Meshtastic device
MESHTASTIC_CHANNEL_KEY=AQ==
```

#### Database Configuration (Reference MySQL Service)
```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
```

#### Optional: TLS/PSK for MQTT
```env
MQTT_USE_TLS=false
# If using TLS, also set: MQTT_PSK_KEY, MQTT_PSK_IDENTITY, etc.
```

#### Other Settings
```env
NODE_ENV=production
```

### 3.3 Deploy

Click **"Deploy"** - the logger will start collecting data from your MQTT broker.

---

## Step 4: Deploy API Service

### 4.1 Create API Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select this repository (again)
3. **Important:** In service settings:
   - Set **Root Directory** to: `/api`
   - Set **Builder** to: `DOCKERFILE`

### 4.2 Configure Environment Variables

Add these variables in the API service settings:

#### Database Configuration (Reference Same MySQL Service)
```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
```

#### JWT Configuration
```env
# Generate a secure secret (run one of these locally):
# openssl rand -base64 64
# node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=YOUR_GENERATED_SECRET_HERE_MIN_32_CHARS

# Token expiry in seconds (3600 = 1 hour)
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800
```

#### CORS Configuration
```env
# For production: Set to your frontend domain
# For testing: Use * to allow all origins
CORS_ORIGIN=*
```

#### Initial Admin Credentials
```env
# Default admin credentials (CHANGE IMMEDIATELY AFTER FIRST LOGIN!)
INITIAL_ADMIN_PASSWORD=admin
```

#### Other Settings
```env
NODE_ENV=production
PORT=3000
```

### 4.3 Deploy

Click **"Deploy"** - Railway will build and deploy your API.

### 4.4 Get Your API URL

After deployment:
1. Go to API service settings
2. Click **"Networking"** → **"Generate Domain"**
3. Railway will provide a public URL like: `https://your-api-name.up.railway.app`

---

## Step 5: Test Your Deployment

### 5.1 Health Check

```bash
curl https://your-api-name.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 5.2 Login

```bash
curl -X POST https://your-api-name.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 3600
}
```

### 5.3 Get Data

```bash
# Replace <TOKEN> with the token from login response
curl https://your-api-name.up.railway.app/api/v1/coordinates \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Optional: Deploy MQTT Broker on Railway

If you don't have an MQTT broker, you can deploy Mosquitto to Railway:

1. Click **"+ New"** → **"Empty Service"**
2. Use this template: [mosquitto-railway-template](https://github.com/Lima-e-Silva/mosquitto-railway-template)
3. Configure environment variables as needed
4. Update Logger service `MQTT_BROKER` to: `mqtt://mqtt-service.railway.internal:1883`

---

## Monitoring and Logs

### View Service Logs

1. Click on a service (Logger or API)
2. Go to **"Deployments"** tab
3. Click on the active deployment
4. View real-time logs

### Monitor Database

1. Click on MySQL service
2. Use Railway's built-in **"Query"** tab
3. Or connect via external MySQL client using provided credentials

---

## Troubleshooting

### Logger Not Collecting Data

**Issue:** Logger starts but no data in database

**Solutions:**
1. Check MQTT broker connectivity:
   ```bash
   # In Logger logs, look for:
   "Connected to MQTT broker"
   ```

2. Verify MQTT topic matches your network:
   ```env
   # US: msh/US/#
   # EU: msh/EU/#
   # Custom: msh/YourRegion/#
   MESHTASTIC_ROOT_TOPIC=msh/US/#
   ```

3. Check database connection:
   ```bash
   # In Logger logs, look for:
   "Database connected"
   "Database initialized"
   ```

### API Returns 500 Errors

**Issue:** API starts but returns 500 on all requests

**Solutions:**
1. Check database connection in API logs
2. Verify environment variables are set correctly
3. Check that Logger has created the database schema

### Decryption Errors

**Issue:** Logger shows "Failed to decrypt" errors

**Solutions:**
1. Get correct channel key from your Meshtastic device:
   - Settings → Channels → Long press channel → View details
2. Format: Base64 or Hex
3. Update `MESHTASTIC_CHANNEL_KEY` environment variable

### API Authentication Issues

**Issue:** Login fails or token invalid

**Solutions:**
1. Ensure `JWT_SECRET` is set (minimum 32 characters)
2. Check token hasn't expired (default 1 hour)
3. Verify admin password (default: `admin`)
4. Check CORS settings if calling from browser

---

## Security Recommendations

### 1. Change Default Credentials

```bash
# After first login, change admin password via API:
curl -X POST https://your-api.railway.app/api/v1/auth/change-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin",
    "newPassword": "your-secure-password"
  }'
```

### 2. Secure JWT Secret

Generate a cryptographically secure secret:
```bash
openssl rand -base64 64
```

### 3. Configure CORS

For production, set specific origin:
```env
CORS_ORIGIN=https://yourdomain.com
```

### 4. Use TLS for MQTT

If your MQTT broker supports TLS:
```env
MQTT_BROKER=mqtts://broker.url:8883
MQTT_USE_TLS=true
```

### 5. Environment Variables

- Never commit `.env` files to git
- Use Railway's environment variable UI
- Keep backups of your configuration

---

## Scaling and Performance

### Database Optimization

1. **Add Indexes** (after significant data collection):
   ```sql
   CREATE INDEX idx_timestamp ON meshtastic_events(timestamp);
   CREATE INDEX idx_node_id ON meshtastic_events(node_id);
   CREATE INDEX idx_message_type ON meshtastic_events(message_type);
   ```

2. **Monitor Database Size:**
   - Railway free tier: 5GB storage
   - Check usage in MySQL service dashboard

### Logger Performance

- Handles 100+ messages/second
- Auto-reconnects on MQTT disconnect
- Connection pooling for database

### API Performance

- Built-in rate limiting (5 login attempts per 15 min)
- Efficient queries with pagination support
- Stateless JWT authentication

---

## Cost Estimation

### Railway Free Tier (Hobby Plan)

- $5 credit/month (no credit card required)
- 512MB RAM per service
- 5GB database storage
- Shared CPU
- 500 hours of execution/month

### Estimated Usage

- **Logger Service:** ~100-200 hours/month (always running)
- **API Service:** ~100-200 hours/month (always running)
- **MySQL:** Included with database service
- **Total:** Should fit within free tier for small-scale deployments

### Upgrade to Pro Plan ($20/month) If:

- Need more than 5GB database storage
- Require dedicated CPU
- Want higher availability
- Need custom domains with SSL

---

## Backup and Disaster Recovery

### Database Backups

**Option 1: Railway Automated Backups** (Pro plan)
- Automatic daily backups
- Point-in-time recovery

**Option 2: Manual Backups**
```bash
# Connect to Railway MySQL and export
mysqldump -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE > backup.sql
```

### Service Configuration Backup

Export environment variables from Railway:
1. Go to service settings
2. Copy all environment variables
3. Store securely (e.g., password manager)

---

## Advanced Configuration

### Custom Domain

1. In API service, go to **Settings** → **Networking**
2. Click **"Add Custom Domain"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as shown
5. Railway automatically provisions SSL certificate

### Health Checks

Railway automatically monitors service health using:
- API: `/api/health` endpoint (configured in `railway.json`)
- Logger: Process uptime

### Automatic Deployments

Railway automatically redeploys on git push to main branch:
1. Push changes to GitHub
2. Railway detects changes
3. Rebuilds and redeploys affected services
4. Zero-downtime deployment (for API)

---

## Support and Documentation

- **Main README:** [README.md](./README.md)
- **API Documentation:** [API_SPECIFICATION.md](./API_SPECIFICATION.md)
- **Logger Documentation:** [logger/README.md](./logger/README.md)
- **API Documentation:** [api/README.md](./api/README.md)
- **Railway Docs:** https://docs.railway.app/
- **Meshtastic:** https://meshtastic.org/

---

## Quick Reference: Environment Variables

### Logger Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MQTT_BROKER` | ✅ | - | MQTT broker URL |
| `MQTT_USERNAME` | ⚠️ | - | MQTT username (if required) |
| `MQTT_PASSWORD` | ⚠️ | - | MQTT password (if required) |
| `MESHTASTIC_ROOT_TOPIC` | ✅ | `msh/US/#` | MQTT topic to subscribe |
| `MESHTASTIC_CHANNEL_KEY` | ❌ | - | Channel encryption key |
| `DB_HOST` | ✅ | - | Database host |
| `DB_PORT` | ✅ | `3306` | Database port |
| `DB_USER` | ✅ | - | Database username |
| `DB_PASSWORD` | ✅ | - | Database password |
| `DB_DATABASE` | ✅ | - | Database name |

### API Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ | - | Database host |
| `DB_PORT` | ✅ | `3306` | Database port |
| `DB_USER` | ✅ | - | Database username |
| `DB_PASSWORD` | ✅ | - | Database password |
| `DB_DATABASE` | ✅ | - | Database name |
| `JWT_SECRET` | ✅ | - | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | `3600` | Token expiry (seconds) |
| `CORS_ORIGIN` | ❌ | `*` | Allowed CORS origins |
| `INITIAL_ADMIN_PASSWORD` | ❌ | `admin` | Admin password |
| `NODE_ENV` | ❌ | `production` | Node environment |
| `PORT` | ❌ | `3000` | API port |

---

**Happy Deploying! 🚀**

For issues or questions, please open an issue on GitHub.
