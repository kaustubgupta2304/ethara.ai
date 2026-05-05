import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects");
      setProjects(data.data.projects);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createProject(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/projects", { name, description: description || undefined });
      toast.success("Project created");
      setModalOpen(false);
      setName("");
      setDescription("");
      load();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id) {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      load();
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isAdmin ? "Create teams and organize work." : "Projects you belong to."}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500"
          >
            New project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">
            {isAdmin ? "No projects yet. Create your first one." : "You are not on any project yet."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <Link to={`/projects/${p.id}`} className="font-display text-lg font-semibold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                  {p.name}
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => removeProject(p.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{p.members.length} members</span>
                <span>·</span>
                <span>{p._count.tasks} tasks</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">New project</h2>
            <form onSubmit={createProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
