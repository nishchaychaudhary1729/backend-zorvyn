import { Role } from "@prisma/client";
import { Request } from "express";

export interface GraphQLContext {
  req: Request;
  user?: {
    userId: string;
    role: Role;
  };
}
