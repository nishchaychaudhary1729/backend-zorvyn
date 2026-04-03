import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import { config } from "../../config";
import { JwtPayload } from "../../types";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/errors";

const SALT_ROUNDS = 8;

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

function getRefreshTokenExpiry(): Date {
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit] || 86400000;
  return new Date(Date.now() + value * ms);
}

export async function register(email: string, password: string, name: string) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  let user: { id: string; email: string; name: string; role: any; status: any; createdAt: Date };
  try {
    user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("Email is already registered");
    }
    throw err;
  }

  const tokenPayload: JwtPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken();

  const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) throw new UnauthorizedError("Invalid email or password");

  if (user.status === "INACTIVE") throw new BadRequestError("Account is inactive");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError("Invalid email or password");

  const tokenPayload: JwtPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken();

  const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const { password: _, deletedAt: __, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

export async function refresh(refreshToken: string) {
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!storedToken) throw new UnauthorizedError("Invalid refresh token");
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError("Refresh token has expired");
  }

  if (storedToken.user.deletedAt || storedToken.user.status === "INACTIVE") {
    throw new UnauthorizedError("Account is not active");
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokenPayload: JwtPayload = { userId: storedToken.user.id, role: storedToken.user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken();

  const hashedNewToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
  await prisma.refreshToken.create({
    data: {
      token: hashedNewToken,
      userId: storedToken.user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.deleteMany({ where: { token: hashedToken } });
}
