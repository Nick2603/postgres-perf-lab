import { v1Routes } from './modules/v1.js';
import { dbPlugin } from './db/db.plugin.js';
import { configPlugin } from './config/config.plugin.js';
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(configPlugin);

  await app.register(dbPlugin);

  app.get('/health', () => ({ status: 'ok' }));

  app.get('/health/db', async (request) => {
    const result = await request.server.pg.query('SELECT 1');

    return { ok: result.rowCount === 1 };
  });

  await app.register(v1Routes, { prefix: '/api/v1' });

  return app;
}
