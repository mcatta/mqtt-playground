# Railway Deployment Guide

This guide will help you deploy the Meshtastic MQTT Logger to Railway with a publicly accessible MQTT broker.

## Prerequisites

1. A [Railway account](https://railway.app) (sign up with GitHub)
2. [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but recommended)
3. Git repository with your code

## Architecture on Railway

Your deployment will consist of 3 services:
1. **Mosquitto MQTT Broker** - Public MQTT broker (ports 1883, 8883, 9001)
2. **MySQL Database** - Managed MySQL database (Railway plugin)
3. **Meshtastic Logger** - Node.js application that connects MQTT to database

## Deployment Steps

### Step 1: Install Railway CLI (Optional)

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create New Railway Project

#### Option A: Via Railway Dashboard (Easier)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select this repository
5. Railway will create a project

#### Option B: Via CLI

```bash
# In your project directory
railway init
railway link
```

### Step 3: Add MySQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will provision a MySQL database and provide connection details
4. Note: Railway automatically creates environment variables for the database

### Step 4: Deploy MQTT Broker Service

1. In your Railway project, click **"+ New"** → **"Empty Service"**
2. Name it **"mqtt-broker"**
3. Go to **Settings** → **Source** → **Connect to GitHub repo**
4. In **Settings** → **Deploy**:
   - Build Command: (leave empty)
   - Use Dockerfile: `Dockerfile.mosquitto` (we'll create this)
5. In **Settings** → **Networking**:
   - Click **"Generate Domain"** to get a public URL
   - Add TCP Proxy for port **1883** (this gives you a public MQTT address)
   - Add TCP Proxy for port **8883** (for TLS/SSL)
   - Add TCP Proxy for port **9001** (for WebSockets)

### Step 5: Deploy Logger Application

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select this repository
3. Railway will auto-detect the Node.js app and deploy it
4. Configure environment variables (see Step 6)

### Step 6: Configure Environment Variables

For the **Logger Application** service, add these variables:

```env
# MQTT Configuration
MQTT_BROKER=mqtt://<mqtt-broker-service-name>:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=meshtastic-logger

# Meshtastic Topic
MESHTASTIC_ROOT_TOPIC=msh/US/#

# Database Configuration (Railway auto-provides these)
# DATABASE_URL is automatically set by Railway MySQL plugin
# But if you need individual vars:
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}

# Optional: Node environment
NODE_ENV=production
```

**Important:** Replace `<mqtt-broker-service-name>` with the internal service name Railway assigns (usually just `mqtt-broker`).

For the **MQTT Broker** service, no environment variables needed (unless you want authentication).

### Step 7: Connect Your Meshtastic Device

After deployment, Railway will provide:
- **Public MQTT URL:** `your-app.railway.app` or TCP proxy like `tcp://monorail.proxy.rlwy.net:12345`
- **Port:** The TCP proxy port (e.g., 12345)

Configure your Meshtastic device or MQTT client to connect to:
- **Host:** `monorail.proxy.rlwy.net` (or your Railway TCP proxy host)
- **Port:** `12345` (your assigned TCP proxy port)
- **Username/Password:** (leave empty if anonymous, or set in mosquitto.conf)

### Step 8: Verify Deployment

1. Check Railway logs for each service
2. Test MQTT connection:
```bash
# From your local machine
mosquitto_pub -h <railway-tcp-proxy-host> -p <tcp-proxy-port> -t "test/topic" -m "Hello Railway"
```

3. Check if logger is receiving messages:
```bash
# Via Railway CLI
railway logs -s meshtastic-logger
```

## Architecture Diagram

```
Internet
   ↓
Railway TCP Proxy (public)
   ↓
[Mosquitto MQTT Broker] ←→ [MySQL Database]
   ↓                              ↑
[Meshtastic Logger] ──────────────┘
```

## Cost Estimation

Railway Pricing (as of 2024):
- **Hobby Plan:** $5/month (includes $5 credit)
  - Each service uses compute time
  - Estimated: $0.02/hour per service
  - ~$15-25/month for 3 services running 24/7
- **Free Trial:** $5 credit, no credit card required

## Alternative: Deploy Only Logger to Railway

If you want to save costs, you can:
1. Run MQTT broker locally (on your home network)
2. Only deploy the Logger + MySQL to Railway
3. Use a tunnel service (like ngrok or Cloudflare Tunnel) to expose your local MQTT broker

This reduces Railway costs to ~$5-10/month.

## Security Recommendations

1. **Enable MQTT Authentication:**
   - Create a password file in `config/passwd`
   - Set `allow_anonymous false` in mosquitto.conf
   - Update environment variables with credentials

2. **Use TLS/SSL:**
   - Get a certificate (Let's Encrypt via Railway)
   - Configure port 8883 with SSL
   - Update Meshtastic devices to use `mqtts://`

3. **Set up ACLs:**
   - Create `config/acl` file to control topic access
   - Limit which clients can publish/subscribe to which topics

4. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Railway's secret management

## Troubleshooting

### Logger can't connect to MQTT broker
- Ensure you're using the internal service name (e.g., `mqtt://mqtt-broker:1883`)
- Check Railway's private network is enabled

### MQTT broker not accessible from internet
- Verify TCP proxy is configured in Railway
- Check firewall rules (Railway should handle this automatically)

### Database connection errors
- Verify MySQL service is running
- Check database environment variables are set correctly
- Ensure logger service has `${{MySQL.DATABASE_URL}}` reference

### High costs
- Scale down unused services
- Use Railway's sleep mode for development
- Consider the local MQTT + Railway logger hybrid approach

## Support

For Railway-specific issues:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For this project:
- Check logs: `railway logs -s <service-name>`
- Restart service: `railway restart -s <service-name>`
