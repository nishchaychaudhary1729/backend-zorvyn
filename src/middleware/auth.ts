import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthenticatedRequest, JwtPayload } from "../types";
import { UnauthorizedError } from "../utils/errors";

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid authorization header"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (config.jwt.previousSecret) {
      try {
        const payload = jwt.verify(token, config.jwt.previousSecret) as JwtPayload;
        req.user = payload;
        next();
        return;
      } catch {
        // Fallback failed as well, drop through to reject
      }
    }
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
