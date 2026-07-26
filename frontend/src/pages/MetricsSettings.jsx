import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import EditMetricModal from '@/components/admin/EditMetricModal';
import CreateMetricModal from '@/components/admin/CreateMetricModal';
import { api } from '@/lib/api';

export default function MetricsSettings() {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createError, setCreateError] = useState('');
  const [error, setError] = useState('');

  // Load metrics from backend on mount
  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.listMetrics();
      setMetrics(data.metrics || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEditMetric(updatedMetric) {
    try {
      setError('');
      await api.updateMetric(updatedMetric.id, {
        name: updatedMetric.name,
        description: updatedMetric.description,
      });
      // Update local state
      setMetrics(metrics.map(m => m.id === updatedMetric.id ? updatedMetric : m));
    } catch (err) {
      setError(err.message);
      console.error('Error updating metric:', err);
    }
  }

  async function handleDeleteMetric(metricId) {
    if (!window.confirm('Delete this metric? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      await api.deleteMetric(metricId);
      setMetrics(metrics.filter(m => m.id !== metricId));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting metric:', err);
    }
  }

  async function handleCreateMetric(newMetric) {
    setCreateError('');
    try {
      const created = await api.createMetric(newMetric);
      setMetrics([...metrics, created]);
    } catch (err) {
      setCreateError(err.message);
      console.error('Error creating metric:', err);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Metrics Settings</h1>
            <p className="mt-1 text-slate-500">Manage performance metrics. View, edit, and configure metric categories.</p>
          </div>
          <CreateMetricModal onMetricCreated={handleCreateMetric} />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {createError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createError}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-slate-500">Loading metrics...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Metric Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Key</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <tr key={metric.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{metric.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{metric.key}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{metric.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <EditMetricModal metric={metric} onSave={handleEditMetric} />
                        <button
                          onClick={() => handleDeleteMetric(metric.id)}
                          className="rounded bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            {metrics.length === 0 ? (
              <p className="text-sm text-slate-600">
                No metrics defined. Click "+ Add Metric" to create one.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                <strong>{metrics.length} metrics</strong> currently defined. Changes are saved automatically to the database.
              </p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
