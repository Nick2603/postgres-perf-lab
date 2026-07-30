import type { EnvConfig } from '../config/env.schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
  }
}
