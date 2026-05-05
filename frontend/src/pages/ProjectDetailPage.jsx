import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatus, setTaskStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState("");
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedToId: "",
  });

  const loadProject = useCallback(async () => {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data.data.project);
  }, [id]);

  const loadTasks = useCallback(async () => {
    const { data } = await api.get("/tasks", {
      params: {
        projectId: id,
        ...(taskStatus && { status: taskStatus }),
        limit: 100,
      },
    });
    setTasks(data.data.tasks);
  }, [id, taskStatus]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await api.get("/users");
    setUsers(data.data.users);
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadProject();
        await Promise.all([loadTasks(), loadUsers()]);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProject, loadTasks, loadUsers]);

  const memberIds = useMemo(() => new Set(project?.members.map((m) => m.user.id) || []), [project]);

  async function addMember(e) {
    e.preventDefault();
    if (!memberId) return;
    try {
      await api.post(`/projects/${id}/members`, { userId: memberId });
      toast.success("Member added");
      setMemberId("");
      loadProject();
    } catch {
      /* */
    }
  }

  async function removeMember(userId) {
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success("Member removed");
      loadProject();
    } catch {
      /* */
    }
  }

  async function createTask(e) {
    e.preventDefault();
    try {
      await api.post("/tasks", {
        title: taskForm.title,
        description: taskForm.description || undefined,
        projectId: id,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
        assignedToId: taskForm.assignedToId || undefined,
      });
      toast.success("Task created");
      setTaskModal(false);
      setTaskForm({ title: "", description: "", dueDate: "", assignedToId: "" });
      loadTasks();
      loadProject();
    } catch {
      /* */
    }
  }

  async function updateStatus(task, status) {
    try {
      await api.patch(`/tasks/${task.id}`, { status });
      toast.success("Updated");
      loadTasks();
    } catch {
      /* */
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
      loadTasks();
      loadProject();
    } catch {
      /* */
    }
  }

  if (loading || !project) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
          ← Projects
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-slate-600 dark:text-slate-400">{project.description}</p>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Team</h2>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium text-slate-900 dark:text-white">{m.user.name}</span>
                <span className="text-slate-500 dark:text-slate-400"> · {m.user.email}</span>
                {m.user.id === user.id && (
                  <span className="ml-2 text-xs text-brand-600 dark:text-brand-400">(you)</span>
                )}
              </span>
              {isAdmin && m.user.id !== project.createdBy.id && (
                <button
                  type="button"
                  onClick={() => removeMember(m.user.id)}
                  className="text-xs text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <form onSubmit={addMember} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Add member</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select user</option>
                {users
                  .filter((u) => !memberIds.has(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              Add
            </button>
          </form>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Tasks</h2>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["", "All"],
              ["TODO", "Todo"],
              ["IN_PROGRESS", "In progress"],
              ["DONE", "Done"],
            ].map(([value, label]) => (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setTaskStatus(value)}
                className={[
                  "rounded-lg px-2.5 py-1 text-xs font-medium",
                  taskStatus === value ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setTaskModal(true)}
                className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-500"
              >
                New task
              </button>
            )}
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No tasks in this view.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((t) => (
              <div key={t.id} className="space-y-2">
                <TaskCard
                  task={{ ...t, project: undefined }}
                  canEditStatus={isAdmin || t.assignedToId === user.id}
                  onStatusChange={updateStatus}
                />
                {isAdmin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteTask(t.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500"
                    >
                      Delete task
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {taskModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">New task</h3>
            <form onSubmit={createTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due date</label>
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign to</label>
                <select
                  value={taskForm.assignedToId}
                  onChange={(e) => setTaskForm((f) => ({ ...f, assignedToId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskModal(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
