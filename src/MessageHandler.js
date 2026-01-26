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
}

export default MessageHandler;
