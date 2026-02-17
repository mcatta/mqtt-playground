# Meshtastic MQTT Logger

Node.js service that subscribes to Meshtastic MQTT topics and logs events to a MySQL/MariaDB database.

## Features

- Connects to MQTT broker (Mosquitto)
- Subscribes to Meshtastic topics with wildcard support
- Parses Meshtastic protobuf message payloads
- **Decrypts encrypted messages** with channel PSK
- Stores events in MySQL/MariaDB database
- Automatic database schema initialization
- Graceful shutdown handling
- Reconnection logic for both MQTT and database

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
   Edit `.env` with your MQTT broker and database credentials.

4. **Run the logger:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

```env
# MQTT Broker Configuration
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=admin
MQTT_CLIENT_ID=meshtastic-logger

# Meshtastic Topic
MESHTASTIC_ROOT_TOPIC=msh/US/#

# Meshtastic Channel Encryption Key (optional)
# Get this from your Meshtastic device's channel settings
# Format: base64 (e.g., "AQ==") or hex
MESHTASTIC_CHANNEL_KEY=

# TLS/PSK Configuration (optional - for MQTT transport encryption)
MQTT_USE_TLS=false
MQTT_PSK_KEY=
MQTT_PSK_IDENTITY=

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=meshtastic
DB_PASSWORD=meshtastic
DB_DATABASE=meshtastic
```

## Database Schema

The logger automatically creates the `meshtastic_events` table:

```sql
CREATE TABLE meshtastic_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  payload TEXT,
  parsed_data JSON,
  node_id VARCHAR(50),
  from_node VARCHAR(50),
  to_node VARCHAR(50),
  channel INT,
  packet_id BIGINT,
  hop_limit INT,
  want_ack BOOLEAN,
  rx_time BIGINT,
  rx_snr FLOAT,
  rx_rssi INT,
  hop_start INT,
  message_type VARCHAR(50),
  portnum_type VARCHAR(50),
  message_text TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  altitude INT,
  position_time BIGINT,
  node_info_id VARCHAR(255),
  long_name VARCHAR(255),
  short_name VARCHAR(50),
  mac_address VARCHAR(50),
  device_metrics JSON,
  environment_metrics JSON,
  air_quality_metrics JSON,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_topic (topic),
  INDEX idx_node_id (node_id),
  INDEX idx_from_node (from_node),
  INDEX idx_received_at (received_at),
  INDEX idx_portnum_type (portnum_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Supported Message Types

The logger parses and stores:

- **TEXT_MESSAGE_APP** - Text messages
- **POSITION_APP** - GPS coordinates (latitude, longitude, altitude)
- **NODEINFO_APP** - Node information (name, MAC address)
- **TELEMETRY_APP** - Device metrics, environment sensors, air quality
- **ROUTING_APP** - Routing information
- Plus 15+ other Meshtastic message types

## Message Decryption

If your Meshtastic channel is encrypted, set the `MESHTASTIC_CHANNEL_KEY` environment variable:

1. Get your channel PSK from your Meshtastic device
2. Set it in `.env` (base64 or hex format)
3. The logger will automatically decrypt messages

**Note:** `MQTT_PSK_KEY` is for MQTT transport encryption (broker level), while `MESHTASTIC_CHANNEL_KEY` is for Meshtastic message-level encryption (application level).

## Railway Deployment

### Prerequisites
- Railway account
- MySQL database service on Railway

### Deployment Steps

1. **Create new Railway service:**
   - In Railway project, click "+ New" → "GitHub Repo"
   - Select this repository
   - Set root directory to `/logger`

2. **Configure environment variables:**
   ```env
   # MQTT Broker
   MQTT_BROKER=mqtt://mqtt-broker.railway.internal:1883
   MQTT_USERNAME=<mqtt_user>
   MQTT_PASSWORD=<mqtt_pass>
   MQTT_CLIENT_ID=meshtastic-logger

   # Database (reference existing MySQL service)
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}

   # Meshtastic
   MESHTASTIC_ROOT_TOPIC=msh/US/#
   MESHTASTIC_CHANNEL_KEY=<your_channel_key>

   # Environment
   NODE_ENV=production
   ```

3. **Deploy:**
   Railway will auto-detect the Dockerfile and deploy.

## Docker Deployment

### Build and run locally:

```bash
# Build image
docker build -t meshtastic-logger .

# Run container
docker run -d \
  --name meshtastic-logger \
  --env-file .env \
  meshtastic-logger
```

### Docker Compose (with MySQL):

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: meshtastic
      MYSQL_USER: meshtastic
      MYSQL_PASSWORD: meshtastic
    volumes:
      - mysql_data:/var/lib/mysql

  logger:
    build: .
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: meshtastic
      DB_PASSWORD: meshtastic
      DB_DATABASE: meshtastic
      MQTT_BROKER: mqtt://mosquitto:1883
      MESHTASTIC_ROOT_TOPIC: msh/US/#

volumes:
  mysql_data:
```

## Troubleshooting

### Connection Issues

**MQTT Connection Failed:**
- Verify broker URL and credentials
- Check firewall allows connection
- Ensure broker is running

**Database Connection Failed:**
- Verify database credentials
- Ensure MySQL service is running
- Check network connectivity

### Message Decryption Issues

**Encrypted messages not decrypting:**
- Verify channel key is correct (from Meshtastic device)
- Check key format (base64 or hex)
- Ensure key matches the channel encryption

### No Data Being Logged

- Check MQTT topic matches your network (e.g., `msh/US/#`)
- Verify Meshtastic devices are publishing to MQTT
- Check logger logs for parsing errors

## Monitoring

The logger outputs detailed logs:

```
Starting Meshtastic MQTT Logger...
Database connection pool created
Successfully connected to database
Database schema initialized
Connected to MQTT broker: mqtt://localhost:1883
Subscribed to topic: msh/US/#

Received message on topic: msh/US/2/json/node1/!abcd1234
Message size: 256 bytes
Decoded ServiceEnvelope successfully
Packet from: abcd1234, to: ffffffff
Payload type: decoded
Event stored with ID: 1
```

## Dependencies

- **@meshtastic/protobufs** - Meshtastic protocol buffers
- **mqtt** - MQTT client
- **mysql2** - MySQL database driver
- **dotenv** - Environment configuration

## Related Services

This logger is part of a monorepo:
- **Logger Service** (this service) - Collects and stores data
- **API Service** (`/api`) - Provides REST API to access the data

See the [API documentation](../api/README.md) for accessing the logged data via REST API.

## License

ISC
