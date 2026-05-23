export const PRODUCT_CATEGORIES = [
  "building-blocks",
  "educational-toys",
  "soft-toys",
  "remote-control",
  "art-craft",
  "puzzles",
  "outdoor-toys",
  "pretend-play",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const AGE_GROUPS = ["0-2", "3-5", "6-8", "9-12"] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export type ProductJSON = {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
};
