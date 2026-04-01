import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export async function getSummary() {
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { type: "INCOME", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.aggregate({
      where: { type: "EXPENSE", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount || 0);
  const totalExpenses = Number(expenseResult._sum.amount || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeCount: incomeResult._count,
    expenseCount: expenseResult._count,
  };
}

export async function getCategoryTotals() {
  const results = await prisma.$queryRaw<
    { type: string; category: string; total: Prisma.Decimal; count: bigint }[]
  >`
    SELECT type, category, SUM(amount) as total, COUNT(*)::int as count
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY type, category
    ORDER BY total DESC
  `;

  return results.map((r) => ({
    type: r.type,
    category: r.category,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

export async function getMonthlyTrends(months = 12) {
  const results = await prisma.$queryRaw<
    { month: string; type: string; total: Prisma.Decimal; count: bigint }[]
  >`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      type,
      SUM(amount) as total,
      COUNT(*)::int as count
    FROM financial_records
    WHERE deleted_at IS NULL
      AND date >= NOW() - MAKE_INTERVAL(months => ${months})
    GROUP BY month, type
    ORDER BY month ASC, type ASC
  `;

  return results.map((r) => ({
    month: r.month,
    type: r.type,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

export async function getRecentActivity(limit = 10) {
  return prisma.financialRecord.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      description: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getWeeklyTrends(weeks = 12) {
  const results = await prisma.$queryRaw<
    { week: string; week_start: Date; type: string; total: Prisma.Decimal; count: bigint }[]
  >`
    SELECT 
      TO_CHAR(DATE_TRUNC('week', date), 'YYYY-"W"IW') as week,
      DATE_TRUNC('week', date) as week_start,
      type,
      SUM(amount) as total,
      COUNT(*)::int as count
    FROM financial_records
    WHERE deleted_at IS NULL
      AND date >= NOW() - MAKE_INTERVAL(weeks => ${weeks})
    GROUP BY week, week_start, type
    ORDER BY week_start ASC, type ASC
  `;

  return results.map((r) => ({
    week: r.week,
    weekStart: r.week_start,
    type: r.type,
    total: Number(r.total),
    count: Number(r.count),
  }));
}
