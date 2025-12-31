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

## Prerequisites

### Option 1: Docker (Recommended)
- Docker and Docker Compose installed
- Meshtastic device publishing to MQTT

### Option 2: Local Installation
- Node.js (v18 or higher recommended)
- MySQL or MariaDB database server
- MQTT broker (Mosquitto) running locally or remotely
- Meshtastic device publishing to MQTT

## Installation

### Option 1: Docker Compose (Recommended)

This will start all services (Mosquitto MQTT broker, MySQL database, and the logger app) in containers.

1. Navigate to the project directory:
```bash
cd mqtt-mesthtastic
```

2. Create a `.env` file by copying the example:
```bash
cp .env.example .env
```

3. Edit `.env` if needed (defaults are already configured for Docker):
```env
# MQTT Broker Configuration
MQTT_BROKER=mqtt://mqtt:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=meshtastic-logger

# Meshtastic Topic Configuration
MESHTASTIC_ROOT_TOPIC=msh/US/#

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=meshtastic
DB_PASSWORD=meshtastic
DB_DATABASE=meshtastic
```

4. Start all services:
```bash
docker-compose up -d
```

5. View logs:
```bash
docker-compose logs -f meshtastic-logger
```

6. Stop all services:
```bash
docker-compose down
```

### Option 2: Local Installation

1. Navigate to the project directory:
```bash
cd mqtt-mesthtastic
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file by copying the example:
```bash
cp .env.example .env
```

4. Edit `.env` with your local configuration:
```env
# MQTT Broker Configuration
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=meshtastic-logger

# Meshtastic Topic Configuration
MESHTASTIC_ROOT_TOPIC=msh/US/#

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=meshtastic
```

## Configuration

### MQTT Settings

- `MQTT_BROKER`: MQTT broker URL (e.g., `mqtt://localhost:1883`)
- `MQTT_USERNAME`: Optional username for authentication
- `MQTT_PASSWORD`: Optional password for authentication
- `MQTT_CLIENT_ID`: Unique client identifier
- `MESHTASTIC_ROOT_TOPIC`: Topic pattern to subscribe to (supports wildcards like `#` and `+`)

### Database Settings

- `DB_HOST`: Database host
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name (will be created if it doesn't exist)

## Database Schema

The application automatically creates a `meshtastic_events` table with the following fields:

- `id`: Auto-incrementing primary key
- `topic`: MQTT topic where the message was received
- `payload`: Raw message payload
- `parsed_data`: JSON-parsed message data
- `node_id`: Meshtastic node identifier
- `from_node`: Sender node ID
- `to_node`: Recipient node ID
- `channel`: Channel number
- `packet_id`: Packet identifier
- `hop_limit`: Maximum hops allowed
- `want_ack`: Whether acknowledgment is requested
- `rx_time`: Reception timestamp
- `rx_snr`: Signal-to-noise ratio
- `rx_rssi`: Received signal strength indicator
- `hop_start`: Starting hop count
- `message_type`: Type of message (e.g., TEXT_MESSAGE_APP)
- `message_text`: Text content of the message
- `received_at`: Timestamp when logged to database

## Usage

### Docker

Start all services:
```bash
docker-compose up -d
```

View real-time logs:
```bash
docker-compose logs -f meshtastic-logger
```

Stop all services:
```bash
docker-compose down
```

Rebuild after code changes:
```bash
docker-compose up -d --build
```

### Local Installation

Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### What the Application Does

The application will:
1. Connect to the database and initialize the schema
2. Connect to the MQTT broker
3. Subscribe to the configured Meshtastic topics
4. Log all received messages to the console
5. Store events in the database

Press `Ctrl+C` to stop the application gracefully.

## Meshtastic Topic Patterns

Common Meshtastic MQTT topic patterns:

- `msh/US/#` - All messages from US region
- `msh/EU/#` - All messages from EU region
- `msh/+/2/json/+` - All JSON messages from channel 2
- `msh/+/+/json/+` - All JSON messages from all regions and channels

## Database Queries

Example queries to analyze logged data:

```sql
-- Get all messages from the last hour
SELECT * FROM meshtastic_events
WHERE received_at > NOW() - INTERVAL 1 HOUR
ORDER BY received_at DESC;

-- Count messages by node
SELECT from_node, COUNT(*) as message_count
FROM meshtastic_events
GROUP BY from_node
ORDER BY message_count DESC;

-- Get text messages
SELECT from_node, message_text, received_at
FROM meshtastic_events
WHERE message_text IS NOT NULL
ORDER BY received_at DESC;

-- Get signal quality statistics
SELECT
  from_node,
  AVG(rx_snr) as avg_snr,
  AVG(rx_rssi) as avg_rssi,
  COUNT(*) as message_count
FROM meshtastic_events
WHERE rx_snr IS NOT NULL
GROUP BY from_node;
```

## Docker Services

The docker-compose setup includes three services:

1. **mqtt** (Mosquitto MQTT Broker)
   - Port 1883: MQTT protocol
   - Port 9001: WebSockets (optional)
   - Volumes: `./config`, `./data`, `./log`

2. **mysql** (MySQL 8.0 Database)
   - Port 3306: MySQL protocol
   - Volume: `mysql_data` (persistent storage)
   - Healthcheck enabled

3. **meshtastic-logger** (Node.js Application)
   - Built from local Dockerfile
   - Depends on mysql and mqtt services
   - Auto-restarts on failure

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs for specific service
docker-compose logs mqtt
docker-compose logs mysql
docker-compose logs meshtastic-logger

# Restart specific service
docker-compose restart meshtastic-logger
```

**Database connection refused:**
```bash
# Wait for MySQL to be fully ready (can take 30-60 seconds on first start)
docker-compose logs mysql | grep "ready for connections"
```

**Reset everything:**
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

### Local Installation Issues

**Cannot connect to database:**
- Verify MySQL/MariaDB is running
- Check database credentials in `.env`
- Ensure the database exists or the user has permission to create it

**Cannot connect to MQTT broker:**
- Verify Mosquitto is running: `systemctl status mosquitto` (Linux)
- Check broker address and port in `.env`
- Verify username/password if authentication is enabled

### General Issues

**No messages received:**
- Verify Meshtastic device is configured to publish to MQTT
- Check topic pattern matches your Meshtastic configuration
- Monitor MQTT broker:
  - Docker: `docker-compose exec mqtt mosquitto_sub -t 'msh/#' -v`
  - Local: `mosquitto_sub -h localhost -t 'msh/#' -v`

**Database query the events:**
- Docker: `docker-compose exec mysql mysql -umeshtastic -pmeshtastic meshtastic -e "SELECT COUNT(*) FROM meshtastic_events;"`
- Local: `mysql -uroot -p meshtastic -e "SELECT COUNT(*) FROM meshtastic_events;"`

## License

ISC
