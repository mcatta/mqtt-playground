import mqtt from 'mqtt';
import fs from 'fs';
import MessageHandler from './MessageHandler.js';

class MeshtasticMQTTClient {
  constructor(config, database) {
    this.config = config;
    this.database = database;
    this.client = null;
    this.messageHandler = new MessageHandler(database, config.channelKey);
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
      this.messageHandler.handle(topic, message);
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

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('Disconnected from MQTT broker');
    }
  }
}

export default MeshtasticMQTTClient;
