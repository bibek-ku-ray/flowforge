import { z } from "zod";
import { AGE_GROUPS, PRODUCT_CATEGORIES } from "./product.types.js";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

const productCategorySchema = z.enum(PRODUCT_CATEGORIES);
const ageGroupSchema = z.enum(AGE_GROUPS);

const tagsSchema = z.array(z.string().trim().min(1).max(40)).default([]);
const imagesSchema = z.array(z.string().trim().min(1).max(2048)).default([]);

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: z
      .preprocess((v) => (v === "" || v === null ? undefined : v), z.string().trim().min(1).max(160))
      .optional(),
    description: z.string().trim().min(20).max(5000),
    category: productCategorySchema,
    ageGroup: ageGroupSchema,
    price: z.coerce.number().finite().min(0),
    stock: z.coerce.number().int().min(0),
    brand: z.string().trim().min(1).max(120),
    material: z
      .union([z.string().trim().min(1).max(120), emptyStringToUndefined])
      .optional(),
    color: z.union([z.string().trim().min(1).max(80), emptyStringToUndefined]).optional(),
    safetyCertified: z.boolean().optional().default(false),
    rating: z.coerce.number().finite().min(0).max(5).optional().default(0),
    tags: tagsSchema,
    images: imagesSchema,
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial().strict();

const boolFromQuery = z.preprocess((val) => {
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return undefined;
}, z.boolean().optional());

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["createdAt", "price", "name", "rating"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    category: productCategorySchema.optional(),
    ageGroup: ageGroupSchema.optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    isActive: boolFromQuery,
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (q.minPrice !== undefined && q.maxPrice !== undefined && q.minPrice > q.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice cannot be greater than maxPrice",
        path: ["minPrice"],
      });
    }
  });

export const productIdParamsSchema = z
  .object({
    id: z.string().length(24).regex(/^[a-fA-F0-9]+$/),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
