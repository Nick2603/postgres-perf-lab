import Fastify from 'fastify';
import { configPlugin } from './config/config.plugin.js';
import { dbPlugin } from './db/db.plugin.js';

const app = Fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    await app.register(configPlugin);

    await app.register(dbPlugin);

    app.get('/health', () => {
      return { status: 'ok' };
    });

    app.get('/health/db', async (request) => {
      const result = await request.server.pg.query('SELECT 1');

      return { ok: result.rowCount === 1 };
    });

    await app.listen({ port: app.config.PORT, host: app.config.HOST });
  } catch (err) {
    app.log.error(err);

    process.exit(1);
  }
};

const closeGracefully = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}, shutting down gracefully`);

  try {
    await app.close();

    process.exit(0);
  } catch (error) {
    app.log.error(error);

    process.exit(1);
  }
};

process.on('SIGTERM', () => void closeGracefully('SIGTERM'));
process.on('SIGINT', () => void closeGracefully('SIGINT'));

void start();
