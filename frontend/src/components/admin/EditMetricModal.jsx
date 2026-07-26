import { useState } from 'react';

export default function EditMetricModal({ metric, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(metric.name);
  const [description, setDescription] = useState(metric.description || '');

  function handleSave() {
    if (!name.trim()) {
      alert('Metric name is required');
      return;
    }
    onSave({
      ...metric,
      name: name.trim(),
      description: description.trim(),
    });
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-700 hover:bg-blue-200"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Metric</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Metric Key (Read-only)
                </label>
                <div className="rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600 font-mono">
                  {metric.key}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Policy Efficiency"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief description of this metric"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
