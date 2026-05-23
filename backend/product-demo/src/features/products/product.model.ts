import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { slugify } from "../../utils/slugify.js";
import type { AgeGroup, ProductCategory } from "./product.types.js";

export interface ProductAttrs {
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  ageGroup: AgeGroup;
  price: number;
  stock: number;
  brand: string;
  material?: string;
  color?: string;
  safetyCertified: boolean;
  rating: number;
  tags: string[];
  images: string[];
  isActive: boolean;
}

export type ProductDoc = HydratedDocument<ProductAttrs>;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, index: true },
    ageGroup: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    stock: { type: Number, required: true, min: 0 },
    brand: { type: String, required: true, trim: true, maxlength: 120, index: true },
    material: { type: String, trim: true, maxlength: 120 },
    color: { type: String, trim: true, maxlength: 80 },
    safetyCertified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

productSchema.pre("validate", function (next) {
  const doc = this as ProductDoc;
  const slugValue = doc.slug;
  const nameValue = doc.name;
  if ((!slugValue || String(slugValue).trim() === "") && nameValue) {
    doc.slug = slugify(String(nameValue));
  }
  next();
});

productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model<ProductAttrs>("Product", productSchema);
