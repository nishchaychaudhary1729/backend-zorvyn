import { Router } from "express";
import { Role } from "@prisma/client";
import * as auditController from "./audit.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { listAuditLogsQuerySchema } from "./audit.validation";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: List or download audit logs (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: resource
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: download
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Set to 'true' to receive a CSV file download
 *     responses:
 *       200: 
 *         description: List of audit logs, or a CSV file attachment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/",
  authorize(Role.ADMIN),
  validate(listAuditLogsQuerySchema, "query"),
  auditController.listLogs
);

export default router;
