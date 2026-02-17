# Meshtastic Web API Specification

## Overview
REST API for accessing Meshtastic mesh network data with JWT-based authentication.

**Base URL**: `http://localhost:3000/api/v1` (configurable)

---

## Authentication

### 1. Login
**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and receive a JWT bearer token.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### 2. Token Refresh
**Endpoint**: `POST /auth/refresh`

**Description**: Refresh an existing JWT token.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

### 3. Logout
**Endpoint**: `POST /auth/logout`

**Description**: Invalidate current token (optional, depends on token blacklist implementation).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Protected Endpoints
**All endpoints below require authentication header:**
```
Authorization: Bearer <token>
```

---

## Location/Position Data

### 4. Get All Coordinates
**Endpoint**: `GET /coordinates`

**Description**: Retrieve position data from all nodes with optional filtering.

**Query Parameters**:
- `nodeId` (optional): Filter by specific node ID
- `fromNode` (optional): Filter by sender node
- `startDate` (optional): ISO 8601 date (e.g., "2024-01-01T00:00:00Z")
- `endDate` (optional): ISO 8601 date
- `limit` (optional, default: 100): Max results
- `offset` (optional, default: 0): Pagination offset

**Example Request**:
```
GET /coordinates?nodeId=123456&limit=50&startDate=2024-01-01T00:00:00Z
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nodeId": "123456",
      "fromNode": "789012",
      "latitude": 45.4642,
      "longitude": 9.1900,
      "altitude": 122,
      "positionTime": 1704067200,
      "rxTime": 1704067205,
      "rxSnr": 8.5,
      "rxRssi": -95,
      "receivedAt": "2024-01-01T00:00:05Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 5. Get Latest Position by Node
**Endpoint**: `GET /coordinates/latest/:nodeId`

**Description**: Get the most recent position for a specific node.

**Path Parameters**:
- `nodeId`: Node identifier

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nodeId": "123456",
    "fromNode": "789012",
    "latitude": 45.4642,
    "longitude": 9.1900,
    "altitude": 122,
    "positionTime": 1704067200,
    "receivedAt": "2024-01-01T00:00:05Z"
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "No position data found for node"
}
```

---

### 6. Get Coordinate History
**Endpoint**: `GET /coordinates/history/:nodeId`

**Description**: Get position history/track for a specific node.

**Path Parameters**:
- `nodeId`: Node identifier

**Query Parameters**:
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `limit` (optional, default: 100): Max results

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "nodeId": "123456",
    "track": [
      {
        "latitude": 45.4642,
        "longitude": 9.1900,
        "altitude": 122,
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "latitude": 45.4650,
        "longitude": 9.1910,
        "altitude": 125,
        "timestamp": "2024-01-01T00:05:00Z"
      }
    ]
  }
}
```

---

## Node Information

### 7. Get All Nodes
**Endpoint**: `GET /nodes`

**Description**: List all known nodes in the mesh network.

**Query Parameters**:
- `active` (optional): Boolean, filter by active nodes (received data in last 24h)
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "nodeId": "123456",
      "longName": "Node Alpha",
      "shortName": "ALPH",
      "macAddress": "aa:bb:cc:dd:ee:ff",
      "lastSeen": "2024-01-01T00:00:05Z",
      "messageCount": 42,
      "hasPosition": true
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 100,
    "offset": 0
  }
}
```

---

### 8. Get Node Details
**Endpoint**: `GET /nodes/:nodeId`

**Description**: Get detailed information about a specific node.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "nodeId": "123456",
    "longName": "Node Alpha",
    "shortName": "ALPH",
    "macAddress": "aa:bb:cc:dd:ee:ff",
    "lastSeen": "2024-01-01T00:00:05Z",
    "firstSeen": "2023-12-01T00:00:00Z",
    "messageCount": 42,
    "stats": {
      "totalMessages": 42,
      "textMessages": 10,
      "positionUpdates": 20,
      "telemetryReports": 12
    },
    "lastPosition": {
      "latitude": 45.4642,
      "longitude": 9.1900,
      "altitude": 122,
      "timestamp": "2024-01-01T00:00:00Z"
    },
    "lastTelemetry": {
      "batteryLevel": 85,
      "voltage": 4.1,
      "channelUtilization": 12.5,
      "airUtilTx": 0.5,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

## Messages

### 9. Get Messages
**Endpoint**: `GET /messages`

**Description**: Retrieve text messages from the mesh network.

**Query Parameters**:
- `nodeId` (optional): Filter by node ID
- `fromNode` (optional): Filter by sender
- `toNode` (optional): Filter by recipient
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fromNode": "123456",
      "toNode": "789012",
      "messageText": "Hello mesh!",
      "channel": 0,
      "rxTime": 1704067200,
      "rxSnr": 8.5,
      "rxRssi": -95,
      "receivedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 100,
    "offset": 0
  }
}
```

---

## Telemetry

### 10. Get Telemetry Data
**Endpoint**: `GET /telemetry`

**Description**: Retrieve telemetry data (device metrics, environment, air quality).

**Query Parameters**:
- `nodeId` (optional): Filter by node ID
- `type` (optional): "device" | "environment" | "airquality"
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nodeId": "123456",
      "fromNode": "123456",
      "deviceMetrics": {
        "batteryLevel": 85,
        "voltage": 4.1,
        "channelUtilization": 12.5,
        "airUtilTx": 0.5
      },
      "environmentMetrics": {
        "temperature": 22.5,
        "relativeHumidity": 65.0,
        "barometricPressure": 1013.25
      },
      "airQualityMetrics": null,
      "receivedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 100,
    "offset": 0
  }
}
```

---

### 11. Get Latest Telemetry by Node
**Endpoint**: `GET /telemetry/latest/:nodeId`

**Description**: Get the most recent telemetry data for a node.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "nodeId": "123456",
    "deviceMetrics": {
      "batteryLevel": 85,
      "voltage": 4.1,
      "channelUtilization": 12.5,
      "airUtilTx": 0.5
    },
    "environmentMetrics": {
      "temperature": 22.5,
      "relativeHumidity": 65.0,
      "barometricPressure": 1013.25
    },
    "receivedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Statistics

### 12. Get Network Statistics
**Endpoint**: `GET /stats/network`

**Description**: Get overall mesh network statistics.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalNodes": 10,
    "activeNodes": 7,
    "totalMessages": 1542,
    "messagesLast24h": 150,
    "averageRssi": -95.5,
    "averageSnr": 8.2,
    "coverage": {
      "minLatitude": 45.4000,
      "maxLatitude": 45.5000,
      "minLongitude": 9.1000,
      "maxLongitude": 9.2000
    }
  }
}
```

---

### 13. Get Node Statistics
**Endpoint**: `GET /stats/node/:nodeId`

**Description**: Get statistics for a specific node.

**Query Parameters**:
- `period` (optional): "24h" | "7d" | "30d" (default: "24h")

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "nodeId": "123456",
    "period": "24h",
    "messagesSent": 25,
    "messagesReceived": 30,
    "averageRssi": -92.3,
    "averageSnr": 9.1,
    "batteryTrend": "decreasing",
    "distanceTraveled": 5.2
  }
}
```

---

## Events (Real-time)

### 14. Get Recent Events
**Endpoint**: `GET /events/recent`

**Description**: Get most recent events across all message types.

**Query Parameters**:
- `limit` (optional, default: 50): Max results

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "TEXT_MESSAGE_APP",
      "fromNode": "123456",
      "toNode": "789012",
      "summary": "Message: Hello mesh!",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "type": "POSITION_APP",
      "fromNode": "789012",
      "summary": "Position update: 45.4642, 9.1900",
      "timestamp": "2024-01-01T00:00:05Z"
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Implementation Notes

### Technology Stack Recommendations:
- **Framework**: Express.js or Fastify
- **Authentication**: JWT (jsonwebtoken library)
- **Database**: Reuse existing MySQL connection
- **Password Hashing**: bcrypt
- **Validation**: express-validator or zod
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware

### Security Considerations:
1. Store user credentials hashed with bcrypt (rounds: 12)
2. JWT secret should be strong and stored in environment variables
3. Token expiration: 1 hour (refresh tokens: 7 days)
4. Implement rate limiting on login endpoint (max 5 attempts per 15 min)
5. Use HTTPS in production
6. Implement CORS properly
7. Sanitize all user inputs
8. Consider implementing API key authentication for service-to-service calls

### Database Schema Additions:
```sql
-- Users table for authentication
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  active BOOLEAN DEFAULT TRUE,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Token blacklist (optional, for logout functionality)
CREATE TABLE token_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Environment Variables:
```env
# API Server
API_PORT=3000
API_HOST=0.0.0.0
NODE_ENV=production

# JWT Configuration
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# CORS
CORS_ORIGIN=https://yourdomain.com
```
