import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';

const DEFAULT_TTL_SECONDS = 60 * 60 * 12; // 12 horas (43200s)

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  private isEnabled(): boolean {
    const url = this.config.get<string>('REDIS_URL')?.trim();
    const host = this.config.get<string>('REDIS_HOST')?.trim();
    return Boolean(url || host);
  }

  private getTtlSeconds(): number {
    const raw = this.config.get<string>('CACHE_TTL_SECONDS')?.trim();
    const n = raw ? parseInt(raw, 10) : DEFAULT_TTL_SECONDS;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_SECONDS;
  }

  private getOrCreateClient(): Redis | null {
    if (!this.isEnabled()) {
      return null;
    }
    if (this.client) {
      return this.client;
    }

    const url = this.config.get<string>('REDIS_URL')?.trim();
    const host = this.config.get<string>('REDIS_HOST')?.trim();
    const portRaw = this.config.get<string>('REDIS_PORT')?.trim();
    const tlsRaw = this.config.get<string>('REDIS_TLS')?.trim();
    const useTls = tlsRaw ? tlsRaw.toLowerCase() === 'true' : true;
    const port = portRaw ? parseInt(portRaw, 10) : 6380;

    const common: RedisOptions = {
      lazyConnect: true,
      connectTimeout: 800,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      // Mantém o retry do ioredis em background; nós sempre fazemos fallback.
      retryStrategy: (times) => Math.min(times * 200, 2000),
    };

    const client = url
      ? new Redis(url, common)
      : new Redis({
          ...common,
          host: host || '127.0.0.1',
          port,
          tls: useTls ? {} : undefined,
        });

    client.on('error', (err) => {
      // Evitar spam: só logar mensagens curtas e sempre fazer fallback silencioso nas operações.
      this.logger.warn(`Redis error: ${err?.message ?? String(err)}`);
    });

    this.client = client;
    return client;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const client = this.getOrCreateClient();
    if (!client) return null;

    const raw = await this.safe(() => client.get(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number = this.getTtlSeconds(),
  ): Promise<void> {
    const client = this.getOrCreateClient();
    if (!client) return;
    const payload = JSON.stringify(value);
    await this.safe(() => client.set(key, payload, 'EX', ttlSeconds));
  }

  async del(key: string): Promise<void> {
    const client = this.getOrCreateClient();
    if (!client) return;
    await this.safe(() => client.del(key));
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        this.client.disconnect();
      } finally {
        this.client = null;
      }
    }
  }
}

