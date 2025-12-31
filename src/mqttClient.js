const mqtt = require('mqtt');
const fs = require('fs');

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
      const payload = message.toString();
      console.log(`\nReceived message on topic: ${topic}`);
      console.log(`Payload: ${payload.substring(0, 200)}${payload.length > 200 ? '...' : ''}`);

      // Parse the message
      let parsedData = null;
      try {
        parsedData = JSON.parse(payload);
      } catch (parseError) {
        console.warn('Could not parse message as JSON');
      }

      // Extract Meshtastic-specific fields
      const eventData = this.extractMeshtasticData(topic, payload, parsedData);

      // Insert into database
      const insertId = await this.database.insertEvent(eventData);
      console.log(`Event stored with ID: ${insertId}`);

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  extractMeshtasticData(topic, payload, parsedData) {
    const eventData = {
      topic,
      payload,
      parsedData,
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

    if (parsedData) {
      // Extract common Meshtastic fields
      eventData.fromNode = parsedData.from || null;
      eventData.toNode = parsedData.to || null;
      eventData.channel = parsedData.channel || null;
      eventData.packetId = parsedData.id || null;
      eventData.hopLimit = parsedData.hopLimit || null;
      eventData.wantAck = parsedData.wantAck || null;
      eventData.hopStart = parsedData.hopStart || null;

      // Extract node ID from sender
      if (parsedData.sender) {
        eventData.nodeId = parsedData.sender;
      }

      // Extract reception metadata
      if (parsedData.rxTime) {
        eventData.rxTime = parsedData.rxTime;
      }
      if (parsedData.rxSnr) {
        eventData.rxSnr = parsedData.rxSnr;
      }
      if (parsedData.rxRssi) {
        eventData.rxRssi = parsedData.rxRssi;
      }

      // Extract payload/message type and content
      if (parsedData.payload) {
        if (typeof parsedData.payload === 'object') {
          eventData.messageType = parsedData.payload.portnum || parsedData.type || null;

          // Text message
          if (parsedData.payload.text) {
            eventData.messageText = parsedData.payload.text;
          }

          // Decoded payload
          if (parsedData.payload.decoded) {
            const decoded = parsedData.payload.decoded;
            if (decoded.text) {
              eventData.messageText = decoded.text;
            }
            if (decoded.portnum) {
              eventData.messageType = decoded.portnum;
            }
          }
        }
      }

      // Alternative field names
      if (parsedData.type && !eventData.messageType) {
        eventData.messageType = parsedData.type;
      }
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

module.exports = MeshtasticMQTTClient;
