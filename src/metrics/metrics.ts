import * as client from 'prom-client';

export const metricsRegistry = new client.Registry();

// Default Node.js/process metrics (memory, CPU, event loop, GC, etc.)
client.collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP recebidas, particionadas por método, rota e status code.',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

export function normalizeRoute(raw: string): string {
  // Avoid empty/unknown labels; keep cardinality manageable.
  const v = (raw || '').trim();
  if (!v) return 'unknown';
  if (v.length > 200) return v.slice(0, 200);
  return v;
}

