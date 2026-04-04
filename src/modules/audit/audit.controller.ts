import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import * as auditService from "./audit.service";
import { success } from "../../utils/apiResponse";

export async function listLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { logs, pagination } = await auditService.listLogs(req.query as any);
    
    // Support direct CSV downloads
    if (req.query.download === "true") {
      const headers = ["ID", "User ID", "User Email", "Action", "Resource", "Resource ID", "Created At"];
      const rows = logs.map((log: any) =>
        [
          log.id, 
          log.userId || "N/A", 
          log.user?.email || "N/A", 
          log.action, 
          log.resource, 
          log.resourceId || "N/A", 
          log.createdAt.toISOString()
        ].join(",")
      );
      
      const csv = [headers.join(","), ...rows].join("\n");
      
      res.header("Content-Type", "text/csv");
      res.attachment("audit_logs.csv");
      res.status(200).send(csv);
      return; 
    }

    success(res, logs, "Audit logs retrieved", 200, pagination);
  } catch (err) {
    next(err);
  }
}
