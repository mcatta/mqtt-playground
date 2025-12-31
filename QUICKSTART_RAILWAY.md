# Quick Start: Deploy to Railway in 10 Minutes

This is the fastest way to get your Meshtastic MQTT Logger running on Railway.

## Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Your code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Create Railway Project (2 min)

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your `mqtt-meshtastic` repository

### 2. Add MySQL Database (1 min)

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Done! Railway auto-configures the connection

### 3. Deploy MQTT Broker (3 min)

1. Click **"+ New"** → **"Empty Service"**
2. Name it **"mqtt-broker"**
3. Click the service → **"Settings"** → **"Source"**
4. Click **"Connect Repo"** → Select your repository
5. Under **"Build"**:
   - Set **Docker Image** toggle to ON
   - Set **Dockerfile Path** to: `Dockerfile.mosquitto`
6. Under **"Networking"**:
   - Click **"Add TCP Proxy"** → Select port **1883**
   - Note the assigned proxy address (e.g., `monorail.proxy.rlwy.net:12345`)

### 4. Deploy Logger Service (2 min)

1. Your main service should already be created from Step 1
2. Click on it → **"Variables"** tab
3. Add these environment variables (click **"+ Add Variable"**):

```
MQTT_BROKER=mqtt://mqtt-broker.railway.internal:1883
MQTT_CLIENT_ID=meshtastic-logger
MESHTASTIC_ROOT_TOPIC=msh/US/#
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
NODE_ENV=production
```

4. Click **"Deploy"** (or it will auto-deploy)

### 5. Connect Your Meshtastic Device (2 min)

Configure your device or MQTT client with:
- **Host:** `monorail.proxy.rlwy.net` (from Step 3)
- **Port:** `12345` (your TCP proxy port from Step 3)
- **Username:** (leave empty)
- **Password:** (leave empty)
- **Topic:** `msh/US/` (or your region)

### 6. Verify It's Working

#### Check Railway Logs:
1. Click on **"meshtastic-logger"** service
2. Click **"Logs"** tab
3. You should see: `Connected to MQTT broker` and `Database connected`

#### Test MQTT Connection:
```bash
# From your terminal
mosquitto_pub -h monorail.proxy.rlwy.net -p 12345 -t "test/topic" -m "Hello from Railway"
```

## Expected Costs

Railway pricing (as of 2024):
- **Hobby Plan:** $5/month base
- **Usage:** ~$0.02/hour per service
- **Estimated total:** $15-25/month for 24/7 operation

**💡 Tip:** Use Railway's sleep feature for development to save costs.

## What You Get

✅ Public MQTT broker accessible from anywhere
✅ MySQL database with automatic backups
✅ Auto-deployment from Git (push to deploy)
✅ SSL certificates (via Railway)
✅ Monitoring and logs
✅ Scalable infrastructure

## Troubleshooting

### "Can't connect to database"
- Wait 30-60 seconds for MySQL to fully start
- Check that database variables are set correctly
- Restart the logger service

### "Can't connect to MQTT broker"
- Verify `mqtt-broker.railway.internal` is the correct internal hostname
- Check MQTT broker logs for errors
- Try `mqtt-broker` instead of `mqtt-broker.railway.internal`

### "MQTT not accessible from internet"
- Verify TCP Proxy is enabled on port 1883
- Check Railway networking configuration
- Test with: `telnet <proxy-host> <proxy-port>`

### "High costs"
- Enable sleep mode for development
- Monitor usage in Railway dashboard
- Consider running MQTT broker locally (hybrid approach)

## Next Steps

1. **Enable Authentication:** Edit `config/mosquitto.conf` to require username/password
2. **Add TLS/SSL:** Use port 8883 with certificates
3. **Monitor Data:** Query your MySQL database to see logged messages
4. **Scale Up:** Add more resources in Railway settings if needed

## Support

- Full deployment guide: See `RAILWAY_DEPLOYMENT.md`
- Railway docs: [docs.railway.app](https://docs.railway.app)
- Issues: Create an issue in your GitHub repo

---

**🎉 You're done!** Your Meshtastic MQTT logger is now running in the cloud.
