import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { success, created } from "../../utils/apiResponse";
import { logAction } from "../audit/audit.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    
    // Audit Log
    await logAction(result.user.id, "REGISTER", "Auth");
    
    created(res, result, "User registered successfully");
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Audit Log
    await logAction(result.user.id, "LOGIN", "Auth");
    
    success(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    success(res, result, "Token refreshed successfully");
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    success(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}
