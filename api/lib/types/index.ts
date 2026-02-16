// User types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  created_at: Date;
  last_login: Date | null;
  active: boolean;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

// Coordinate types
export interface CoordinateResult {
  id: number;
  nodeId: string | null;
  fromNode: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  positionTime: number | null;
  rxTime: number | null;
  rxSnr: number | null;
  rxRssi: number | null;
  receivedAt: string;
}

export interface CoordinateFilters {
  nodeId?: string;
  fromNode?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

// Node types
export interface NodeSummary {
  nodeId: string;
  longName: string | null;
  shortName: string | null;
  macAddress: string | null;
  lastSeen: string;
  messageCount: number;
  hasPosition: boolean;
}

export interface NodeDetails extends NodeSummary {
  firstSeen: string;
  stats: {
    totalMessages: number;
    textMessages: number;
    positionUpdates: number;
    telemetryReports: number;
  };
  lastPosition: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  } | null;
  lastTelemetry: {
    batteryLevel?: number;
    voltage?: number;
    channelUtilization?: number;
    airUtilTx?: number;
    temperature?: number;
    relativeHumidity?: number;
    barometricPressure?: number;
    timestamp: string;
  } | null;
}

// Message types
export interface MessageResult {
  id: number;
  fromNode: string | null;
  toNode: string | null;
  messageText: string | null;
  channel: number | null;
  rxTime: number | null;
  rxSnr: number | null;
  rxRssi: number | null;
  receivedAt: string;
}

// Telemetry types
export interface DeviceMetrics {
  batteryLevel?: number;
  voltage?: number;
  channelUtilization?: number;
  airUtilTx?: number;
}

export interface EnvironmentMetrics {
  temperature?: number;
  relativeHumidity?: number;
  barometricPressure?: number;
}

export interface AirQualityMetrics {
  pm10Standard?: number;
  pm25Standard?: number;
  pm100Standard?: number;
}

export interface TelemetryResult {
  id: number;
  nodeId: string | null;
  fromNode: string | null;
  deviceMetrics: DeviceMetrics | null;
  environmentMetrics: EnvironmentMetrics | null;
  airQualityMetrics: AirQualityMetrics | null;
  receivedAt: string;
}

export interface TelemetryFilters {
  nodeId?: string;
  type?: 'device' | 'environment' | 'airquality';
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

// Statistics types
export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalMessages: number;
  messagesLast24h: number;
  averageRssi: number | null;
  averageSnr: number | null;
  coverage: {
    minLatitude: number | null;
    maxLatitude: number | null;
    minLongitude: number | null;
    maxLongitude: number | null;
  };
}

export interface NodeStats {
  nodeId: string;
  period: '24h' | '7d' | '30d';
  messagesSent: number;
  messagesReceived: number;
  averageRssi: number | null;
  averageSnr: number | null;
  batteryTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  distanceTraveled: number | null;
}

// Event types
export interface RecentEvent {
  id: number;
  type: string;
  fromNode: string | null;
  toNode: string | null;
  summary: string;
  timestamp: string;
}
