import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import fastifyPostgres from '@fastify/postgres';

export const dbPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyPostgres, {
    connectionString: app.config.PGBOUNCER_URL,
    max: app.config.PG_POOL_MAX,
    idleTimeoutMillis: app.config.PG_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: app.config.PG_POOL_CONNECTION_TIMEOUT_MS,
  });
});
