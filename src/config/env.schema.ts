/**
 * JSON Schema describing every environment variable the app needs.
 * @fastify/env validates process.env against this at startup (via Ajv)
 * and decorates the result onto app.config.
 */
export const envSchema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    PORT: {
      type: 'integer',
      minimum: 1,
      default: 3000,
    },
    DATABASE_URL: {
      type: 'string',
      pattern: '^postgres(ql)?://',
    },
    PG_POOL_MAX: {
      type: 'integer',
      minimum: 1,
      default: 20,
    },
    PG_POOL_IDLE_TIMEOUT_MS: {
      type: 'integer',
      minimum: 0,
      default: 30000,
    },
    PG_POOL_CONNECTION_TIMEOUT_MS: {
      type: 'integer',
      minimum: 0,
      default: 5000,
    },
  },
} as const;

/**
 * Hand-written to mirror envSchema above. @fastify/env has no built-in type
 * inference (unlike Zod), so this interface is kept in sync manually --
 * if you add a field to envSchema, add it here too.
 */
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  PG_POOL_MAX: number;
  PG_POOL_IDLE_TIMEOUT_MS: number;
  PG_POOL_CONNECTION_TIMEOUT_MS: number;
}
