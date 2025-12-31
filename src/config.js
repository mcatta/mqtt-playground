require('dotenv').config();

const config = {
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: process.env.MQTT_CLIENT_ID || 'meshtastic-logger',
    rootTopic: process.env.MESHTASTIC_ROOT_TOPIC || 'msh/US/#',

    // TLS/PSK Configuration
    useTLS: process.env.MQTT_USE_TLS === 'true',
    pskKey: process.env.MQTT_PSK_KEY || '',
    pskIdentity: process.env.MQTT_PSK_IDENTITY || '',

    // Certificate-based TLS (alternative to PSK)
    caPath: process.env.MQTT_CA_PATH || '',
    certPath: process.env.MQTT_CERT_PATH || '',
    keyPath: process.env.MQTT_KEY_PATH || '',
    rejectUnauthorized: process.env.MQTT_REJECT_UNAUTHORIZED !== 'false'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'meshtastic'
  }
};

module.exports = config;
