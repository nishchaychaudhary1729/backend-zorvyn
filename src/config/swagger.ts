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
    servers: [{ url: "http://localhost:3000", description: "Development server" }],
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
  // Keep this list aligned with routes that are actually mounted in src/app.ts
  // so Swagger UI doesn't advertise removed endpoints.
  apis: [
    "./src/modules/auth/auth.routes.ts",
    "./src/modules/users/users.routes.ts",
    "./src/modules/records/records.routes.ts",
    "./src/graphql/openapi.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
