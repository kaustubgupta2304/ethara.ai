import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";

const taskInclude = {
  project: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
};

async function assertProjectMemberOrAdmin(user, projectId) {
  if (user.role === "ADMIN") {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p) throw HttpError(404, "Project not found");
    return p;
  }
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!m) {
    throw HttpError(403, "You are not a member of this project");
  }
  return prisma.project.findUnique({ where: { id: projectId } });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export async function listTasks(req, res, next) {
  try {
    const { projectId, status, page = 1, limit = 50 } = req.validatedQuery || {};
    const { id: userId, role } = req.user;
    const skip = (page - 1) * limit;

    let where = {};
    if (role === "MEMBER") {
      where.assignedToId = userId;
    }
    if (projectId) {
      if (role === "MEMBER") {
        const m = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
        });
        if (!m) {
          throw HttpError(403, "Not a member of this project");
        }
      }
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
        include: taskInclude,
      }),
      prisma.task.count({ where }),
    ]);

    const enriched = tasks.map((t) => ({
      ...t,
      overdue: t.status !== "DONE" && isOverdue(t.dueDate),
    }));

    res.json({
      success: true,
      data: {
        tasks: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) {
      throw HttpError(404, "Task not found");
    }
    if (req.user.role === "MEMBER" && task.assignedToId !== req.user.id) {
      throw HttpError(403, "You can only view tasks assigned to you");
    }
    res.json({
      success: true,
      data: { task: { ...task, overdue: task.status !== "DONE" && isOverdue(task.dueDate) } },
    });
  } catch (e) {
    next(e);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, status, dueDate, projectId, assignedToId } = req.body;
    await assertProjectMemberOrAdmin(req.user, projectId);
    if (assignedToId) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assignedToId } },
      });
      if (!member) {
        throw HttpError(400, "Assignee must be a member of the project");
      }
    }
    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status: status ?? "TODO",
        dueDate: dueDate ?? null,
        projectId,
        assignedToId: assignedToId ?? null,
      },
      include: taskInclude,
    });
    res.status(201).json({
      success: true,
      data: { task: { ...task, overdue: task.status !== "DONE" && isOverdue(task.dueDate) } },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw HttpError(404, "Task not found");
    }
    if (req.user.role === "MEMBER") {
      if (existing.assignedToId !== req.user.id) {
        throw HttpError(403, "You can only update tasks assigned to you");
      }
      const allowed = ["status", "title", "description", "dueDate"];
      const keys = Object.keys(req.body);
      const forbidden = keys.filter((k) => !allowed.includes(k));
      if (forbidden.length) {
        throw HttpError(403, "Members may only update task content and status");
      }
      if (req.body.assignedToId !== undefined) {
        throw HttpError(403, "Members cannot reassign tasks");
      }
    } else {
      await assertProjectMemberOrAdmin(req.user, existing.projectId);
    }

    const { title, description, status, dueDate, assignedToId } = req.body;
    if (assignedToId !== undefined && assignedToId !== null) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId: assignedToId } },
      });
      if (!member) {
        throw HttpError(400, "Assignee must be a member of the project");
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate }),
        ...(assignedToId !== undefined && { assignedToId }),
      },
      include: taskInclude,
    });

    res.json({
      success: true,
      data: { task: { ...task, overdue: task.status !== "DONE" && isOverdue(task.dueDate) } },
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw HttpError(404, "Task not found");
    }
    await assertProjectMemberOrAdmin(req.user, existing.projectId);
    await prisma.task.delete({ where: { id } });
    res.json({ success: true, data: { message: "Task deleted" } });
  } catch (e) {
    next(e);
  }
}

export async function dashboardStats(req, res, next) {
  try {
    const { id: userId, role } = req.user;
    const baseWhere = role === "MEMBER" ? { assignedToId: userId } : {};

    const [total, completed, todo, inProgress, overdueCount] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: "DONE" } }),
      prisma.task.count({ where: { ...baseWhere, status: "TODO" } }),
      prisma.task.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: "DONE" },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total,
          completed,
          pending: todo + inProgress,
          todo,
          inProgress,
          overdue: overdueCount,
        },
      },
    });
  } catch (e) {
    next(e);
  }
}
