import { buildApp } from './app.js';

const app = await buildApp();

const start = async (): Promise<void> => {
  try {
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
