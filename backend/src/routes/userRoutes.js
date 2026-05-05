import { Router } from "express";
import * as users from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const r = Router();

r.use(authenticate, requireAdmin);
r.get("/", users.listUsers);

export default r;
