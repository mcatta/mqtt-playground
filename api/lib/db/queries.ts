import { getPool } from './connection';
import {
  CoordinateResult,
  CoordinateFilters,
  NodeSummary,
  NodeDetails,
  MessageResult,
  TelemetryResult,
  TelemetryFilters,
  NetworkStats,
  NodeStats,
  RecentEvent,
} from '@/lib/types';

// ===== COORDINATES QUERIES =====

export async function getCoordinates(
  filters: CoordinateFilters
): Promise<{ data: CoordinateResult[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = ['latitude IS NOT NULL', 'longitude IS NOT NULL'];
  const params: any[] = [];

  if (filters.nodeId) {
    conditions.push('node_id = ?');
    params.push(filters.nodeId);
  }

  if (filters.fromNode) {
    conditions.push('from_node = ?');
    params.push(filters.fromNode);
  }

  if (filters.startDate) {
    conditions.push('received_at >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('received_at <= ?');
    params.push(filters.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) as total FROM meshtastic_events ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  // Get data with pagination
  const [rows] = await pool.execute<any[]>(
    `SELECT id, node_id as nodeId, from_node as fromNode, latitude, longitude,
            altitude, position_time as positionTime, rx_time as rxTime,
            rx_snr as rxSnr, rx_rssi as rxRssi, received_at as receivedAt
     FROM meshtastic_events
     ${whereClause}
     ORDER BY received_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );

  return { data: rows, total };
}

export async function getLatestPosition(
  nodeId: string
): Promise<CoordinateResult | null> {
  const pool = getPool();

  const [rows] = await pool.execute<any[]>(
    `SELECT id, node_id as nodeId, from_node as fromNode, latitude, longitude,
            altitude, position_time as positionTime, rx_time as rxTime,
            rx_snr as rxSnr, rx_rssi as rxRssi, received_at as receivedAt
     FROM meshtastic_events
     WHERE from_node = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
     ORDER BY received_at DESC
     LIMIT 1`,
    [nodeId]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function getPositionHistory(
  nodeId: string,
  filters: CoordinateFilters
): Promise<CoordinateResult[]> {
  const pool = getPool();
  const conditions: string[] = [
    'from_node = ?',
    'latitude IS NOT NULL',
    'longitude IS NOT NULL',
  ];
  const params: any[] = [nodeId];

  if (filters.startDate) {
    conditions.push('received_at >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('received_at <= ?');
    params.push(filters.endDate);
  }

  const [rows] = await pool.execute<any[]>(
    `SELECT id, node_id as nodeId, from_node as fromNode, latitude, longitude,
            altitude, position_time as positionTime, rx_time as rxTime,
            rx_snr as rxSnr, rx_rssi as rxRssi, received_at as receivedAt
     FROM meshtastic_events
     WHERE ${conditions.join(' AND ')}
     ORDER BY received_at ASC
     LIMIT ?`,
    [...params, filters.limit]
  );

  return rows;
}

// ===== NODES QUERIES =====

export async function getNodes(filters: {
  active?: boolean;
  limit: number;
  offset: number;
}): Promise<{ data: NodeSummary[]; total: number }> {
  const pool = getPool();

  let whereClause = '';
  const params: any[] = [];

  if (filters.active) {
    whereClause = 'WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
  }

  // Get total count of unique nodes
  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(DISTINCT node_id) as total
     FROM (
       SELECT from_node as node_id, MAX(received_at) as last_seen
       FROM meshtastic_events
       WHERE from_node IS NOT NULL
       GROUP BY from_node
       ${filters.active ? 'HAVING last_seen >= DATE_SUB(NOW(), INTERVAL 24 HOUR)' : ''}
     ) as nodes`
  );
  const total = countRows[0].total;

  // Get node data with aggregation
  const [rows] = await pool.execute<any[]>(
    `SELECT
       e.from_node as nodeId,
       MAX(e.long_name) as longName,
       MAX(e.short_name) as shortName,
       MAX(e.mac_address) as macAddress,
       MAX(e.received_at) as lastSeen,
       COUNT(*) as messageCount,
       SUM(CASE WHEN e.latitude IS NOT NULL THEN 1 ELSE 0 END) > 0 as hasPosition
     FROM meshtastic_events e
     WHERE e.from_node IS NOT NULL
     GROUP BY e.from_node
     ${filters.active ? 'HAVING lastSeen >= DATE_SUB(NOW(), INTERVAL 24 HOUR)' : ''}
     ORDER BY lastSeen DESC
     LIMIT ? OFFSET ?`,
    [filters.limit, filters.offset]
  );

  return { data: rows, total };
}

export async function getNodeDetails(nodeId: string): Promise<NodeDetails | null> {
  const pool = getPool();

  // Get basic node info and stats
  const [nodeRows] = await pool.execute<any[]>(
    `SELECT
       e.from_node as nodeId,
       MAX(e.long_name) as longName,
       MAX(e.short_name) as shortName,
       MAX(e.mac_address) as macAddress,
       MAX(e.received_at) as lastSeen,
       MIN(e.received_at) as firstSeen,
       COUNT(*) as totalMessages,
       SUM(CASE WHEN e.portnum_type = 'TEXT_MESSAGE_APP' THEN 1 ELSE 0 END) as textMessages,
       SUM(CASE WHEN e.portnum_type = 'POSITION_APP' THEN 1 ELSE 0 END) as positionUpdates,
       SUM(CASE WHEN e.portnum_type = 'TELEMETRY_APP' THEN 1 ELSE 0 END) as telemetryReports
     FROM meshtastic_events e
     WHERE e.from_node = ?
     GROUP BY e.from_node`,
    [nodeId]
  );

  if (nodeRows.length === 0) {
    return null;
  }

  const node = nodeRows[0];

  // Get last position
  const [posRows] = await pool.execute<any[]>(
    `SELECT latitude, longitude, altitude, received_at as timestamp
     FROM meshtastic_events
     WHERE from_node = ? AND latitude IS NOT NULL
     ORDER BY received_at DESC
     LIMIT 1`,
    [nodeId]
  );

  // Get last telemetry
  const [telRows] = await pool.execute<any[]>(
    `SELECT device_metrics, environment_metrics, received_at as timestamp
     FROM meshtastic_events
     WHERE from_node = ? AND (device_metrics IS NOT NULL OR environment_metrics IS NOT NULL)
     ORDER BY received_at DESC
     LIMIT 1`,
    [nodeId]
  );

  const lastTelemetry = telRows.length > 0 ? {
    ...(telRows[0].device_metrics || {}),
    ...(telRows[0].environment_metrics || {}),
    timestamp: telRows[0].timestamp,
  } : null;

  return {
    nodeId: node.nodeId,
    longName: node.longName,
    shortName: node.shortName,
    macAddress: node.macAddress,
    lastSeen: node.lastSeen,
    firstSeen: node.firstSeen,
    messageCount: node.totalMessages,
    hasPosition: posRows.length > 0,
    stats: {
      totalMessages: node.totalMessages,
      textMessages: node.textMessages,
      positionUpdates: node.positionUpdates,
      telemetryReports: node.telemetryReports,
    },
    lastPosition: posRows.length > 0 ? posRows[0] : null,
    lastTelemetry,
  };
}

// ===== MESSAGES QUERIES =====

export async function getMessages(filters: {
  nodeId?: string;
  fromNode?: string;
  toNode?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}): Promise<{ data: MessageResult[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = ["portnum_type = 'TEXT_MESSAGE_APP'"];
  const params: any[] = [];

  if (filters.nodeId) {
    conditions.push('node_id = ?');
    params.push(filters.nodeId);
  }

  if (filters.fromNode) {
    conditions.push('from_node = ?');
    params.push(filters.fromNode);
  }

  if (filters.toNode) {
    conditions.push('to_node = ?');
    params.push(filters.toNode);
  }

  if (filters.startDate) {
    conditions.push('received_at >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('received_at <= ?');
    params.push(filters.endDate);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) as total FROM meshtastic_events ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  // Get messages
  const [rows] = await pool.execute<any[]>(
    `SELECT id, from_node as fromNode, to_node as toNode, message_text as messageText,
            channel, rx_time as rxTime, rx_snr as rxSnr, rx_rssi as rxRssi,
            received_at as receivedAt
     FROM meshtastic_events
     ${whereClause}
     ORDER BY received_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );

  return { data: rows, total };
}

// ===== TELEMETRY QUERIES =====

export async function getTelemetry(
  filters: TelemetryFilters
): Promise<{ data: TelemetryResult[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: any[] = [];

  // Base condition for telemetry
  if (filters.type === 'device') {
    conditions.push('device_metrics IS NOT NULL');
  } else if (filters.type === 'environment') {
    conditions.push('environment_metrics IS NOT NULL');
  } else if (filters.type === 'airquality') {
    conditions.push('air_quality_metrics IS NOT NULL');
  } else {
    conditions.push('(device_metrics IS NOT NULL OR environment_metrics IS NOT NULL OR air_quality_metrics IS NOT NULL)');
  }

  if (filters.nodeId) {
    conditions.push('node_id = ?');
    params.push(filters.nodeId);
  }

  if (filters.startDate) {
    conditions.push('received_at >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('received_at <= ?');
    params.push(filters.endDate);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) as total FROM meshtastic_events ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  // Get telemetry data
  const [rows] = await pool.execute<any[]>(
    `SELECT id, node_id as nodeId, from_node as fromNode,
            device_metrics as deviceMetrics,
            environment_metrics as environmentMetrics,
            air_quality_metrics as airQualityMetrics,
            received_at as receivedAt
     FROM meshtastic_events
     ${whereClause}
     ORDER BY received_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );

  return { data: rows, total };
}

export async function getLatestTelemetry(
  nodeId: string
): Promise<TelemetryResult | null> {
  const pool = getPool();

  const [rows] = await pool.execute<any[]>(
    `SELECT id, node_id as nodeId, from_node as fromNode,
            device_metrics as deviceMetrics,
            environment_metrics as environmentMetrics,
            air_quality_metrics as airQualityMetrics,
            received_at as receivedAt
     FROM meshtastic_events
     WHERE from_node = ?
       AND (device_metrics IS NOT NULL OR environment_metrics IS NOT NULL OR air_quality_metrics IS NOT NULL)
     ORDER BY received_at DESC
     LIMIT 1`,
    [nodeId]
  );

  return rows.length > 0 ? rows[0] : null;
}

// ===== STATISTICS QUERIES =====

export async function getNetworkStats(): Promise<NetworkStats> {
  const pool = getPool();

  // Get total and active nodes
  const [nodesRows] = await pool.execute<any[]>(
    `SELECT
       COUNT(DISTINCT from_node) as totalNodes,
       COUNT(DISTINCT CASE WHEN received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN from_node END) as activeNodes
     FROM meshtastic_events
     WHERE from_node IS NOT NULL`
  );

  // Get message counts
  const [msgRows] = await pool.execute<any[]>(
    `SELECT
       COUNT(*) as totalMessages,
       COUNT(CASE WHEN received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as messagesLast24h,
       AVG(rx_rssi) as averageRssi,
       AVG(rx_snr) as averageSnr
     FROM meshtastic_events`
  );

  // Get coverage area
  const [coverageRows] = await pool.execute<any[]>(
    `SELECT
       MIN(latitude) as minLatitude,
       MAX(latitude) as maxLatitude,
       MIN(longitude) as minLongitude,
       MAX(longitude) as maxLongitude
     FROM meshtastic_events
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
  );

  return {
    totalNodes: nodesRows[0].totalNodes || 0,
    activeNodes: nodesRows[0].activeNodes || 0,
    totalMessages: msgRows[0].totalMessages || 0,
    messagesLast24h: msgRows[0].messagesLast24h || 0,
    averageRssi: msgRows[0].averageRssi,
    averageSnr: msgRows[0].averageSnr,
    coverage: {
      minLatitude: coverageRows[0].minLatitude,
      maxLatitude: coverageRows[0].maxLatitude,
      minLongitude: coverageRows[0].minLongitude,
      maxLongitude: coverageRows[0].maxLongitude,
    },
  };
}

export async function getNodeStats(
  nodeId: string,
  period: '24h' | '7d' | '30d'
): Promise<NodeStats | null> {
  const pool = getPool();

  const periodMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
  };
  const days = periodMap[period];

  const [rows] = await pool.execute<any[]>(
    `SELECT
       from_node as nodeId,
       COUNT(*) as messagesSent,
       COUNT(CASE WHEN to_node = ? THEN 1 END) as messagesReceived,
       AVG(rx_rssi) as averageRssi,
       AVG(rx_snr) as averageSnr
     FROM meshtastic_events
     WHERE from_node = ? AND received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY from_node`,
    [nodeId, nodeId, days]
  );

  if (rows.length === 0) {
    return null;
  }

  // Calculate battery trend
  const [batteryRows] = await pool.execute<any[]>(
    `SELECT
       JSON_EXTRACT(device_metrics, '$.batteryLevel') as batteryLevel,
       received_at
     FROM meshtastic_events
     WHERE from_node = ? AND device_metrics IS NOT NULL
       AND received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY received_at ASC`,
    [nodeId, days]
  );

  let batteryTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
  if (batteryRows.length >= 2) {
    const first = batteryRows[0].batteryLevel;
    const last = batteryRows[batteryRows.length - 1].batteryLevel;
    if (last > first + 5) batteryTrend = 'increasing';
    else if (last < first - 5) batteryTrend = 'decreasing';
    else batteryTrend = 'stable';
  }

  // Calculate distance traveled
  const [posRows] = await pool.execute<any[]>(
    `SELECT latitude, longitude
     FROM meshtastic_events
     WHERE from_node = ? AND latitude IS NOT NULL
       AND received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY received_at ASC`,
    [nodeId, days]
  );

  let distanceTraveled = null;
  if (posRows.length >= 2) {
    // Simple Haversine distance calculation (approximate)
    let totalDistance = 0;
    for (let i = 1; i < posRows.length; i++) {
      const R = 6371; // Earth radius in km
      const dLat = ((posRows[i].latitude - posRows[i - 1].latitude) * Math.PI) / 180;
      const dLon = ((posRows[i].longitude - posRows[i - 1].longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((posRows[i - 1].latitude * Math.PI) / 180) *
          Math.cos((posRows[i].latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    distanceTraveled = Math.round(totalDistance * 100) / 100; // Round to 2 decimals
  }

  return {
    nodeId: rows[0].nodeId,
    period,
    messagesSent: rows[0].messagesSent,
    messagesReceived: rows[0].messagesReceived,
    averageRssi: rows[0].averageRssi,
    averageSnr: rows[0].averageSnr,
    batteryTrend,
    distanceTraveled,
  };
}

// ===== EVENTS QUERIES =====

export async function getRecentEvents(limit: number): Promise<RecentEvent[]> {
  const pool = getPool();

  const [rows] = await pool.execute<any[]>(
    `SELECT
       id,
       portnum_type as type,
       from_node as fromNode,
       to_node as toNode,
       CASE
         WHEN portnum_type = 'TEXT_MESSAGE_APP' THEN CONCAT('Message: ', COALESCE(message_text, ''))
         WHEN portnum_type = 'POSITION_APP' THEN CONCAT('Position: ', COALESCE(latitude, 0), ', ', COALESCE(longitude, 0))
         WHEN portnum_type = 'TELEMETRY_APP' THEN 'Telemetry update'
         WHEN portnum_type = 'NODEINFO_APP' THEN CONCAT('Node info: ', COALESCE(long_name, ''))
         ELSE portnum_type
       END as summary,
       received_at as timestamp
     FROM meshtastic_events
     WHERE portnum_type IS NOT NULL
     ORDER BY received_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
}
