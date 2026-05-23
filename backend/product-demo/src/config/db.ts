import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", err);
  });

  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}
