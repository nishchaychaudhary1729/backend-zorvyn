import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { createHandler } from "graphql-http/lib/use/express";
import { swaggerSpec } from "./config/swagger";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { schema } from "./graphql/schema";
import { root } from "./graphql/resolvers";
import { getAuthorizationFromRequest, getUserFromAuthHeader } from "./graphql/context";
import { AppError } from "./utils/errors";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import recordsRoutes from "./modules/records/records.routes";
import auditRoutes from "./modules/audit/audit.routes";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(
      process.env.NODE_ENV === "production"
        ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
        : ":method :url :status :response-time ms - :res[content-length]"
    )
  );
}
app.use(express.json({ limit: "10kb" }));
app.use(rateLimiter);

// API docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/audit-logs", auditRoutes);

// GraphQL (Dashboard only)
app.use(
  "/graphql",
  createHandler({
    schema,
    rootValue: root,
    context: (req) => {
      let user;
      try {
        const authorization = getAuthorizationFromRequest(req);
        user = getUserFromAuthHeader(authorization);
      } catch {
        user = undefined;
      }
      return { req, user };
    },
    formatError: (err: any) => {
      const original = err?.originalError;
      if (original instanceof AppError) {
        return {
          message: original.message,
          locations: err.locations,
          path: err.path,
          extensions: {
            code: original.statusCode,
            http: { status: original.statusCode },
          },
        };
      }
      return err;
    },
  })
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

export default app;
