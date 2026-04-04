import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import * as usersService from "./users.service";
import { success, created, noContent } from "../../utils/apiResponse";
import { logAction } from "../audit/audit.service";

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { users, pagination } = await usersService.listUsers(req.query as any);
    success(res, users, "Users retrieved", 200, pagination);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id as string);
    success(res, user, "User retrieved");
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.user!.userId);
    success(res, user, "Current user retrieved");
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    await logAction(req.user!.userId, "CREATE_USER", "User", user.id);
    created(res, user, "User created");
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body);
    await logAction(req.user!.userId, "UPDATE_USER", "User", user.id, req.body);
    success(res, user, "User updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.params.id as string);
    await logAction(req.user!.userId, "DELETE_USER", "User", req.params.id as string);
    noContent(res);
  } catch (err) {
    next(err);
  }
}
