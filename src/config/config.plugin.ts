import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import { envSchema } from './env.schema.js';

export const configPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
    expandEnv: true,
    confKey: 'config',
  });
});
