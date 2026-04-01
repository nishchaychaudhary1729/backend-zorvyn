import { Response } from "express";
import { ApiResponse, PaginationResult } from "../types";

export function success<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  pagination?: PaginationResult
): void {
  const response: ApiResponse<T> = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  res.status(statusCode).json(response);
}

export function created<T>(res: Response, data: T, message = "Created"): void {
  success(res, data, message, 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}
