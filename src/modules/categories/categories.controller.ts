import '@fastify/postgres';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import {
  categorySchema,
  createCategoryBodySchema,
  categoryParamsSchema,
  updateCategoryBodySchema,
  paginatedCategoriesResponseSchema,
  listCategoriesQuerySchema,
} from './categories.schemas.js';
import { Type } from '@sinclair/typebox';

export const categoriesController: FastifyPluginAsyncTypebox = async (app) => {
  const repository = new CategoriesRepository(app.pg.pool);

  const service = new CategoriesService(repository);

  const errorResponseSchema = Type.Object({
    message: Type.String(),
  });

  app.get(
    '/categories',
    {
      schema: {
        querystring: listCategoriesQuerySchema,
        response: { 200: paginatedCategoriesResponseSchema },
      },
    },
    async (request) => service.listCategoriesPaginated(request.query),
  );

  app.get(
    '/categories/:id',
    {
      schema: {
        params: categoryParamsSchema,
        response: {
          200: categorySchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const category = await service.getCategoryById(request.params.id);

      if (!category) {
        return reply.code(404).send({ message: 'Category not found' });
      }

      return category;
    },
  );

  app.post(
    '/categories',
    {
      schema: {
        body: createCategoryBodySchema,
        response: { 201: categorySchema },
      },
    },
    async (request, reply) => {
      const category = await service.createCategory(request.body);

      return reply.code(201).send(category);
    },
  );

  app.patch(
    '/categories/:id',
    {
      schema: {
        params: categoryParamsSchema,
        body: updateCategoryBodySchema,
        response: {
          200: categorySchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const category = await service.updateCategory(request.params.id, request.body);
      if (!category) {
        return reply.code(404).send({ message: 'Category not found' });
      }
      return category;
    },
  );

  app.delete(
    '/categories/:id',
    {
      schema: {
        params: categoryParamsSchema,
        response: {
          204: Type.Never(),
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const deleted = await service.deleteCategory(request.params.id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Category not found' });
      }
      return reply.code(204).send();
    },
  );
};
