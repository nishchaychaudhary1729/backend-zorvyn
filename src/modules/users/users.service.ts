import bcrypt from "bcrypt";
import { Prisma, Role, UserStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface ListUsersParams {
  page?: string;
  limit?: string;
  role?: Role;
  status?: UserStatus;
  search?: string;
}

export async function listUsers(params: ListUsersParams) {
  const { page, limit, skip } = parsePagination(params.page, params.limit);

  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (params.role) where.role = params.role;
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: USER_SELECT,
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: Role;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 8);

  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || Role.VIEWER,
      },
      select: USER_SELECT,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("Email is already registered");
    }
    throw err;
  }
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: Role; status?: UserStatus }
) {
  await getUserById(id); // throws if not found

  return prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  await getUserById(id);

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: id } });
}
