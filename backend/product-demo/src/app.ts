import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import { rateLimiter } from "./middlewares/rate-limiter.js";
import { requestId } from "./middlewares/request-id.js";
import { productRoutes } from "./features/products/product.routes.js";
import { sendItem } from "./utils/api-response.js";

morgan.token("request-id", (req: Request) => req.requestId);

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(":method :url :status :res[content-length] - :response-time ms :request-id"));

  app.get("/health", (_req, res) => {
    sendItem(res, 200, "OK", {
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(rateLimiter);
  app.use("/api/v1/products", productRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
