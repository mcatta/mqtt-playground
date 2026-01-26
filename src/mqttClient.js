import mqtt from 'mqtt';
import fs from 'fs';
import { fromBinary } from '@bufbuild/protobuf';
import { Mqtt, Mesh, Portnums, Telemetry } from '@meshtastic/protobufs';

class MeshtasticMQTTClient {
  constructor(config, database) {
    this.config = config;
    this.database = database;
    this.client = null;
  }

  connect() {
    const options = {
      clientId: this.config.clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    if (this.config.username) {
      options.username = this.config.username;
      options.password = this.config.password;
    }

    // Add TLS/PSK support if configured
    if (this.config.useTLS) {
      options.protocol = 'mqtts';

      // Option A: TLS with PSK cipher
      if (this.config.pskKey && this.config.pskIdentity) {
        options.pskCallback = (hint) => {
          console.log('PSK requested with hint:', hint);
          return {
            identity: this.config.pskIdentity,
            psk: Buffer.from(this.config.pskKey, 'hex')
          };
        };
        options.ciphers = 'PSK-AES128-CBC-SHA256:PSK-AES256-CBC-SHA384';
      }

      // Option B: Standard TLS with certificates
      if (this.config.caPath) {
        options.ca = fs.readFileSync(this.config.caPath);
      }
      if (this.config.certPath) {
        options.cert = fs.readFileSync(this.config.certPath);
      }
      if (this.config.keyPath) {
        options.key = fs.readFileSync(this.config.keyPath);
      }

      // Allow self-signed certificates (set to true for production)
      options.rejectUnauthorized = this.config.rejectUnauthorized !== false;
    }

    this.client = mqtt.connect(this.config.broker, options);

    this.client.on('connect', () => {
      console.log(`Connected to MQTT broker: ${this.config.broker}`);
      this.subscribe();
    });

    this.client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
    });
  }

  subscribe() {
    const topic = this.config.rootTopic;
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to topic ${topic}:`, err);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  }

  async handleMessage(topic, message) {
    try {
      console.log(`\nReceived message on topic: ${topic}`);
      console.log(`Message size: ${message.length} bytes`);

      // Decode the protobuf message
      let envelope = null;
      let packet = null;
      try {
        // Decode the ServiceEnvelope
        envelope = fromBinary(Mqtt.ServiceEnvelopeSchema, message);
        console.log('Decoded ServiceEnvelope successfully');

        // If the envelope contains a packet, decode it
        if (envelope.packet) {
          packet = envelope.packet;
          console.log(`Packet from: ${packet.from?.toString(16)}, to: ${packet.to?.toString(16)}`);
        }
      } catch (decodeError) {
        console.error('Could not decode protobuf message:', decodeError.message);
        return;
      }

      // Extract Meshtastic-specific fields
      const eventData = this.extractMeshtasticData(topic, message, envelope, packet);

      // Insert into database
      const insertId = await this.database.insertEvent(eventData);
      console.log(`Event stored with ID: ${insertId}`);

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  extractMeshtasticData(topic, rawPayload, envelope, packet) {
    const eventData = {
      topic,
      payload: rawPayload.toString('base64'), // Store as base64 for binary data
      parsedData: null,
      nodeId: null,
      fromNode: null,
      toNode: null,
      channel: null,
      packetId: null,
      hopLimit: null,
      wantAck: null,
      rxTime: null,
      rxSnr: null,
      rxRssi: null,
      hopStart: null,
      messageType: null,
      messageText: null
    };

    if (!packet) {
      return eventData;
    }

    try {
      // Extract basic packet fields
      eventData.fromNode = packet.from ? packet.from.toString() : null;
      eventData.toNode = packet.to ? packet.to.toString() : null;
      eventData.channel = packet.channel || null;
      eventData.packetId = packet.id || null;
      eventData.hopLimit = packet.hopLimit || null;
      eventData.wantAck = packet.wantAck || null;
      eventData.hopStart = packet.hopStart || null;

      // Extract reception metadata
      if (packet.rxTime) {
        eventData.rxTime = packet.rxTime;
      }
      if (packet.rxSnr) {
        eventData.rxSnr = packet.rxSnr;
      }
      if (packet.rxRssi) {
        eventData.rxRssi = packet.rxRssi;
      }

      // Extract channel ID from envelope
      if (envelope.channelId) {
        eventData.nodeId = envelope.channelId;
      }

      // Decode the encrypted/decoded payload if present
      if (packet.decoded) {
        const decoded = packet.decoded;
        eventData.messageType = decoded.portnum || null;

        // Try to decode the payload based on portnum
        if (decoded.payload && decoded.portnum) {
          try {
            switch (decoded.portnum) {
              case Portnums.PortNum.TEXT_MESSAGE_APP:
                // Decode text message
                const textPayload = fromBinary(Mesh.DataSchema, decoded.payload);
                if (textPayload.payload) {
                  eventData.messageText = Buffer.from(textPayload.payload).toString('utf-8');
                }
                break;

              case Portnums.PortNum.POSITION_APP:
                // Position data
                const position = fromBinary(Mesh.PositionSchema, decoded.payload);
                eventData.parsedData = {
                  latitude: position.latitudeI ? position.latitudeI * 1e-7 : null,
                  longitude: position.longitudeI ? position.longitudeI * 1e-7 : null,
                  altitude: position.altitude || null,
                  time: position.time || null
                };
                break;

              case Portnums.PortNum.NODEINFO_APP:
                // Node info
                const nodeInfo = fromBinary(Mesh.UserSchema, decoded.payload);
                eventData.parsedData = {
                  id: nodeInfo.id,
                  longName: nodeInfo.longName,
                  shortName: nodeInfo.shortName,
                  macaddr: nodeInfo.macaddr ? Buffer.from(nodeInfo.macaddr).toString('hex') : null
                };
                break;

              case Portnums.PortNum.TELEMETRY_APP:
                // Telemetry data
                const telemetry = fromBinary(Telemetry.TelemetrySchema, decoded.payload);
                eventData.parsedData = {
                  deviceMetrics: telemetry.deviceMetrics,
                  environmentMetrics: telemetry.environmentMetrics,
                  airQualityMetrics: telemetry.airQualityMetrics
                };
                break;

              default:
                // Store raw payload for other message types
                eventData.parsedData = {
                  portnum: decoded.portnum,
                  payloadBase64: Buffer.from(decoded.payload).toString('base64')
                };
            }
          } catch (payloadDecodeError) {
            console.warn(`Could not decode payload for portnum ${decoded.portnum}:`, payloadDecodeError.message);
          }
        }
      }

      // Store the full packet as JSON for reference
      if (!eventData.parsedData) {
        eventData.parsedData = JSON.stringify({
          from: packet.from?.toString(),
          to: packet.to?.toString(),
          channel: packet.channel,
          id: packet.id,
          decoded: packet.decoded ? {
            portnum: packet.decoded.portnum,
            wantResponse: packet.decoded.wantResponse
          } : null
        });
      } else if (typeof eventData.parsedData === 'object') {
        eventData.parsedData = JSON.stringify(eventData.parsedData);
      }

    } catch (error) {
      console.error('Error extracting Meshtastic data:', error);
    }

    return eventData;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('Disconnected from MQTT broker');
    }
  }
}

export default MeshtasticMQTTClient;
