import mysql from 'mysql2/promise';

class Database {
  constructor(config) {
    this.config = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool(this.config);
      console.log('Database connection pool created');

      // Test connection
      const connection = await this.pool.getConnection();
      console.log('Successfully connected to database');
      connection.release();

      // Initialize schema
      await this.initSchema();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async initSchema() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS meshtastic_events (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.pool.execute(createTableQuery);
      console.log('Database schema initialized');
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  async insertEvent(eventData) {
    const query = `
      INSERT INTO meshtastic_events (
        topic, payload, parsed_data, node_id, from_node, to_node,
        channel, packet_id, hop_limit, want_ack, rx_time,
        rx_snr, rx_rssi, hop_start, message_type, portnum_type, message_text,
        latitude, longitude, altitude, position_time,
        node_info_id, long_name, short_name, mac_address,
        device_metrics, environment_metrics, air_quality_metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await this.pool.execute(query, [
        eventData.topic,
        eventData.payload,
        JSON.stringify(eventData.parsedData),
        eventData.nodeId,
        eventData.fromNode,
        eventData.toNode,
        eventData.channel,
        eventData.packetId,
        eventData.hopLimit,
        eventData.wantAck,
        eventData.rxTime,
        eventData.rxSnr,
        eventData.rxRssi,
        eventData.hopStart,
        eventData.messageType,
        eventData.portnumType,
        eventData.messageText,
        eventData.latitude,
        eventData.longitude,
        eventData.altitude,
        eventData.positionTime,
        eventData.nodeInfoId,
        eventData.longName,
        eventData.shortName,
        eventData.macAddress,
        eventData.deviceMetrics ? JSON.stringify(eventData.deviceMetrics) : null,
        eventData.environmentMetrics ? JSON.stringify(eventData.environmentMetrics) : null,
        eventData.airQualityMetrics ? JSON.stringify(eventData.airQualityMetrics) : null
      ]);

      return result.insertId;
    } catch (error) {
      console.error('Error inserting event:', error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection pool closed');
    }
  }
}

export default Database;
