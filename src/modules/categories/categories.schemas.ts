import { Type, type Static } from '@sinclair/typebox';

export const categorySchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  parentId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  name: Type.String(),
  slug: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export type Category = Static<typeof categorySchema>;

export const createCategoryBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
  parentId: Type.Optional(Type.String({ format: 'uuid' })),
});

export type CreateCategoryBody = Static<typeof createCategoryBodySchema>;

export const categoryParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export type CategoryParams = Static<typeof categoryParamsSchema>;

export const updateCategoryBodySchema = Type.Partial(createCategoryBodySchema);

export type UpdateCategoryBody = Static<typeof updateCategoryBodySchema>;

export const categorySortFields = ['created_at', 'name', 'slug'] as const;

export const listCategoriesQuerySchema = Type.Object({
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
  cursor: Type.Optional(Type.String()),
  sortBy: Type.Union([Type.Literal('created_at'), Type.Literal('name'), Type.Literal('slug')], {
    default: 'created_at',
  }),
  order: Type.Union([Type.Literal('asc'), Type.Literal('desc')], { default: 'desc' }),
});

export type ListCategoriesQuery = Static<typeof listCategoriesQuerySchema>;

export const paginatedCategoriesResponseSchema = Type.Object({
  data: Type.Array(categorySchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
});
