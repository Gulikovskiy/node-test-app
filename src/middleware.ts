import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "./config";
import { createHttpError } from "./services";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authentication required"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, jwtSecret) as unknown as { id: number };
    req.userId = payload.id;
    next();
  } catch {
    return next(createHttpError(401, "Invalid or expired token"));
  }
}
