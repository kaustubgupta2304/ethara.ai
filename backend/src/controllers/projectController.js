import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";

function projectInclude() {
  return {
    createdBy: { select: { id: true, name: true, email: true } },
    members: {
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    },
    _count: { select: { tasks: true } },
  };
}

export async function listProjects(req, res, next) {
  try {
    const { id, role } = req.user;
    let where = {};
    if (role === "MEMBER") {
      where = {
        members: { some: { userId: id } },
      };
    }
    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: projectInclude(),
    });
    res.json({ success: true, data: { projects } });
  } catch (e) {
    next(e);
  }
}

export async function getProject(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude(),
    });
    if (!project) {
      throw HttpError(404, "Project not found");
    }
    await assertProjectAccess(req.user, project.id);
    res.json({ success: true, data: { project } });
  } catch (e) {
    next(e);
  }
}

async function assertProjectAccess(user, projectId) {
  if (user.role === "ADMIN") {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p) throw HttpError(404, "Project not found");
    return;
  }
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!m) {
    throw HttpError(403, "You are not a member of this project");
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        createdById: req.user.id,
        members: {
          create: { userId: req.user.id },
        },
      },
      include: projectInclude(),
    });
    res.status(201).json({ success: true, data: { project } });
  } catch (e) {
    next(e);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw HttpError(404, "Project not found");
    }
    const { name, description } = req.body;
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: projectInclude(),
    });
    res.json({ success: true, data: { project: updated } });
  } catch (e) {
    next(e);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw HttpError(404, "Project not found");
    }
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ success: true, data: { message: "Project deleted" } });
  } catch (e) {
    next(e);
  }
}

export async function addMember(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw HttpError(404, "Project not found");
    }
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw HttpError(404, "User not found");
    }
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId },
    });
    const updated = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude(),
    });
    res.json({ success: true, data: { project: updated } });
  } catch (e) {
    next(e);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { id: projectId, userId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw HttpError(404, "Project not found");
    }
    if (userId === project.createdById) {
      throw HttpError(400, "Cannot remove the project creator from the team");
    }
    await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });
    const updated = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude(),
    });
    res.json({ success: true, data: { project: updated } });
  } catch (e) {
    next(e);
  }
}
