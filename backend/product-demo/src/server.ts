import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}, shutting down...`);

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
