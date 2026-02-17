# Meshtastic API

REST API service for accessing Meshtastic mesh network data with JWT authentication.

## Features

- 🔐 **JWT Authentication** with bcrypt password hashing
- 📊 **17 REST API Endpoints** for coordinates, nodes, messages, telemetry, statistics
- 🚀 **Next.js 14** with TypeScript and App Router
- 🗄️ **MySQL Database** connection with query pooling
- 🔒 **Security Features**: Rate limiting, CORS, SQL injection prevention
- 🐳 **Docker Support** for easy deployment
- ☁️ **Railway Ready** with health checks

## API Endpoints

### Authentication (No auth required)
- `POST /api/v1/auth/login` - Login with username/password
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout and blacklist token

### Coordinates (Auth required)
- `GET /api/v1/coordinates` - Get all coordinates with filtering
- `GET /api/v1/coordinates/latest/:nodeId` - Get latest position for node
- `GET /api/v1/coordinates/history/:nodeId` - Get position history/track

### Nodes (Auth required)
- `GET /api/v1/nodes` - List all nodes
- `GET /api/v1/nodes/:nodeId` - Get detailed node information

### Messages (Auth required)
- `GET /api/v1/messages` - Get text messages with filtering

### Telemetry (Auth required)
- `GET /api/v1/telemetry` - Get telemetry data
- `GET /api/v1/telemetry/latest/:nodeId` - Get latest telemetry for node

### Statistics (Auth required)
- `GET /api/v1/stats/network` - Get network-wide statistics
- `GET /api/v1/stats/node/:nodeId` - Get per-node statistics

### Events (Auth required)
- `GET /api/v1/events/recent` - Get recent events across all types

### Health Check (No auth required)
- `GET /api/health` - Health check endpoint

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   Edit `.env` with your database credentials and JWT secret.

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:3000/api/health

   # Login
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'

   # Use the returned token for authenticated requests
   curl http://localhost:3000/api/v1/coordinates \
     -H "Authorization: Bearer <your-token>"
   ```

## Railway Deployment

### Prerequisites
- Railway account
- Existing MySQL database service on Railway (from mqtt-meshtastic project)

### Deployment Steps

1. **Create new Railway service:**
   - In your Railway project, click "+ New"
   - Select "GitHub Repo"
   - Choose this repository

2. **Configure environment variables:**
   ```env
   # Database (reference existing MySQL service)
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}

   # JWT (generate a secure random secret)
   JWT_SECRET=<use-railway-generator-or-openssl-rand-base64-64>
   JWT_EXPIRES_IN=3600
   JWT_REFRESH_EXPIRES_IN=604800

   # CORS
   CORS_ORIGIN=*

   # Node
   NODE_ENV=production
   PORT=3000
   ```

3. **Deploy:**
   Railway will automatically detect the Dockerfile and deploy your service.

4. **Verify deployment:**
   ```bash
   curl https://your-railway-domain.railway.app/api/health
   ```

### Generate JWT Secret

```bash
# macOS/Linux
openssl rand -base64 64

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Authentication

### Default Credentials
- **Username:** `admin`
- **Password:** `admin`

⚠️ **IMPORTANT:** Change the default password immediately after first login!

### Using JWT Tokens

1. **Login to get token:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'
   ```

2. **Use token in requests:**
   ```bash
   curl http://localhost:3000/api/v1/nodes \
     -H "Authorization: Bearer <your-token>"
   ```

3. **Token expires after 1 hour.** Use refresh endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/refresh \
     -H "Authorization: Bearer <your-token>"
   ```

## API Query Parameters

### Filtering & Pagination

Most endpoints support these query parameters:

- `limit` - Max results (1-1000, default: 100)
- `offset` - Pagination offset (default: 0)
- `startDate` - ISO 8601 date (e.g., "2024-01-01T00:00:00Z")
- `endDate` - ISO 8601 date
- `nodeId` - Filter by node ID
- `fromNode` - Filter by sender node

### Examples

```bash
# Get coordinates with pagination
curl "http://localhost:3000/api/v1/coordinates?limit=50&offset=0" \
  -H "Authorization: Bearer <token>"

# Get messages from specific node
curl "http://localhost:3000/api/v1/messages?fromNode=123456" \
  -H "Authorization: Bearer <token>"

# Get telemetry for date range
curl "http://localhost:3000/api/v1/telemetry?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

## Security Features

### Rate Limiting
- Login endpoint: 5 attempts per 15 minutes per IP
- Automatic cleanup of rate limit records

### Password Security
- bcrypt hashing with 12 rounds
- Minimum 8 character password requirement

### Token Security
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Token blacklisting on logout
- Secure secret key storage

### Database Security
- Parameterized queries (SQL injection prevention)
- Connection pooling with limits
- Input validation with Zod schemas

## Database Schema

The API uses the existing `meshtastic_events` table from the MQTT logger and adds:

### `users` Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  active BOOLEAN DEFAULT TRUE
);
```

### `token_blacklist` Table
```sql
CREATE TABLE token_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

Tables are created automatically on first API request.

## Development

### Project Structure
```
api/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── v1/             # API version 1
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── coordinates/# Location endpoints
│   │   │   ├── nodes/      # Node endpoints
│   │   │   ├── messages/   # Message endpoints
│   │   │   ├── telemetry/  # Telemetry endpoints
│   │   │   ├── stats/      # Statistics endpoints
│   │   │   └── events/     # Events endpoints
│   │   └── health/         # Health check
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── lib/                    # Shared libraries
│   ├── auth/               # Authentication logic
│   ├── db/                 # Database connection & queries
│   ├── utils/              # Utilities
│   ├── validation/         # Zod schemas
│   └── types/              # TypeScript types
├── middleware.ts           # CORS & rate limiting
├── next.config.js          # Next.js configuration
├── Dockerfile              # Docker configuration
├── railway.json            # Railway deployment config
└── package.json            # Dependencies
```

### Adding New Endpoints

1. Create route file in `app/api/v1/your-endpoint/route.ts`
2. Add validation schema in `lib/validation/schemas.ts`
3. Add query function in `lib/db/queries.ts`
4. Use `requireAuth()` for protected endpoints
5. Return standardized responses with `successResponse()` / `errorResponse()`

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Issues
- Verify environment variables are correct
- Check MySQL service is running
- Ensure firewall allows connection on port 3306

### Authentication Errors
- Verify JWT_SECRET is set and consistent
- Check token hasn't expired (1 hour lifetime)
- Ensure Authorization header format: `Bearer <token>`

### Rate Limiting
- Wait 15 minutes after 5 failed login attempts
- Check client IP is being correctly identified

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs
- Database connection: `[DB]` prefix
- Authentication: `[Auth]` prefix
- API errors: `[API]` prefix

## License

ISC

## Support

For full API specification, see `/API_SPECIFICATION.md` in the repository root.
