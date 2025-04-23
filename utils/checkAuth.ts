import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError.js";

interface StaffSession {
  staff?: {
    id: number;
    email: string;
    role: string;
  };
}
export default function checkAuth(
  req: Request & { session: StaffSession },
  res: Response,
  next: NextFunction
) {
  if (!req.session.staff) {
    return next(new AppError("unauthorized", 401));
  }
  next();
}
