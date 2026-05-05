const statusLabels = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const statusStyles = {
  TODO: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  IN_PROGRESS: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  DONE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
};

export default function TaskCard({ task, onClick, onStatusChange, showProject, canEditStatus }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = task.overdue;

  return (
    <div
      className={[
        "rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        overdue ? "border-red-300 ring-1 ring-red-200 dark:border-red-800 dark:ring-red-900/50" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onClick?.(task)}
            className="text-left font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
          >
            {task.title}
          </button>
          {showProject && task.project && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{task.project.name}</p>
          )}
          {task.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {task.assignedTo ? (
            <span>
              Assigned: <span className="font-medium text-slate-700 dark:text-slate-200">{task.assignedTo.name}</span>
            </span>
          ) : (
            <span>Unassigned</span>
          )}
        </div>
        {due && (
          <div
            className={[
              "text-xs font-medium",
              overdue ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300",
            ].join(" ")}
          >
            Due {due.toLocaleDateString()}
            {overdue && " · Overdue"}
          </div>
        )}
      </div>
      {canEditStatus && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["TODO", "IN_PROGRESS", "DONE"].map((s) => (
            <button
              key={s}
              type="button"
              disabled={task.status === s}
              onClick={() => onStatusChange?.(task, s)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
