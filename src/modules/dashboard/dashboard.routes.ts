import { Router } from "express";
import { Role } from "@prisma/client";
import * as dashboardController from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

// Dashboard routes accessible by all authenticated users (Viewer, Analyst, Admin)

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get financial summary (totals, net balance)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Financial summary }
 */
router.get(
  "/summary",
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  dashboardController.getSummary
);

/**
 * @openapi
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category-wise totals
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Category totals }
 */
router.get(
  "/categories",
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  dashboardController.getCategoryTotals
);

/**
 * @openapi
 * /api/dashboard/trends/monthly:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly income/expense trends
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Monthly trends }
 */
router.get(
  "/trends/monthly",
  authorize(Role.ANALYST, Role.ADMIN),
  dashboardController.getMonthlyTrends
);

/**
 * @openapi
 * /api/dashboard/trends/weekly:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get weekly income/expense trends
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Weekly trends }
 */
router.get(
  "/trends/weekly",
  authorize(Role.ANALYST, Role.ADMIN),
  dashboardController.getWeeklyTrends
);

/**
 * @openapi
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent financial activity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Recent activity }
 */
router.get(
  "/recent",
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  dashboardController.getRecentActivity
);

export default router;
