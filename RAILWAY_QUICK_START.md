# Railway Quick Start Guide

⚡ **Fast-track your deployment** - Get your Meshtastic Monitoring Platform running on Railway in minutes.

---

## 🚀 5-Minute Deployment

### Step 1: Setup Railway Project (1 min)

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"** → Select this repository

### Step 2: Add MySQL (30 sec)

1. Click **"+ New"** → **"Database"** → **"Add MySQL"**
2. Wait for provisioning (Railway auto-creates credentials)

### Step 3: Deploy Logger (2 min)

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. **Settings** → **Root Directory** → Enter `/logger`
3. **Variables** tab → Add these:

```env
MQTT_BROKER=mqtt://mqtt.meshtastic.org:1883
MESHTASTIC_ROOT_TOPIC=msh/US/#
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
NODE_ENV=production
```

4. Click **"Deploy"**

### Step 4: Deploy API (2 min)

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo (again)
2. **Settings** → **Root Directory** → Enter `/api`
3. **Variables** tab → Add these:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=YOUR_SECURE_SECRET_HERE_MIN_32_CHARS
CORS_ORIGIN=*
NODE_ENV=production
PORT=3000
```

**Generate JWT Secret:**
```bash
openssl rand -base64 64
```

4. Click **"Deploy"**
5. **Networking** → **"Generate Domain"** (get your public URL)

---

## ✅ Verify Deployment (30 sec)

Replace `YOUR_API_URL` with your Railway-generated domain:

```bash
# Health check
curl https://YOUR_API_URL/api/health

# Expected: {"status":"healthy","database":"connected"}
```

```bash
# Login
curl -X POST https://YOUR_API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Expected: {"token":"eyJ...","expiresIn":3600}
```

---

## 🎯 Common Configurations

### Using Public MQTT Broker
```env
MQTT_BROKER=mqtt://mqtt.meshtastic.org:1883
MESHTASTIC_ROOT_TOPIC=msh/US/#
```

### Using Private MQTT Broker with Auth
```env
MQTT_BROKER=mqtt://your-broker.com:1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MESHTASTIC_ROOT_TOPIC=msh/US/#
```

### With Encrypted Messages
```env
MESHTASTIC_CHANNEL_KEY=AQ==
```
Get this from: Meshtastic App → Channels → Long press → View details

### Different Region
```env
MESHTASTIC_ROOT_TOPIC=msh/EU/#  # Europe
MESHTASTIC_ROOT_TOPIC=msh/ANZ/# # Australia/New Zealand
```

---

## 🔧 Troubleshooting

### ❌ Logger shows "Cannot connect to MQTT"
**Fix:** Verify `MQTT_BROKER` URL and credentials

### ❌ API returns 500 errors
**Fix:** Check database variables reference `${{MySQL.VARIABLE}}`

### ❌ Login fails with 401
**Fix:** Ensure `JWT_SECRET` is set (minimum 32 characters)

### ❌ No data in database
**Fix:**
1. Check Logger logs for "Connected to MQTT broker"
2. Verify `MESHTASTIC_ROOT_TOPIC` matches your network
3. Ensure Meshtastic devices are publishing to MQTT

---

## 📚 Next Steps

✅ **Change default password** (default: admin/admin)
✅ **Set up custom domain** (optional)
✅ **Configure CORS** for production
✅ **Review security settings**

---

## 📖 Full Documentation

- **Comprehensive Guide:** [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **API Documentation:** [API_SPECIFICATION.md](./API_SPECIFICATION.md)
- **Project Overview:** [README.md](./README.md)

---

## 💡 Pro Tips

1. **Service Order:** Always deploy MySQL first, then Logger, then API
2. **Variable References:** Use `${{MySQL.VARIABLE}}` to reference database credentials
3. **Logs:** Check service logs in Railway dashboard for debugging
4. **Free Tier:** ~200-300 hours/month of execution (enough for small deployments)
5. **Auto-Deploy:** Push to GitHub → Railway auto-deploys changes

---

**🎉 That's it! Your Meshtastic monitoring platform is live!**

Test your deployment: `https://YOUR_API_URL/api/health`
