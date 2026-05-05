import { HttpError } from "./errorHandler.js";

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "ADMIN") {
    return next(HttpError(403, "Admin access required"));
  }
  next();
}
