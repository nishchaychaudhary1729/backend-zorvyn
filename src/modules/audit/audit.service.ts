import prisma from "../../lib/prisma";

/**
 * Logs an action to the audit_logs table.
 * Designed to be fire-and-forget; failures will not crash the requesting transaction.
 */
export async function logAction(
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details ? JSON.parse(JSON.stringify(details)) : null, // ensure safe JSON serialization
      },
    });
  } catch (err) {
    // We intentionally swallow AuditLog errors to prevent breaking core features
    // In production, this might emit to a monitoring service (like Sentry/Datadog)
    console.error(`[Audit Log Failed]: ${action} on ${resource}`, err);
  }
}

export async function listLogs(params: {
  page?: string;
  limit?: string;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(params.limit || "20", 10)));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.resource) where.resource = params.resource;
  
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = new Date(params.startDate);
    if (params.endDate) where.createdAt.lte = new Date(params.endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
