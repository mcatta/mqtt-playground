# PSK Encryption Setup Guide

This guide explains how to set up Pre-Shared Key (PSK) encryption for your MQTT messages.

## Overview

There are two main encryption options:

1. **TLS with PSK (Transport Layer)** - Encrypts the entire MQTT connection
2. **Certificate-based TLS** - Standard TLS with certificates

## Option 1: TLS with PSK (Recommended)

### Step 1: Generate a PSK Key

Generate a random 32-byte (256-bit) key:

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Step 2: Configure Mosquitto MQTT Broker for PSK

Create or edit `config/mosquitto.conf`:

```conf
# Standard MQTT (non-encrypted) - port 1883
listener 1883
allow_anonymous true

# MQTT with TLS/PSK - port 8883
listener 8883
allow_anonymous true

# Enable PSK support
use_identity_as_username true
psk_hint meshtastic-server

# PSK file (contains identity:key pairs)
psk_file /mosquitto/config/pskfile.txt
```

### Step 3: Create PSK File

Create `config/pskfile.txt` with your PSK credentials:

```text
meshtastic-client:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Format: `identity:hexkey` (one per line)

**Important:** Set proper permissions:
```bash
chmod 600 config/pskfile.txt
```

### Step 4: Configure Application

Update your `.env` file:

```env
# Change broker URL to use mqtts:// and port 8883
MQTT_BROKER=mqtts://mqtt:8883

# Enable TLS
MQTT_USE_TLS=true

# Configure PSK
MQTT_PSK_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
MQTT_PSK_IDENTITY=meshtastic-client

# Leave certificate paths empty when using PSK
MQTT_CA_PATH=
MQTT_CERT_PATH=
MQTT_KEY_PATH=
```

### Step 5: Update Docker Compose (if using Docker)

Update `docker-compose.yml` to expose port 8883:

```yaml
mqtt:
  image: eclipse-mosquitto:latest
  ports:
    - "1883:1883"   # Non-encrypted
    - "8883:8883"   # TLS/PSK encrypted
    - "9001:9001"   # WebSocket (optional)
  volumes:
    - ./config:/mosquitto/config
    - ./data:/mosquitto/data
    - ./log:/mosquitto/log
```

### Step 6: Restart Services

```bash
# Restart Mosquitto to load new config
docker-compose restart mqtt

# Restart the logger application
docker-compose restart meshtastic-logger

# Or restart everything
docker-compose down && docker-compose up -d
```

## Option 2: Certificate-based TLS

### Step 1: Generate Certificates

```bash
# Create a directory for certificates
mkdir -p config/certs
cd config/certs

# Generate CA certificate
openssl req -new -x509 -days 3650 -extensions v3_ca \
  -keyout ca.key -out ca.crt \
  -subj "/CN=Mosquitto-CA"

# Generate server certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=mqtt"

openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 3650

# Generate client certificate
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr \
  -subj "/CN=meshtastic-client"

openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out client.crt -days 3650

# Set permissions
chmod 600 *.key
```

### Step 2: Configure Mosquitto

Edit `config/mosquitto.conf`:

```conf
listener 8883
cafile /mosquitto/config/certs/ca.crt
certfile /mosquitto/config/certs/server.crt
keyfile /mosquitto/config/certs/server.key
require_certificate true
use_identity_as_username true
```

### Step 3: Configure Application

Update `.env`:

```env
MQTT_BROKER=mqtts://mqtt:8883
MQTT_USE_TLS=true

# Leave PSK empty
MQTT_PSK_KEY=
MQTT_PSK_IDENTITY=

# Configure certificates
MQTT_CA_PATH=/app/config/certs/ca.crt
MQTT_CERT_PATH=/app/config/certs/client.crt
MQTT_KEY_PATH=/app/config/certs/client.key
MQTT_REJECT_UNAUTHORIZED=true
```

## Testing Your Configuration

### Test PSK Connection

```bash
# Using mosquitto_pub with PSK
mosquitto_pub -h localhost -p 8883 \
  --psk a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2 \
  --psk-identity meshtastic-client \
  -t "test/topic" -m "Hello PSK"
```

### Test Certificate Connection

```bash
# Using mosquitto_pub with certificates
mosquitto_pub -h localhost -p 8883 \
  --cafile config/certs/ca.crt \
  --cert config/certs/client.crt \
  --key config/certs/client.key \
  -t "test/topic" -m "Hello TLS"
```

### Monitor Logs

```bash
# Check application logs
docker-compose logs -f meshtastic-logger

# Check Mosquitto logs
docker-compose logs -f mqtt
```

## Security Best Practices

1. **Never commit secrets to version control**
   - Add `*.key`, `*.crt`, `pskfile.txt` to `.gitignore`
   - Use environment variables for sensitive data

2. **Use strong PSK keys**
   - Minimum 32 bytes (256 bits)
   - Generate using cryptographically secure random generators

3. **Rotate keys regularly**
   - Change PSK keys periodically
   - Update all clients when rotating keys

4. **Restrict file permissions**
   ```bash
   chmod 600 config/pskfile.txt
   chmod 600 config/certs/*.key
   ```

5. **Use certificate validation in production**
   - Set `MQTT_REJECT_UNAUTHORIZED=true`
   - Use proper CA certificates

## Troubleshooting

### Connection Refused

**Problem:** `Error: connect ECONNREFUSED`

**Solution:**
- Verify Mosquitto is running: `docker-compose ps`
- Check if port 8883 is exposed: `docker-compose port mqtt 8883`
- Verify broker URL uses `mqtts://` not `mqtt://`

### TLS Handshake Errors

**Problem:** `Error: TLS handshake failed`

**Solution:**
- Check PSK key matches between client and server
- Verify PSK identity is correct
- Check Mosquitto logs: `docker-compose logs mqtt`
- Ensure `use_identity_as_username true` is in mosquitto.conf

### Certificate Verification Failed

**Problem:** `Error: unable to verify the first certificate`

**Solution:**
- Set `MQTT_REJECT_UNAUTHORIZED=false` for self-signed certificates (dev only)
- Ensure CA certificate path is correct
- Verify certificates are not expired

### PSK Key Format Error

**Problem:** PSK authentication fails silently

**Solution:**
- Verify PSK key is in hexadecimal format (0-9, a-f)
- Ensure key length is correct (64 hex chars = 32 bytes)
- Check for trailing spaces or newlines in pskfile.txt

## Additional Resources

- [Mosquitto PSK Documentation](https://mosquitto.org/man/mosquitto-conf-5.html)
- [MQTT.js TLS Options](https://github.com/mqttjs/MQTT.js#tls)
- [OpenSSL PSK Guide](https://www.openssl.org/docs/man1.1.1/man1/openssl-psk.html)

## Example: Complete Docker Setup with PSK

Here's a complete working example:

1. **config/mosquitto.conf:**
```conf
listener 1883
allow_anonymous true

listener 8883
allow_anonymous true
use_identity_as_username true
psk_hint meshtastic-server
psk_file /mosquitto/config/pskfile.txt
```

2. **config/pskfile.txt:**
```text
meshtastic-client:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

3. **.env:**
```env
MQTT_BROKER=mqtts://mqtt:8883
MQTT_USE_TLS=true
MQTT_PSK_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
MQTT_PSK_IDENTITY=meshtastic-client
```

4. **Start services:**
```bash
docker-compose up -d
```

5. **Verify:**
```bash
docker-compose logs -f meshtastic-logger
# Look for: "Connected to MQTT broker: mqtts://mqtt:8883"
```
