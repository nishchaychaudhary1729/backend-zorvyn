import { Prisma, RecordType } from "@prisma/client";
import prisma from "../../lib/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";

const RECORD_SELECT = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} as const;

interface ListRecordsParams {
  page?: string;
  limit?: string;
  type?: RecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: "date" | "amount" | "createdAt";
  order?: "asc" | "desc";
}

export async function listRecords(params: ListRecordsParams) {
  const { page, limit, skip } = parsePagination(params.page, params.limit);

  const where: Prisma.FinancialRecordWhereInput = { deletedAt: null };
  if (params.type) where.type = params.type;
  if (params.category) where.category = { contains: params.category, mode: "insensitive" };
  if (params.startDate || params.endDate) {
    where.date = {};
    if (params.startDate) where.date.gte = new Date(params.startDate);
    if (params.endDate) where.date.lte = new Date(params.endDate);
  }
  if (params.search) {
    where.OR = [
      { description: { contains: params.search, mode: "insensitive" } },
      { category: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.FinancialRecordOrderByWithRelationInput = {
    [params.sortBy || "date"]: params.order || "desc",
  };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      select: RECORD_SELECT,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getRecordById(id: string) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
    select: RECORD_SELECT,
  });
  if (!record) throw new NotFoundError("Financial record not found");
  return record;
}

export async function createRecord(
  data: {
    amount: number;
    type: RecordType;
    category: string;
    date: string;
    description?: string;
  },
  userId: string
) {
  return prisma.financialRecord.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      description: data.description,
      createdById: userId,
    },
    select: RECORD_SELECT,
  });
}

export async function updateRecord(
  id: string,
  data: {
    amount?: number;
    type?: RecordType;
    category?: string;
    date?: string;
    description?: string;
  }
) {
  await getRecordById(id);

  const updateData: Prisma.FinancialRecordUpdateInput = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.description !== undefined) updateData.description = data.description;

  return prisma.financialRecord.update({
    where: { id },
    data: updateData,
    select: RECORD_SELECT,
  });
}

export async function deleteRecord(id: string) {
  await getRecordById(id);
  // Soft delete
  await prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
