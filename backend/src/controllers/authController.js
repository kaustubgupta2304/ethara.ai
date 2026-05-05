import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../utils/jwt.js";
import { HttpError } from "../middleware/errorHandler.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

function normEmail(email) {
  return String(email).trim().toLowerCase();
}

export async function register(req, res, next) {
  try {
    const { name, password } = req.body;
    const email = normEmail(req.body.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw HttpError(409, "Email already registered");
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "MEMBER" },
      select: userSelect,
    });
    const token = signToken({ sub: user.id, role: user.role });
    res.status(201).json({ success: true, data: { user, token } });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { password } = req.body;
    const email = normEmail(req.body.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw HttpError(401, "Invalid email or password");
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw HttpError(401, "Invalid email or password");
    }
    const safe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    const token = signToken({ sub: user.id, role: user.role });
    res.json({ success: true, data: { user: safe, token } });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });
    res.json({ success: true, data: { user } });
  } catch (e) {
    next(e);
  }
}
