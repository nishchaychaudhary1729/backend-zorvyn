import { Role } from "@prisma/client";
import { GraphQLContext } from "./types";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import * as dashboardService from "../modules/dashboard/dashboard.service";

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new UnauthorizedError("Unauthorized");
  return ctx.user;
}

function requireRole(userRole: Role, allowed: Role[]) {
  if (!allowed.includes(userRole)) {
    throw new ForbiddenError("You do not have permission to perform this action");
  }
}

export const root = {
  dashboardSummary: async (_args: unknown, ctx: GraphQLContext) => {
    const user = requireAuth(ctx);
    requireRole(user.role, [Role.VIEWER, Role.ANALYST, Role.ADMIN]);
    return dashboardService.getSummary();
  },

  dashboardCategoryTotals: async (_args: unknown, ctx: GraphQLContext) => {
    const user = requireAuth(ctx);
    requireRole(user.role, [Role.VIEWER, Role.ANALYST, Role.ADMIN]);
    return dashboardService.getCategoryTotals();
  },

  dashboardMonthlyTrends: async (
    args: { months?: number },
    ctx: GraphQLContext
  ) => {
    const user = requireAuth(ctx);
    requireRole(user.role, [Role.ANALYST, Role.ADMIN]);
    const months = Math.min(args.months ?? 12, 24);
    return dashboardService.getMonthlyTrends(months);
  },

  dashboardWeeklyTrends: async (
    args: { weeks?: number },
    ctx: GraphQLContext
  ) => {
    const user = requireAuth(ctx);
    requireRole(user.role, [Role.ANALYST, Role.ADMIN]);
    const weeks = Math.min(args.weeks ?? 12, 52);
    const rows = await dashboardService.getWeeklyTrends(weeks);
    return rows.map((row) => ({
      ...row,
      weekStart:
        row.weekStart instanceof Date
          ? row.weekStart.toISOString()
          : String(row.weekStart),
    }));
  },

  dashboardRecentActivity: async (
    args: { limit?: number },
    ctx: GraphQLContext
  ) => {
    const user = requireAuth(ctx);
    requireRole(user.role, [Role.VIEWER, Role.ANALYST, Role.ADMIN]);
    const limit = Math.min(args.limit ?? 10, 50);

    const rows = await dashboardService.getRecentActivity(limit);
    return rows.map((row) => {
      const record = row as unknown as {
        id: string;
        amount: unknown;
        type: string;
        category: string;
        date: Date;
        description?: string | null;
        createdAt: Date;
        createdBy: { id: string; name: string };
      };

      return {
        ...record,
        amount: Number(record.amount),
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
      };
    });
  },
};
