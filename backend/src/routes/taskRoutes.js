import { Router } from "express";
import * as tasks from "../controllers/taskController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from "../validators/schemas.js";
import { z } from "zod";

const idParam = z.object({ id: z.string().cuid() });

const r = Router();

r.use(authenticate);

r.get("/dashboard/stats", tasks.dashboardStats);
r.get("/", validateQuery(taskQuerySchema), tasks.listTasks);
r.get("/:id", validateParams(idParam), tasks.getTask);

r.post("/", requireAdmin, validateBody(createTaskSchema), tasks.createTask);
r.patch("/:id", validateParams(idParam), validateBody(updateTaskSchema), tasks.updateTask);
r.delete("/:id", requireAdmin, validateParams(idParam), tasks.deleteTask);

export default r;
