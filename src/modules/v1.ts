import type { FastifyPluginAsync } from 'fastify';
import { categoriesModule } from './categories/categories.module.js';

export const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(categoriesModule);
};
