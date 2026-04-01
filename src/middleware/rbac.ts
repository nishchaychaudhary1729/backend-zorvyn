import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../types";
import { ForbiddenError } from "../utils/errors";

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError("No user context found"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }

    next();
  };
}
