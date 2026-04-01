import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { ApiResponse } from "../types";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  console.error("Unhandled error:", err);

  const response: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  };
  res.status(500).json(response);
}
