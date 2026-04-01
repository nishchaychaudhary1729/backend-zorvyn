import app from "./app";
import { config } from "./config";
import prisma from "./lib/prisma";

async function main() {
  // Verify database connection
  await prisma.$connect();
  console.log("Database connected");

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`API docs: http://localhost:${config.port}/api/docs`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
