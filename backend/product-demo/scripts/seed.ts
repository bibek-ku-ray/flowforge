import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/features/products/product.model.js";
import { productSeedDocs } from "../src/features/products/product.seed.js";
import { logger } from "../src/utils/logger.js";

async function main(): Promise<void> {
  await connectDB();

  await Product.deleteMany({});

  for (const doc of productSeedDocs) {
    await Product.create(doc);
  }

  logger.info(`Seeded ${productSeedDocs.length} products`);
  await disconnectDB();
}

main().catch(async (err) => {
  logger.error("Seed failed", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
