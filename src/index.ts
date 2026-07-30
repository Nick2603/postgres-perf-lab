import Fastify from 'fastify';
import { configPlugin } from './config/config.plugin.js';

const app = Fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    await app.register(configPlugin);

    app.get('/health', () => {
      return { status: 'ok' };
    });

    await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);

    process.exit(1);
  }
};

const closeGracefully = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}, shutting down gracefully`);

  await app.close();

  process.exit(0);
};

process.on('SIGTERM', () => void closeGracefully('SIGTERM'));
process.on('SIGINT', () => void closeGracefully('SIGINT'));

void start();
