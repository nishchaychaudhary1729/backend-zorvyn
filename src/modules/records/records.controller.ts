import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import * as recordsService from "./records.service";
import { success, created, noContent } from "../../utils/apiResponse";
import { logAction } from "../audit/audit.service";

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
    await logAction(req.user!.userId, "CREATE_RECORD", "FinancialRecord", record.id);
    created(res, record, "Record created");
  } catch (err) {
    next(err);
  }
}

export async function updateRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.updateRecord(req.params.id as string, req.body);
    await logAction(req.user!.userId, "UPDATE_RECORD", "FinancialRecord", record.id, req.body);
    success(res, record, "Record updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await recordsService.deleteRecord(req.params.id as string);
    await logAction(req.user!.userId, "DELETE_RECORD", "FinancialRecord", req.params.id as string);
    noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function transferRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await recordsService.transferFunds(req.body, req.user!.userId);
    await logAction(req.user!.userId, "TRANSFER_FUNDS", "FinancialRecord", undefined, {
      fromCategory: req.body.fromCategory,
      toCategory: req.body.toCategory,
      amount: req.body.amount
    });
    success(res, result, "Transfer successful", 201);
  } catch (err) {
    next(err);
  }
}

export async function batchCreateRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { records } = req.body;
    const result = await recordsService.batchCreate(records, req.user!.userId);
    await logAction(req.user!.userId, "BATCH_CREATE", "FinancialRecord", undefined, { count: records.length });
    created(res, result, "Records batch created");
  } catch (err) {
    next(err);
  }
}
