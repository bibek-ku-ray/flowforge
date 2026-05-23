import type { FilterQuery } from "mongoose";
import { Product, type ProductDoc } from "./product.model.js";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./product.schema.js";
import { buildProductListQuery } from "../../utils/query-builder.js";

export type PaginatedProducts = {
  items: ProductDoc[];
  total: number;
  page: number;
  limit: number;
};

export class ProductRepository {
  async create(data: CreateProductInput): Promise<ProductDoc> {
    return Product.create(data);
  }

  async findById(id: string): Promise<ProductDoc | null> {
    return Product.findById(id);
  }

  async findBySlug(slug: string): Promise<ProductDoc | null> {
    return Product.findOne({ slug: slug.toLowerCase() });
  }

  async findBySlugExcludingId(slug: string, excludeId: string): Promise<ProductDoc | null> {
    return Product.findOne({ slug: slug.toLowerCase(), _id: { $ne: excludeId } });
  }

  async findAll(query: ListProductsQuery): Promise<PaginatedProducts> {
    const { filter, sort, skip, limit, page } = buildProductListQuery(query);

    const [items, total] = await Promise.all([
      Product.find(filter as FilterQuery<ProductDoc>).sort(sort).skip(skip).limit(limit).exec(),
      Product.countDocuments(filter as FilterQuery<ProductDoc>).exec(),
    ]);

    return { items, total, page, limit };
  }

  async updateById(id: string, data: UpdateProductInput): Promise<ProductDoc | null> {
    const doc = await Product.findById(id);
    if (!doc) return null;

    const patch = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined),
    ) as UpdateProductInput;

    doc.set(patch);
    await doc.save();
    return doc;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return result !== null;
  }
}

export const productRepository = new ProductRepository();
