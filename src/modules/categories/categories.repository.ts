import type { Pool } from 'pg';
import { categorySortFields } from './categories.schemas.js';

interface CategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  created_at: Date;
}

function toCategory(row: CategoryRow) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at.toISOString(),
  };
}

export type CategorySortField = (typeof categorySortFields)[number];

interface CursorPayload {
  sortValue: string;
  id: string;
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8')) as CursorPayload;
  } catch {
    throw new Error('Invalid cursor');
  }
}

export class CategoriesRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(options: {
    limit: number;
    cursor?: string;
    sortBy: CategorySortField;
    order: 'asc' | 'desc';
  }) {
    const { limit, cursor, sortBy, order } = options;

    const direction = order === 'asc' ? 'ASC' : 'DESC';
    const comparator = order === 'asc' ? '>' : '<';

    const values: unknown[] = [limit + 1];
    let whereClause = '';

    if (cursor) {
      const { sortValue, id } = decodeCursor(cursor);

      values.push(sortValue, id);

      whereClause = `WHERE (${sortBy}, id) ${comparator} ($2, $3)`;
    }

    const { rows } = await this.pool.query<CategoryRow>(
      `SELECT id, parent_id, name, slug, created_at
      FROM categories
      ${whereClause}
      ORDER BY ${sortBy} ${direction}, id ${direction}
      LIMIT $1`,
      values,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const nextCursor = hasMore
      ? encodeCursor({
          sortValue: String(
            page[page.length - 1]![sortBy === 'created_at' ? 'created_at' : sortBy],
          ),
          id: page[page.length - 1]!.id,
        })
      : null;

    return { data: page.map(toCategory), nextCursor };
  }

  async findById(id: string) {
    const { rows } = await this.pool.query<CategoryRow>(
      'SELECT id, parent_id, name, slug, created_at FROM categories WHERE id = $1',
      [id],
    );

    return rows[0] ? toCategory(rows[0]) : null;
  }

  async findBySlug(slug: string) {
    const { rows } = await this.pool.query<CategoryRow>(
      'SELECT id, parent_id, name, slug, created_at FROM categories WHERE slug = $1',
      [slug],
    );

    return rows[0] ? toCategory(rows[0]) : null;
  }

  async create(data: { name: string; slug: string; parentId?: string }) {
    const { rows } = await this.pool.query<CategoryRow>(
      `INSERT INTO categories (name, slug, parent_id)
       VALUES ($1, $2, $3)
       RETURNING id, parent_id, name, slug, created_at`,
      [data.name, data.slug, data.parentId ?? null],
    );

    const row = rows[0];

    if (!row) {
      throw new Error('Failed to create category');
    }

    return toCategory(row);
  }

  async update(id: string, data: { name?: string; slug?: string; parentId?: string }) {
    const { rows } = await this.pool.query<CategoryRow>(
      `UPDATE categories
      SET name = COALESCE($2, name),
          slug = COALESCE($3, slug),
          parent_id = COALESCE($4, parent_id)
      WHERE id = $1
      RETURNING id, parent_id, name, slug, created_at`,
      [id, data.name ?? null, data.slug ?? null, data.parentId ?? null],
    );

    return rows[0] ? toCategory(rows[0]) : null;
  }

  async delete(id: string) {
    const { rowCount } = await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);

    return rowCount === 1;
  }
}
