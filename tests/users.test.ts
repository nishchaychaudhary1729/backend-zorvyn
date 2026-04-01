import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

let adminToken: string;
let viewerToken: string;
let createdUserId: string;

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Register admin
  const adminReg = await request(app)
    .post("/api/auth/register")
    .send({ email: "admin@test.com", password: "AdminPass123", name: "Admin" });
  // Promote to ADMIN
  await prisma.user.update({
    where: { email: "admin@test.com" },
    data: { role: "ADMIN" },
  });
  // Re-login to get token with ADMIN role
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@test.com", password: "AdminPass123" });
  adminToken = adminLogin.body.data.accessToken;

  // Register viewer
  await request(app)
    .post("/api/auth/register")
    .send({ email: "viewer@test.com", password: "ViewerPass123", name: "Viewer" });
  const viewerLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "viewer@test.com", password: "ViewerPass123" });
  viewerToken = viewerLogin.body.data.accessToken;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/users/me", () => {
  it("should return current user", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("admin@test.com");
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/users (Admin)", () => {
  it("should create a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newuser@test.com",
        password: "NewUser123",
        name: "New User",
        role: "ANALYST",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("ANALYST");
    createdUserId = res.body.data.id;
  });

  it("should reject viewer creating user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        email: "nope@test.com",
        password: "NopePass123",
        name: "Nope",
      });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/users (Admin)", () => {
  it("should list users with pagination", async () => {
    const res = await request(app)
      .get("/api/users?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should filter users by role", async () => {
    const res = await request(app)
      .get("/api/users?role=ANALYST")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((u: any) => expect(u.role).toBe("ANALYST"));
  });

  it("should search users", async () => {
    const res = await request(app)
      .get("/api/users?search=admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should reject viewer listing users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/:id (Admin)", () => {
  it("should update user role", async () => {
    const res = await request(app)
      .patch(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "VIEWER" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("VIEWER");
  });
});

describe("DELETE /api/users/:id (Admin)", () => {
  it("should soft-delete a user", async () => {
    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    // Verify soft deleted
    const user = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(user?.deletedAt).not.toBeNull();
    expect(user?.status).toBe("INACTIVE");
  });
});
