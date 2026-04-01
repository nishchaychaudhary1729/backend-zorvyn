import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

let analystToken: string;
let viewerToken: string;

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create admin to seed records
  await request(app)
    .post("/api/auth/register")
    .send({ email: "dashadmin@test.com", password: "AdminPass123", name: "Dash Admin" });
  await prisma.user.update({
    where: { email: "dashadmin@test.com" },
    data: { role: "ADMIN" },
  });
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "dashadmin@test.com", password: "AdminPass123" });
  const adminToken = adminLogin.body.data.accessToken;

  // Create analyst
  await request(app)
    .post("/api/auth/register")
    .send({ email: "dashanalyst@test.com", password: "AnalystPass123", name: "Dash Analyst" });
  await prisma.user.update({
    where: { email: "dashanalyst@test.com" },
    data: { role: "ANALYST" },
  });
  const analystLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "dashanalyst@test.com", password: "AnalystPass123" });
  analystToken = analystLogin.body.data.accessToken;

  // Create viewer
  await request(app)
    .post("/api/auth/register")
    .send({ email: "dashviewer@test.com", password: "ViewerPass123", name: "Dash Viewer" });
  const viewerLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "dashviewer@test.com", password: "ViewerPass123" });
  viewerToken = viewerLogin.body.data.accessToken;

  // Seed some records
  const records = [
    { amount: 5000, type: "INCOME", category: "Salary", date: "2026-03-01" },
    { amount: 2000, type: "INCOME", category: "Freelance", date: "2026-03-05" },
    { amount: 500, type: "EXPENSE", category: "Food", date: "2026-03-10" },
    { amount: 1200, type: "EXPENSE", category: "Rent", date: "2026-03-01" },
    { amount: 300, type: "EXPENSE", category: "Utilities", date: "2026-02-15" },
  ];

  for (const rec of records) {
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(rec);
  }
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/dashboard/summary", () => {
  it("should return summary (Viewer)", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("totalIncome");
    expect(res.body.data).toHaveProperty("totalExpenses");
    expect(res.body.data).toHaveProperty("netBalance");
    expect(res.body.data.totalIncome).toBe(7000);
    expect(res.body.data.totalExpenses).toBe(2000);
    expect(res.body.data.netBalance).toBe(5000);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/dashboard/categories", () => {
  it("should return category totals", async () => {
    const res = await request(app)
      .get("/api/dashboard/categories")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("category");
    expect(res.body.data[0]).toHaveProperty("total");
  });
});

describe("GET /api/dashboard/trends/monthly", () => {
  it("should return monthly trends (Analyst)", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends/monthly")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should reject viewer accessing trends", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends/monthly")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/dashboard/trends/weekly", () => {
  it("should return weekly trends (Analyst)", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends/weekly")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/dashboard/recent", () => {
  it("should return recent activity", async () => {
    const res = await request(app)
      .get("/api/dashboard/recent?limit=3")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });
});
