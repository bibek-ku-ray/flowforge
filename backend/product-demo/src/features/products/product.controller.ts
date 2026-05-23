import type { Request, Response } from "express";
import { sendItem, sendList } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./product.schema.js";
import { productService } from "./product.service.js";

function toJSON(doc: unknown): unknown {
  if (doc && typeof doc === "object" && "toJSON" in doc && typeof (doc as { toJSON: () => unknown }).toJSON === "function") {
    return (doc as { toJSON: () => unknown }).toJSON();
  }
  return doc;
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateProductInput;
  const product = await productService.createProduct(body);
  sendItem(res, 201, "Product created successfully", toJSON(product));
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListProductsQuery;
  const { items, total, page, limit } = await productService.listProducts(query);

  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  sendList(res, 200, "Products retrieved successfully", { page, limit, total, totalPages }, items.map((p) => toJSON(p)));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const product = await productService.getProductById(id);
  sendItem(res, 200, "Product retrieved successfully", toJSON(product));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateProductInput;
  const product = await productService.updateProduct(id, body);
  sendItem(res, 200, "Product updated successfully", toJSON(product));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await productService.deleteProduct(id);
  res.status(204).send();
});
