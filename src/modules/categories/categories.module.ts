import type { FastifyPluginAsync } from 'fastify';
import { categoriesController } from './categories.controller.js';

export const categoriesModule: FastifyPluginAsync = async (app) => {
  await app.register(categoriesController);
};
