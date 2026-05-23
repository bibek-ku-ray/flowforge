import type { FilterQuery } from "mongoose";
import type { ProductDoc } from "../features/products/product.model.js";
import type { ListProductsQuery } from "../features/products/product.schema.js";

export type BuiltProductQuery = {
  filter: FilterQuery<ProductDoc>;
  sort: Record<string, 1 | -1>;
  skip: number;
  limit: number;
  page: number;
};

const ALLOWED_SORT_FIELDS = ["createdAt", "price", "name", "rating"] as const;

export function buildProductListQuery(query: ListProductsQuery): BuiltProductQuery {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ProductDoc> = {};

  if (query.isActive === undefined) {
    filter.isActive = true;
  } else {
    filter.isActive = query.isActive;
  }

  if (query.category) filter.category = query.category;
  if (query.ageGroup) filter.ageGroup = query.ageGroup;
  if (query.brand) filter.brand = query.brand;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) {
      filter.price.$gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      filter.price.$lte = query.maxPrice;
    }
  }

  if (query.search?.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  const sortField = ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  return { filter, sort, skip, limit, page };
}
