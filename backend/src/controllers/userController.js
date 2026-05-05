import { prisma } from "../lib/prisma.js";

export async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ success: true, data: { users } });
  } catch (e) {
    next(e);
  }
}
