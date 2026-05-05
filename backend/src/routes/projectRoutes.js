import { Router } from "express";
import * as projects from "../controllers/projectController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectMemberSchema,
} from "../validators/schemas.js";
import { z } from "zod";

const idParam = z.object({ id: z.string().cuid() });
const projectUserParams = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
});

const r = Router();

r.use(authenticate);

r.get("/", projects.listProjects);
r.get("/:id", validateParams(idParam), projects.getProject);

r.post("/", requireAdmin, validateBody(createProjectSchema), projects.createProject);
r.patch("/:id", requireAdmin, validateParams(idParam), validateBody(updateProjectSchema), projects.updateProject);
r.delete("/:id", requireAdmin, validateParams(idParam), projects.deleteProject);

r.post(
  "/:id/members",
  requireAdmin,
  validateParams(idParam),
  validateBody(projectMemberSchema),
  projects.addMember
);
r.delete(
  "/:id/members/:userId",
  requireAdmin,
  validateParams(projectUserParams),
  projects.removeMember
);

export default r;
