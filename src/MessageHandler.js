import { fromBinary } from '@bufbuild/protobuf';
import { Mqtt, Mesh, Portnums, Telemetry } from '@meshtastic/protobufs';

class MessageHandler {
  constructor(database) {
    this.database = database;
  }

  async handle(topic, message) {
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
      portnumType: null,
      messageText: null,
      latitude: null,
      longitude: null,
      altitude: null,
      positionTime: null,
      nodeInfoId: null,
      longName: null,
      shortName: null,
      macAddress: null,
      deviceMetrics: null,
      environmentMetrics: null,
      airQualityMetrics: null
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

        // Get portnum type name
        const portnumName = this.getPortnumName(decoded.portnum);
        eventData.portnumType = portnumName;

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
                eventData.latitude = position.latitudeI ? position.latitudeI * 1e-7 : null;
                eventData.longitude = position.longitudeI ? position.longitudeI * 1e-7 : null;
                eventData.altitude = position.altitude || null;
                eventData.positionTime = position.time || null;
                break;

              case Portnums.PortNum.NODEINFO_APP:
                // Node info
                const nodeInfo = fromBinary(Mesh.UserSchema, decoded.payload);
                eventData.nodeInfoId = nodeInfo.id || null;
                eventData.longName = nodeInfo.longName || null;
                eventData.shortName = nodeInfo.shortName || null;
                eventData.macAddress = nodeInfo.macaddr ? Buffer.from(nodeInfo.macaddr).toString('hex') : null;
                break;

              case Portnums.PortNum.TELEMETRY_APP:
                // Telemetry data
                const telemetry = fromBinary(Telemetry.TelemetrySchema, decoded.payload);
                eventData.deviceMetrics = telemetry.deviceMetrics || null;
                eventData.environmentMetrics = telemetry.environmentMetrics || null;
                eventData.airQualityMetrics = telemetry.airQualityMetrics || null;
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

      // Store additional packet info in parsedData if needed (for unknown message types)
      if (eventData.parsedData && typeof eventData.parsedData === 'object') {
        eventData.parsedData = JSON.stringify(eventData.parsedData);
      } else {
        eventData.parsedData = null;
      }

    } catch (error) {
      console.error('Error extracting Meshtastic data:', error);
    }

    return eventData;
  }

  getPortnumName(portnum) {
    if (portnum === null || portnum === undefined) {
      return null;
    }

    const portnumMap = {
      [Portnums.PortNum.UNKNOWN_APP]: 'UNKNOWN_APP',
      [Portnums.PortNum.TEXT_MESSAGE_APP]: 'TEXT_MESSAGE_APP',
      [Portnums.PortNum.REMOTE_HARDWARE_APP]: 'REMOTE_HARDWARE_APP',
      [Portnums.PortNum.POSITION_APP]: 'POSITION_APP',
      [Portnums.PortNum.NODEINFO_APP]: 'NODEINFO_APP',
      [Portnums.PortNum.ROUTING_APP]: 'ROUTING_APP',
      [Portnums.PortNum.ADMIN_APP]: 'ADMIN_APP',
      [Portnums.PortNum.TEXT_MESSAGE_COMPRESSED_APP]: 'TEXT_MESSAGE_COMPRESSED_APP',
      [Portnums.PortNum.WAYPOINT_APP]: 'WAYPOINT_APP',
      [Portnums.PortNum.AUDIO_APP]: 'AUDIO_APP',
      [Portnums.PortNum.DETECTION_SENSOR_APP]: 'DETECTION_SENSOR_APP',
      [Portnums.PortNum.REPLY_APP]: 'REPLY_APP',
      [Portnums.PortNum.IP_TUNNEL_APP]: 'IP_TUNNEL_APP',
      [Portnums.PortNum.PAXCOUNTER_APP]: 'PAXCOUNTER_APP',
      [Portnums.PortNum.SERIAL_APP]: 'SERIAL_APP',
      [Portnums.PortNum.STORE_FORWARD_APP]: 'STORE_FORWARD_APP',
      [Portnums.PortNum.RANGE_TEST_APP]: 'RANGE_TEST_APP',
      [Portnums.PortNum.TELEMETRY_APP]: 'TELEMETRY_APP',
      [Portnums.PortNum.ZPS_APP]: 'ZPS_APP',
      [Portnums.PortNum.SIMULATOR_APP]: 'SIMULATOR_APP',
      [Portnums.PortNum.TRACEROUTE_APP]: 'TRACEROUTE_APP',
      [Portnums.PortNum.NEIGHBORINFO_APP]: 'NEIGHBORINFO_APP',
      [Portnums.PortNum.ATAK_PLUGIN]: 'ATAK_PLUGIN',
      [Portnums.PortNum.MAP_REPORT_APP]: 'MAP_REPORT_APP',
      [Portnums.PortNum.PRIVATE_APP]: 'PRIVATE_APP',
      [Portnums.PortNum.ATAK_FORWARDER]: 'ATAK_FORWARDER'
    };

    return portnumMap[portnum] || `UNKNOWN_${portnum}`;
  }
}

export default MessageHandler;
