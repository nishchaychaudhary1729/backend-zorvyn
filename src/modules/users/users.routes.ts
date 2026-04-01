import { Router } from "express";
import { Role } from "@prisma/client";
import * as usersController from "./users.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createUserSchema, updateUserSchema, listUsersQuerySchema } from "./users.validation";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user details }
 */
router.get("/me", usersController.getMe);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of users }
 */
router.get(
  "/",
  authorize(Role.ADMIN),
  validate(listUsersQuerySchema, "query"),
  usersController.listUsers
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User details }
 *       404: { description: User not found }
 */
router.get("/:id", authorize(Role.ADMIN), usersController.getUserById);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               role: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *     responses:
 *       201: { description: User created }
 */
router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createUserSchema),
  usersController.createUser
);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
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
 *               name: { type: string }
 *               role: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200: { description: User updated }
 */
router.patch(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateUserSchema),
  usersController.updateUser
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: User deleted }
 */
router.delete("/:id", authorize(Role.ADMIN), usersController.deleteUser);

export default router;
