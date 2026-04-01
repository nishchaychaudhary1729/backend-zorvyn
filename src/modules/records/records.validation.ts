import { z } from "zod";
import { RecordType } from "@prisma/client";

export const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.nativeEnum(RecordType, { error: "Type must be INCOME or EXPENSE" }),
  category: z.string().min(1, "Category is required").max(50),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  description: z.string().max(500).optional(),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.nativeEnum(RecordType).optional(),
  category: z.string().min(1).max(50).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional(),
  description: z.string().max(500).optional(),
});

export const listRecordsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.nativeEnum(RecordType).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "amount", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
