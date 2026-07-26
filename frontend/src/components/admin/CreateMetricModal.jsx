import { useState } from 'react';

export default function CreateMetricModal({ onMetricCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  function handleCreate() {
    setError('');

    // Validate
    if (!key.trim()) {
      setError('Key is required');
      return;
    }
    if (!name.trim()) {
      setError('Metric name is required');
      return;
    }

    // Key validation: uppercase letters and underscores only
    const keyRegex = /^[A-Z_]+$/;
    if (!keyRegex.test(key)) {
      setError('Key must contain only uppercase letters and underscores');
      return;
    }

    const newMetric = {
      key: key.toUpperCase(),
      name: name.trim(),
      description: description.trim(),
    };

    onMetricCreated(newMetric);
    
    // Reset form
    setKey('');
    setName('');
    setDescription('');
    setIsOpen(false);
  }

  function handleClose() {
    setKey('');
    setName('');
    setDescription('');
    setError('');
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        + Add Metric
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Metric</h2>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Key (e.g., MY_METRIC)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="CUSTOM_METRIC"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Uppercase letters and underscores only. Must be unique.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Custom Metric"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (optional)
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
                onClick={handleClose}
                className="rounded bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
              >
                Create Metric
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
