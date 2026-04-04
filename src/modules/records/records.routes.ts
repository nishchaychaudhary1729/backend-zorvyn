import { Router } from "express";
import { Role } from "@prisma/client";
import * as recordsController from "./records.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema,
  transferSchema,
  batchCreateSchema,
} from "./records.validation";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags: [Financial Records]
 *     summary: List financial records with filtering & pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200: { description: List of financial records }
 */
router.get(
  "/",
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  validate(listRecordsQuerySchema, "query"),
  recordsController.listRecords
);

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags: [Financial Records]
 *     summary: Get a financial record by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Financial record }
 *       404: { description: Record not found }
 */
router.get(
  "/:id",
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  recordsController.getRecordById
);

/**
 * @openapi
 * /api/records:
 *   post:
 *     tags: [Financial Records]
 *     summary: Create a financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       201: { description: Record created }
 */
router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createRecordSchema),
  recordsController.createRecord
);

/**
 * @openapi
 * /api/records/transfer:
 *   post:
 *     tags: [Financial Records]
 *     summary: Atomically transfer funds between categories (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, fromCategory, toCategory, date]
 *             properties:
 *               amount: { type: number }
 *               fromCategory: { type: string }
 *               toCategory: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       201: { description: Transfer successful }
 */
router.post(
  "/transfer",
  authorize(Role.ADMIN),
  validate(transferSchema),
  recordsController.transferRecord
);

/**
 * @openapi
 * /api/records/batch:
 *   post:
 *     tags: [Financial Records]
 *     summary: Atomically create multiple records (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [records]
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [amount, type, category, date]
 *                   properties:
 *                     amount: { type: number }
 *                     type: { type: string, enum: [INCOME, EXPENSE] }
 *                     category: { type: string }
 *                     date: { type: string, format: date }
 *                     description: { type: string }
 *     responses:
 *       201: { description: Batch created }
 */
router.post(
  "/batch",
  authorize(Role.ADMIN),
  validate(batchCreateSchema),
  recordsController.batchCreateRecords
);

/**
 * @openapi
 * /api/records/{id}:
 *   patch:
 *     tags: [Financial Records]
 *     summary: Update a financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       200: { description: Record updated }
 */
router.patch(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateRecordSchema),
  recordsController.updateRecord
);

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags: [Financial Records]
 *     summary: Soft-delete a financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Record deleted }
 */
router.delete(
  "/:id",
  authorize(Role.ADMIN),
  recordsController.deleteRecord
);

export default router;
