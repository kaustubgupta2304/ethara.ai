import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatChip from "../components/StatChip.jsx";
import TaskCard from "../components/TaskCard.jsx";

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        api.get("/tasks/dashboard/stats"),
        api.get("/tasks", {
          params: {
            ...(statusFilter && { status: statusFilter }),
            page,
            limit: 12,
          },
        }),
      ]);
      setStats(sRes.data.data.stats);
      setTasks(tRes.data.data.tasks);
      setPagination(tRes.data.data.pagination);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(task, status) {
    try {
      await api.patch(`/tasks/${task.id}`, { status });
      toast.success("Task updated");
      load();
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isAdmin
            ? "Overview of all tasks across projects."
            : "Your assigned tasks. Update status as you progress."}
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip label="Total tasks" value={stats.total} />
          <StatChip label="Completed" value={stats.completed} />
          <StatChip label="Pending" value={stats.pending} />
          <StatChip label="Overdue" value={stats.overdue} highlight />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ["", "All"],
            ["TODO", "Todo"],
            ["IN_PROGRESS", "In progress"],
            ["DONE", "Done"],
          ].map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(value);
              }}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                statusFilter === value
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <Link
          to="/projects"
          className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
        >
          Manage projects →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No tasks match this filter.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              showProject
              canEditStatus
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
