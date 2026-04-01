import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

const TEST_USER = {
  email: "testauth@example.com",
  password: "TestPass123",
  name: "Test Auth User",
};

beforeAll(async () => {
  // Clean test data
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("should reject duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it("should reject invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, email: "invalid" });
    expect(res.status).toBe(400);
  });

  it("should reject weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, email: "weak@test.com", password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should reject invalid password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "WrongPass123" });
    expect(res.status).toBe(401);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "noone@test.com", password: "TestPass123" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    refreshToken = res.body.data.refreshToken;
  });

  it("should refresh tokens", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should reject invalid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("should logout successfully", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: loginRes.body.data.refreshToken });

    expect(res.status).toBe(200);
  });
});
