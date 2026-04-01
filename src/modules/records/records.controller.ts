import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import * as recordsService from "./records.service";
import { success, created, noContent } from "../../utils/apiResponse";

export async function listRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { records, pagination } = await recordsService.listRecords(req.query as any);
    success(res, records, "Records retrieved", 200, pagination);
  } catch (err) {
    next(err);
  }
}

export async function getRecordById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.getRecordById(req.params.id as string);
    success(res, record, "Record retrieved");
  } catch (err) {
    next(err);
  }
}

export async function createRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.createRecord(req.body, req.user!.userId);
    created(res, record, "Record created");
  } catch (err) {
    next(err);
  }
}

export async function updateRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.updateRecord(req.params.id as string, req.body);
    success(res, record, "Record updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await recordsService.deleteRecord(req.params.id as string);
    noContent(res);
  } catch (err) {
    next(err);
  }
}
