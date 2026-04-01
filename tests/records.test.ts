import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

let adminToken: string;
let viewerToken: string;
let recordId: string;

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create admin
  await request(app)
    .post("/api/auth/register")
    .send({ email: "recadmin@test.com", password: "AdminPass123", name: "Rec Admin" });
  await prisma.user.update({
    where: { email: "recadmin@test.com" },
    data: { role: "ADMIN" },
  });
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "recadmin@test.com", password: "AdminPass123" });
  adminToken = adminLogin.body.data.accessToken;

  // Create viewer
  await request(app)
    .post("/api/auth/register")
    .send({ email: "recviewer@test.com", password: "ViewerPass123", name: "Rec Viewer" });
  const viewerLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "recviewer@test.com", password: "ViewerPass123" });
  viewerToken = viewerLogin.body.data.accessToken;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/records", () => {
  it("should create a record (Admin)", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: "INCOME",
        category: "Salary",
        date: "2026-03-15",
        description: "Monthly salary",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("INCOME");
    expect(Number(res.body.data.amount)).toBe(5000);
    recordId = res.body.data.id;
  });

  it("should create an expense record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 150.5,
        type: "EXPENSE",
        category: "Food",
        date: "2026-03-20",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("EXPENSE");
  });

  it("should reject viewer creating record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        amount: 100,
        type: "INCOME",
        category: "Test",
        date: "2026-03-15",
      });

    expect(res.status).toBe(403);
  });

  it("should reject invalid amount", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: -100,
        type: "INCOME",
        category: "Test",
        date: "2026-03-15",
      });

    expect(res.status).toBe(400);
  });

  it("should reject invalid type", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: "INVALID",
        category: "Test",
        date: "2026-03-15",
      });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/records", () => {
  it("should list records (Viewer)", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it("should filter by type", async () => {
    const res = await request(app)
      .get("/api/records?type=INCOME")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => expect(r.type).toBe("INCOME"));
  });

  it("should filter by date range", async () => {
    const res = await request(app)
      .get("/api/records?startDate=2026-03-01&endDate=2026-03-31")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });

  it("should search records", async () => {
    const res = await request(app)
      .get("/api/records?search=salary")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/records/:id", () => {
  it("should get a record by ID", async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(recordId);
  });

  it("should return 404 for non-existent record", async () => {
    const res = await request(app)
      .get("/api/records/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/records/:id", () => {
  it("should update a record (Admin)", async () => {
    const res = await request(app)
      .patch(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 5500, description: "Updated salary" });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.amount)).toBe(5500);
  });

  it("should reject viewer updating record", async () => {
    const res = await request(app)
      .patch(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ amount: 9999 });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/records/:id", () => {
  it("should soft-delete a record (Admin)", async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    // Verify soft deleted
    const record = await prisma.financialRecord.findUnique({ where: { id: recordId } });
    expect(record?.deletedAt).not.toBeNull();
  });

  it("should not find the deleted record", async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
  });
});
