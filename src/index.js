const config = require('./config');
const Database = require('./database');
const MeshtasticMQTTClient = require('./mqttClient');

async function main() {
  console.log('Starting Meshtastic MQTT Logger...');
  console.log('================================\n');

  // Initialize database
  const database = new Database(config.database);
  await database.connect();

  // Initialize MQTT client
  const mqttClient = new MeshtasticMQTTClient(config.mqtt, database);
  mqttClient.connect();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    mqttClient.disconnect();
    await database.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('Application is running. Press Ctrl+C to stop.\n');
}

// Run the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
