import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtPayload } from "../types";
import { UnauthorizedError } from "../utils/errors";

function pickHeaderValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function getHeaderFromUnknownRequest(req: unknown, headerName: string): string | undefined {
  if (!req || typeof req !== "object") return undefined;

  const anyReq = req as any;

  // Express-style helpers.
  if (typeof anyReq.get === "function") {
    return pickHeaderValue(anyReq.get(headerName));
  }
  if (typeof anyReq.header === "function") {
    return pickHeaderValue(anyReq.header(headerName));
  }

  const headers = anyReq.headers;
  if (headers && typeof headers === "object") {
    // WHATWG Headers
    if (typeof (headers as any).get === "function") {
      return pickHeaderValue((headers as any).get(headerName));
    }
    // Node/Express IncomingHttpHeaders (lowercase keys)
    return (
      pickHeaderValue((headers as any)[headerName.toLowerCase()]) ??
      pickHeaderValue((headers as any)[headerName])
    );
  }

  return undefined;
}

/**
 * Extracts the Authorization header from either:
 * - a graphql-http Request wrapper (has `headers` + `raw`), or
 * - an Express request.
 */
export function getAuthorizationFromRequest(req: unknown): string | undefined {
  // graphql-http adapters wrap the raw request under `raw`.
  const direct = getHeaderFromUnknownRequest(req, "authorization");
  if (direct) return direct;

  const raw = (req as any)?.raw;
  const fromRaw = getHeaderFromUnknownRequest(raw, "authorization");
  if (fromRaw) return fromRaw;

  // extra fallbacks just in case.
  return (
    getHeaderFromUnknownRequest((req as any)?.req, "authorization") ??
    getHeaderFromUnknownRequest((req as any)?.request, "authorization")
  );
}

export function getUserFromAuthHeader(authorization?: string): JwtPayload {
  if (!authorization?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authorization.split(" ")[1];
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
