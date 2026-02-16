import { z } from 'zod';

// Authentication schemas
export const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

// Coordinate filter schemas
export const CoordinateFiltersSchema = z.object({
  nodeId: z.string().optional(),
  fromNode: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Node filter schemas
export const NodeFiltersSchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Message filter schemas
export const MessageFiltersSchema = z.object({
  nodeId: z.string().optional(),
  fromNode: z.string().optional(),
  toNode: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Telemetry filter schemas
export const TelemetryFiltersSchema = z.object({
  nodeId: z.string().optional(),
  type: z.enum(['device', 'environment', 'airquality']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Stats filter schemas
export const NodeStatsSchema = z.object({
  period: z.enum(['24h', '7d', '30d']).default('24h'),
});

// Event filter schemas
export const RecentEventsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});
