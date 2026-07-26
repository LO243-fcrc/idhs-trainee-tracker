const STATUS_STYLES = {
  NOT_STARTED: 'bg-slate-200 text-slate-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.NOT_STARTED}`}
    >
      {STATUS_LABELS[status] || 'Unknown'}
    </span>
  );
}
