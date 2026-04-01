import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse } from "../types";

export function validate(schema: z.ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue: z.core.$ZodIssue) => {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });

      const response: ApiResponse = {
        success: false,
        message: "Validation failed",
        errors,
      };
      res.status(400).json(response);
      return;
    }
    req[source] = result.data;
    next();
  };
}
