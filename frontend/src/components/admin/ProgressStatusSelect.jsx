const STATUS_OPTIONS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_STYLES = {
  NOT_STARTED: 'border-gray-300 bg-gray-50 text-gray-700',
  IN_PROGRESS: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  COMPLETED: 'border-green-300 bg-green-50 text-green-800',
};

// Management sets a trainee's module status directly - this is the entry
// point for that, used on the trainee detail page.
export default function ProgressStatusSelect({ status, onChange, disabled }) {
  return (
    <select
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${STATUS_STYLES[status]}`}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>{STATUS_LABELS[option]}</option>
      ))}
    </select>
  );
}
