# Meshtastic Monitoring Platform

A complete monorepo solution for monitoring Meshtastic mesh networks with data collection and REST API access.

## 🏗️ Architecture

This project consists of two microservices that work together:

1. **🔄 MQTT Logger** (`/logger`) - Collects mesh network data
2. **🌐 Web API** (`/api`) - Provides authenticated REST API access

```
mqtt-meshtastic/
├── logger/                 # MQTT Logger Service
│   ├── src/                # Source code
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── api/                    # Web API Service
│   ├── app/                # Next.js App Router
│   ├── lib/                # Shared libraries
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── config/                 # Shared configuration
├── data/                   # Data storage
├── log/                    # Log files
├── API_SPECIFICATION.md    # Complete API documentation
└── README.md               # This file
```

## 📊 Services Overview

### MQTT Logger Service

Subscribes to Meshtastic MQTT topics and stores all mesh network events in MySQL.

**Features:**
- ✅ MQTT broker connection with reconnection logic
- ✅ Meshtastic protobuf message parsing
- ✅ **Encrypted message decryption**
- ✅ MySQL database with automatic schema setup
- ✅ Support for 20+ Meshtastic message types
- ✅ Docker & Railway deployment ready

[📖 Logger Documentation](logger/README.md)

### Web API Service

REST API with JWT authentication for accessing collected mesh network data.

**Features:**
- ✅ **17 REST API endpoints** (coordinates, nodes, messages, telemetry, stats)
- ✅ JWT authentication with bcrypt password hashing
- ✅ Rate limiting & CORS support
- ✅ SQL injection prevention
- ✅ Built with Next.js 14 + TypeScript
- ✅ Docker & Railway deployment ready

[📖 API Documentation](api/README.md) | [📋 API Specification](API_SPECIFICATION.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- MQTT Broker (Mosquitto recommended)
- Meshtastic devices publishing to MQTT

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mqtt-meshtastic
   ```

2. **Set up Logger Service:**
   ```bash
   cd logger
   npm install
   cp .env.example .env
   # Edit .env with your MQTT and database credentials
   npm start
   ```

3. **Set up API Service:**
   ```bash
   cd ../api
   npm install
   cp .env.example .env
   # Edit .env with your database and JWT credentials
   npm run dev
   ```

4. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:3000/api/health

   # Login (default: admin/admin)
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'

   # Get coordinates (use token from login)
   curl http://localhost:3000/api/v1/coordinates \
     -H "Authorization: Bearer <your-token>"
   ```

## ☁️ Railway Deployment

Both services can be deployed to Railway with shared MySQL database.

### Deployment Architecture

```
Railway Project
├── MySQL Database (shared)
├── MQTT Broker Service (mosquitto)
├── Logger Service (/logger)
└── API Service (/api)
```

### Step 1: Deploy MySQL Database

1. In Railway, click "+ New" → "Database" → "MySQL"
2. Railway provisions MySQL and creates environment variables

### Step 2: Deploy MQTT Broker (Optional)

If you don't have an external MQTT broker:

1. Click "+ New" → "Empty Service"
2. Use [mosquitto-railway-template](https://github.com/Lima-e-Silva/mosquitto-railway-template)
3. Configure environment variables

### Step 3: Deploy Logger Service

1. Click "+ New" → "GitHub Repo" → Select this repository
2. Set **Root Directory:** `/logger`
3. Add environment variables:
   ```env
   MQTT_BROKER=mqtt://mqtt-broker.railway.internal:1883
   MQTT_USERNAME=<mqtt_user>
   MQTT_PASSWORD=<mqtt_pass>
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}
   MESHTASTIC_ROOT_TOPIC=msh/US/#
   MESHTASTIC_CHANNEL_KEY=<your_channel_key>
   NODE_ENV=production
   ```
4. Deploy

### Step 4: Deploy API Service

1. Click "+ New" → "GitHub Repo" → Select this repository
2. Set **Root Directory:** `/api`
3. Add environment variables:
   ```env
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}
   JWT_SECRET=<generate-secure-64-char-secret>
   JWT_EXPIRES_IN=3600
   CORS_ORIGIN=*
   NODE_ENV=production
   PORT=3000
   ```
4. Deploy
5. Access your API at: `https://your-api-service.railway.app`

### Generate JWT Secret

```bash
openssl rand -base64 64
# Or
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 🔒 Security

### Logger Service
- Encrypted message decryption with channel PSK
- Parameterized SQL queries
- Environment-based configuration

### API Service
- **JWT Authentication** (1-hour expiry)
- **bcrypt password hashing** (12 rounds)
- **Rate limiting** (5 login attempts per 15 min)
- **CORS protection**
- **SQL injection prevention**
- **Token blacklisting** on logout

**Default Credentials:**
- Username: `admin`
- Password: `admin`

⚠️ **Change immediately in production!**

## 📊 Data Flow

```
Meshtastic Devices
    ↓
MQTT Broker
    ↓
Logger Service → MySQL Database
                     ↑
              API Service → Web/Mobile Clients
```

## 🔧 Technology Stack

### Logger Service
- Node.js (ES Modules)
- MQTT.js
- MySQL2 (with connection pooling)
- @meshtastic/protobufs
- Crypto (for message decryption)

### API Service
- Next.js 14 (App Router)
- TypeScript
- MySQL2
- Jose (JWT)
- bcryptjs
- Zod (validation)

## 📖 Documentation

- [Logger Service README](logger/README.md) - MQTT logger setup and configuration
- [API Service README](api/README.md) - REST API usage and deployment
- [API Specification](API_SPECIFICATION.md) - Complete API endpoint documentation

## 🧪 Development

### Running Tests

```bash
# Logger service
cd logger
npm test

# API service
cd api
npm test
```

### Building for Production

```bash
# Logger service
cd logger
npm run build
docker build -t meshtastic-logger .

# API service
cd api
npm run build
docker build -t meshtastic-api .
```

## 📦 Database Schema

### Core Table (Created by Logger)

**`meshtastic_events`** - Stores all mesh network events
- Message data (text, position, telemetry, node info)
- Network metrics (RSSI, SNR, hop count)
- Node information
- Timestamps

### Auth Tables (Created by API)

**`users`** - User authentication
**`token_blacklist`** - JWT token revocation

All tables are created automatically on first run.

## 🐛 Troubleshooting

### Logger Issues
- **No data being logged:** Check MQTT topic matches your network
- **Decryption errors:** Verify channel key from Meshtastic device
- **Database connection:** Ensure MySQL is running and credentials are correct

### API Issues
- **401 Unauthorized:** Token expired or invalid
- **429 Rate Limited:** Wait 15 minutes after failed login attempts
- **500 Server Error:** Check database connection and logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both services
5. Submit a pull request

## 📝 License

ISC

## 🙏 Acknowledgments

- [Meshtastic](https://meshtastic.org/) - Open source mesh networking
- [@meshtastic/protobufs](https://www.npmjs.com/package/@meshtastic/protobufs) - Protocol buffer definitions
- [Next.js](https://nextjs.org/) - React framework
- [Railway](https://railway.app/) - Deployment platform

## 📬 Support

For issues and questions:
- Logger Service: See [logger/README.md](logger/README.md)
- API Service: See [api/README.md](api/README.md)
- API Endpoints: See [API_SPECIFICATION.md](API_SPECIFICATION.md)

---

Built with ❤️ for the Meshtastic community
