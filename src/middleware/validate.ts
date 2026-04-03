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

    // Express 5 exposes `req.query` (and sometimes `req.params`) as getter-only.
    // Do not assign to `req[source]` directly; mutate the existing object.
    if (source === "body") {
      (req as any).body = result.data;
    } else {
      const target = (req as any)[source];
      if (target && typeof target === "object") {
        for (const key of Object.keys(target)) {
          delete target[key];
        }
        Object.assign(target, result.data as any);
      }
    }
    next();
  };
}
