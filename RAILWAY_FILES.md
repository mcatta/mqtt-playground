# Railway Deployment Files Reference

This document lists all files related to Railway deployment and their purposes.

---

## 📁 Root Level Files

### Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| `railway.template.json` | Template for Railway project setup (reference) | ❌ |

### Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| `RAILWAY_QUICK_START.md` | **5-minute deployment guide** | First-time deployers |
| `RAILWAY_DEPLOYMENT.md` | **Complete deployment guide with troubleshooting** | All users |
| `DEPLOYMENT_CHECKLIST.md` | **Step-by-step verification checklist** | During deployment |
| `RAILWAY_FILES.md` | This file - explains all deployment files | Reference |

---

## 📁 Logger Service Files (`/logger`)

### Build Configuration

| File | Purpose | Priority |
|------|---------|----------|
| `Dockerfile` | Docker container definition | ✅ Primary |
| `nixpacks.toml` | Nixpacks build configuration (Railway preferred) | ⭐ Alternative |
| `railway.json` | Railway service configuration | ✅ Required |
| `.dockerignore` | Files to exclude from Docker build | ✅ Important |

### Environment Configuration

| File | Purpose |
|------|---------|
| `.env.example` | Example environment variables |

### Logger Service Structure
```
logger/
├── src/                    # Source code
│   └── index.js           # Main application
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker build instructions
├── nixpacks.toml          # Nixpacks configuration
├── railway.json           # Railway service config
├── .dockerignore          # Docker build exclusions
├── .env.example           # Environment variable template
└── README.md              # Logger documentation
```

---

## 📁 API Service Files (`/api`)

### Build Configuration

| File | Purpose | Priority |
|------|---------|----------|
| `Dockerfile` | Docker container definition | ✅ Primary |
| `nixpacks.toml` | Nixpacks build configuration (Railway preferred) | ⭐ Alternative |
| `railway.json` | Railway service configuration | ✅ Required |
| `.dockerignore` | Files to exclude from Docker build | ✅ Important |
| `next.config.js` | Next.js configuration (includes standalone output) | ✅ Required |

### Environment Configuration

| File | Purpose |
|------|---------|
| `.env.example` | Example environment variables |

### API Service Structure
```
api/
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   └── ...
├── lib/                   # Shared libraries
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js config (standalone mode)
├── Dockerfile             # Docker build instructions
├── nixpacks.toml          # Nixpacks configuration
├── railway.json           # Railway service config
├── .dockerignore          # Docker build exclusions
├── .env.example           # Environment variable template
└── README.md              # API documentation
```

---

## 🔧 Build Methods

Railway supports two build methods. You can use either:

### Option 1: Dockerfile (Current Default)

**Configured via:**
- `logger/Dockerfile`
- `api/Dockerfile`
- `logger/railway.json` (builder: DOCKERFILE)
- `api/railway.json` (builder: DOCKERFILE)

**Pros:**
- ✅ Full control over build process
- ✅ Consistent across platforms
- ✅ Well-documented

**Cons:**
- ⚠️ Larger image size
- ⚠️ Longer build times

### Option 2: Nixpacks (Railway Preferred)

**Configured via:**
- `logger/nixpacks.toml`
- `api/nixpacks.toml`

**To switch to Nixpacks:**
1. In Railway service settings
2. Go to **Build** section
3. Change builder from `DOCKERFILE` to `NIXPACKS`
4. Redeploy

**Pros:**
- ✅ Faster builds
- ✅ Smaller images
- ✅ Railway-optimized
- ✅ Automatic dependency detection

**Cons:**
- ⚠️ Less control
- ⚠️ Railway-specific

---

## 📝 Key Configuration Details

### Logger Service (`railway.json`)
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "healthcheck": {
    "type": "PROCESS"
  }
}
```

### API Service (`railway.json`)
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30
  }
}
```

### Next.js Configuration (`api/next.config.js`)
```javascript
{
  output: 'standalone',  // ✅ Required for Docker deployment
  reactStrictMode: true
}
```

---

## 🚦 Deployment Workflow

### Initial Deployment

1. **Read:** `RAILWAY_QUICK_START.md` (5-minute guide)
2. **Deploy:** Follow steps in the quick start
3. **Verify:** Use `DEPLOYMENT_CHECKLIST.md`
4. **Troubleshoot:** Refer to `RAILWAY_DEPLOYMENT.md` if needed

### Updating Deployment

1. Push changes to GitHub
2. Railway automatically detects changes
3. Rebuilds and redeploys affected services
4. Check logs for successful deployment

### Changing Build Method

**From Dockerfile to Nixpacks:**
1. In Railway dashboard → Service settings
2. Build section → Change builder to `NIXPACKS`
3. Redeploy (uses `nixpacks.toml`)

**From Nixpacks to Dockerfile:**
1. In Railway dashboard → Service settings
2. Build section → Change builder to `DOCKERFILE`
3. Redeploy (uses `Dockerfile`)

---

## 📦 Environment Variables

### Required for Logger
```env
MQTT_BROKER               # MQTT broker URL
DB_HOST                   # Reference: ${{MySQL.MYSQLHOST}}
DB_PORT                   # Reference: ${{MySQL.MYSQLPORT}}
DB_USER                   # Reference: ${{MySQL.MYSQLUSER}}
DB_PASSWORD               # Reference: ${{MySQL.MYSQLPASSWORD}}
DB_DATABASE               # Reference: ${{MySQL.MYSQLDATABASE}}
MESHTASTIC_ROOT_TOPIC     # MQTT topic to monitor
```

### Required for API
```env
DB_HOST                   # Reference: ${{MySQL.MYSQLHOST}}
DB_PORT                   # Reference: ${{MySQL.MYSQLPORT}}
DB_USER                   # Reference: ${{MySQL.MYSQLUSER}}
DB_PASSWORD               # Reference: ${{MySQL.MYSQLPASSWORD}}
DB_DATABASE               # Reference: ${{MySQL.MYSQLDATABASE}}
JWT_SECRET                # Secure random string (min 32 chars)
```

### Optional Variables
See `.env.example` files in each service directory.

---

## 🔍 File Purposes at a Glance

| File Type | Purpose | Edit Frequency |
|-----------|---------|----------------|
| `Dockerfile` | Define container build process | Rarely |
| `nixpacks.toml` | Define Nixpacks build process | Rarely |
| `railway.json` | Railway service configuration | Rarely |
| `.dockerignore` | Exclude files from Docker build | Rarely |
| `.env.example` | Document required env vars | When adding features |
| `package.json` | Define dependencies and scripts | When adding dependencies |
| `next.config.js` | Configure Next.js (API only) | Rarely |

---

## 🆘 Quick Reference

| Need to... | See this file |
|------------|---------------|
| Deploy quickly | `RAILWAY_QUICK_START.md` |
| Understand full process | `RAILWAY_DEPLOYMENT.md` |
| Verify deployment | `DEPLOYMENT_CHECKLIST.md` |
| Troubleshoot issues | `RAILWAY_DEPLOYMENT.md` (Troubleshooting section) |
| Understand project | `README.md` |
| Learn API endpoints | `API_SPECIFICATION.md` |
| Configure logger | `logger/README.md` |
| Configure API | `api/README.md` |

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Reviewed `RAILWAY_QUICK_START.md`
- [ ] Railway account created
- [ ] GitHub repository accessible
- [ ] MQTT broker URL available
- [ ] All required files present (see lists above)

---

## 🎯 Recommended Reading Order

1. **First time deploying:**
   1. `RAILWAY_QUICK_START.md` - Get it running
   2. `DEPLOYMENT_CHECKLIST.md` - Verify it works
   3. `RAILWAY_DEPLOYMENT.md` - Understand details

2. **Troubleshooting:**
   1. `RAILWAY_DEPLOYMENT.md` (Troubleshooting section)
   2. Service logs in Railway dashboard
   3. `README.md` (Project architecture)

3. **Understanding the project:**
   1. `README.md` - Overview
   2. `logger/README.md` - Logger details
   3. `api/README.md` - API details
   4. `API_SPECIFICATION.md` - Endpoints

---

**All files are designed to work together to provide a smooth Railway deployment experience!**

For questions or issues, refer to the specific documentation file listed above.
