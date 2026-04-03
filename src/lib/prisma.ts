import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : process.env.NODE_ENV === "test"
        ? []
        : ["error"],
});

export default prisma;
