export default function StatChip({ label, value, highlight }) {
  return (
    <div
      className={[
        "rounded-xl border bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        highlight ? "border-red-200 dark:border-red-900/60" : "border-slate-200",
      ].join(" ")}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div
        className={[
          "mt-1 font-display text-2xl font-semibold",
          highlight ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
