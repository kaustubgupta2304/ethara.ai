import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw HttpError(401, "Authentication required");
    }
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      throw HttpError(401, "User not found");
    }
    req.user = user;
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return next(HttpError(401, "Invalid or expired token"));
    }
    next(e);
  }
}
