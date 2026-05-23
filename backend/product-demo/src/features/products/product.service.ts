import mongoose from "mongoose";
import { ApiError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import { productRepository } from "./product.repository.js";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./product.schema.js";
import type { ProductDoc } from "./product.model.js";

function assertValidObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.invalidId();
  }
  if (new mongoose.Types.ObjectId(id).toString() !== id) {
    throw ApiError.invalidId();
  }
}

async function assertUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const normalized = slug.toLowerCase();
  const existing = excludeId
    ? await productRepository.findBySlugExcludingId(normalized, excludeId)
    : await productRepository.findBySlug(normalized);
  if (existing) {
    throw ApiError.duplicateSlug();
  }
}

export class ProductService {
  async createProduct(input: CreateProductInput): Promise<ProductDoc> {
    const slug = input.slug ?? slugify(input.name);
    await assertUniqueSlug(slug);
    return productRepository.create({ ...input, slug });
  }

  async getProductById(id: string): Promise<ProductDoc> {
    assertValidObjectId(id);
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound();
    }
    return product;
  }

  async listProducts(query: ListProductsQuery): Promise<{
    items: ProductDoc[];
    total: number;
    page: number;
    limit: number;
  }> {
    return productRepository.findAll(query);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductDoc> {
    assertValidObjectId(id);

    if (input.slug !== undefined) {
      await assertUniqueSlug(input.slug, id);
    }

    const updated = await productRepository.updateById(id, input);
    if (!updated) {
      throw ApiError.notFound();
    }
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    assertValidObjectId(id);
    const deleted = await productRepository.deleteById(id);
    if (!deleted) {
      throw ApiError.notFound();
    }
  }
}

export const productService = new ProductService();
