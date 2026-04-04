import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finance Dashboard API",
      version: "1.0.0",
      description:
        "Backend API for a finance dashboard system with role-based access control. Supports user management, financial record CRUD (REST), and dashboard analytics (GraphQL at /graphql).",
      contact: { name: "API Support" },
    },
    servers: [{ url: "/", description: "Current server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Glob for both .ts (dev) and .js (production dist/) so annotations are
  // discovered regardless of the runtime environment.
  apis: [
    "./src/modules/auth/auth.routes.{ts,js}",
    "./src/modules/users/users.routes.{ts,js}",
    "./src/modules/records/records.routes.{ts,js}",
    "./src/modules/audit/audit.routes.{ts,js}",
    "./src/graphql/openapi.{ts,js}",
    "./dist/modules/auth/auth.routes.js",
    "./dist/modules/users/users.routes.js",
    "./dist/modules/records/records.routes.js",
    "./dist/modules/audit/audit.routes.js",
    "./dist/graphql/openapi.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
