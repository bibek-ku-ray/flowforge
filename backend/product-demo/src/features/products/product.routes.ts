import { Router } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import * as productController from "./product.controller.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductSchema,
} from "./product.schema.js";

const router = Router();

router.post(
  "/",
  validateRequest({ body: createProductSchema }),
  productController.createProduct,
);

router.get(
  "/",
  validateRequest({ query: listProductsQuerySchema }),
  productController.listProducts,
);

router.get(
  "/:id",
  validateRequest({ params: productIdParamsSchema }),
  productController.getProductById,
);

router.patch(
  "/:id",
  validateRequest({ params: productIdParamsSchema, body: updateProductSchema }),
  productController.updateProduct,
);

router.delete(
  "/:id",
  validateRequest({ params: productIdParamsSchema }),
  productController.deleteProduct,
);

export const productRoutes = router;
