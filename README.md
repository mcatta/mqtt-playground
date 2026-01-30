# Meshtastic MQTT Logger

A Node.js application that subscribes to Meshtastic MQTT topics and logs events to a SQL database (MySQL/MariaDB).

## Features

- Connects to MQTT broker (Mosquitto)
- Subscribes to Meshtastic topics with wildcard support
- Parses Meshtastic message payloads
- Stores events in MySQL/MariaDB database
- Automatic database schema initialization
- Graceful shutdown handling
- Reconnection logic for both MQTT and database

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
   - Use the raiwalt-template [https://github.com/Lima-e-Silva/mosquitto-railway-template](https://github.com/Lima-e-Silva/mosquitto-railway-template)
5. Set the ENV variable

```env
MOSQUITTO_PASSWORD="<user>"
MOSQUITTO_USERNAME="<password>"
MOSQUITTO_TCP_HOST="${{RAILWAY_TCP_PROXY_DOMAIN}}"
MOSQUITTO_TCP_PORT="${{RAILWAY_TCP_PROXY_PORT}}"
```

### Step 5: Deploy Logger Application

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select this repository
3. Railway will auto-detect the Node.js app and deploy it
4. Configure environment variables (see Step 6)

### Step 6: Configure Environment Variables

For the **Logger Application** service, add these variables:

```env
MQTT_BROKER="mqtt://<mqtt-broker-service-name>.railway.internal:1883"
MQTT_USERNAME="<mqtt_service_user>"
MQTT_PASSWORD="<mqtt_service_pass>"
MQTT_PSK_KEY="<PSK_KEY>"
MQTT_PSK_IDENTITY="<IDENTITY>"

MQTT_CLIENT_ID="meshtastic-logger"

DB_HOST="${{MySQL.MYSQLHOST}}"
DB_PORT="${{MySQL.MYSQLPORT}}"
DB_USER="${{MySQL.MYSQLUSER}}"
DB_PASSWORD="${{MySQL.MYSQLPASSWORD}}"
DB_DATABASE="${{MySQL.MYSQLDATABASE}}"

MESHTASTIC_CHANNEL_KEY="<PSK_KEY>"
MESHTASTIC_ROOT_TOPIC="<TOPIC>"

// optional
NODE_ENV="production"
```

**Important:** Replace `<mqtt-broker-service-name>` with the internal service name Railway assigns (usually just `mqtt-broker`).

For the **MQTT Broker** service, no environment variables needed (unless you want authentication).
