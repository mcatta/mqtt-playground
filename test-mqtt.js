#!/usr/bin/env node

const mqtt = require('mqtt');

// Connect to MQTT broker with authentication
const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'admin',
  password: 'admin'
});

// Sample Meshtastic message payload
const testMessage = {
  id: "1234567890",
  channel: 0,
  from: "!a1b2c3d4",
  to: "!ffffffff",
  sender: "!a1b2c3d4",
  timestamp: Math.floor(Date.now() / 1000),
  type: "TEXT_MESSAGE_APP",
  payload: {
    text: "Hello from test script!"
  }
};

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  const topic = 'msh/US/2/json/LongFast/!a1b2c3d4';
  const payload = JSON.stringify(testMessage);

  console.log(`Publishing to topic: ${topic}`);
  console.log(`Payload: ${payload}`);

  client.publish(topic, payload, (err) => {
    if (err) {
      console.error('Error publishing message:', err);
    } else {
      console.log('✓ Message published successfully!');
      console.log('\nCheck your logger logs with: docker-compose logs -f meshtastic-logger');
    }
    client.end();
  });
});

client.on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});
