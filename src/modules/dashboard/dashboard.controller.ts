import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import * as dashboardService from "./dashboard.service";
import { success } from "../../utils/apiResponse";

export async function getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getSummary();
    success(res, data, "Dashboard summary retrieved");
  } catch (err) {
    next(err);
  }
}

export async function getCategoryTotals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getCategoryTotals();
    success(res, data, "Category totals retrieved");
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyTrends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const data = await dashboardService.getMonthlyTrends(Math.min(months, 24));
    success(res, data, "Monthly trends retrieved");
  } catch (err) {
    next(err);
  }
}

export async function getWeeklyTrends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const data = await dashboardService.getWeeklyTrends(Math.min(weeks, 52));
    success(res, data, "Weekly trends retrieved");
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await dashboardService.getRecentActivity(Math.min(limit, 50));
    success(res, data, "Recent activity retrieved");
  } catch (err) {
    next(err);
  }
}
