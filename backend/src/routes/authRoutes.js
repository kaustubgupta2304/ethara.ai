import { Router } from "express";
import * as auth from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";

const r = Router();

r.post("/register", validateBody(registerSchema), auth.register);
r.post("/login", validateBody(loginSchema), auth.login);
r.get("/me", authenticate, auth.me);

export default r;
