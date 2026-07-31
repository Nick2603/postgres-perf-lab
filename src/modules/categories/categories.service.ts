import type { CategoriesRepository } from './categories.repository.js';
import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from './categories.schemas.js';

export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  listCategoriesPaginated(query: ListCategoriesQuery) {
    return this.repository.findAll(query);
  }

  getCategoryById(id: string) {
    return this.repository.findById(id);
  }

  async createCategory(input: CreateCategoryBody) {
    const existing = await this.repository.findBySlug(input.slug);

    if (existing) {
      throw new Error(`Category with slug "${input.slug}" already exists`);
    }

    return this.repository.create(input);
  }

  async updateCategory(id: string, input: UpdateCategoryBody) {
    if (input.slug) {
      const existing = await this.repository.findBySlug(input.slug);

      if (existing && existing.id !== id) {
        throw new Error(`Category with slug "${input.slug}" already exists`);
      }
    }

    return this.repository.update(id, input);
  }

  async deleteCategory(id: string) {
    return this.repository.delete(id);
  }
}
