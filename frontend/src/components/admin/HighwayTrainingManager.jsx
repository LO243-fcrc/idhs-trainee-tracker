import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

function EditableWeekRow({ week, onSave, isSaving, error }) {
  const [isEditing, setIsEditing] = useState(false);
  const [topic, setTopic] = useState(week.topic);
  const [expectation, setExpectation] = useState(week.expectation);

  async function handleSave() {
    if (!topic.trim() || !expectation.trim()) {
      alert('Topic and expectation are required');
      return;
    }

    await onSave(week.weekNumber, {
      topic: topic.trim(),
      expectation: expectation.trim(),
    });

    setIsEditing(false);
  }

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50">
      <td className="px-6 py-4 text-sm font-medium text-slate-900">Week {week.weekNumber}</td>

      {isEditing ? (
        <>
          <td className="px-6 py-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter topic"
            />
          </td>
          <td className="px-6 py-4">
            <textarea
              value={expectation}
              onChange={(e) => setExpectation(e.target.value)}
              rows="2"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter expectation"
            />
          </td>
          <td className="px-6 py-4 text-sm">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setTopic(week.topic);
                  setExpectation(week.expectation);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 text-sm text-slate-900">{week.topic}</td>
          <td className="px-6 py-4 text-sm text-slate-600">{week.expectation}</td>
          <td className="px-6 py-4 text-sm">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-700 hover:bg-blue-200"
            >
              Edit
            </button>
          </td>
        </>
      )}

      {error && (
        <tr className="bg-red-50">
          <td colSpan="4" className="px-6 py-2 text-sm text-red-700">
            {error}
          </td>
        </tr>
      )}
    </tr>
  );
}

export default function HighwayTrainingManager() {
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingWeek, setSavingWeek] = useState(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  async function loadWeeks() {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getHighwayTrainingWeeks();
      setWeeks(data.weeks || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading highway training weeks:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveWeek(weekNumber, data) {
    try {
      setSavingWeek(weekNumber);
      setError('');
      const updated = await api.updateHighwayTrainingWeek(weekNumber, data);
      setWeeks(weeks.map(w => w.weekNumber === weekNumber ? updated : w));
    } catch (err) {
      setError(err.message);
      console.error('Error saving week:', err);
    } finally {
      setSavingWeek(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">10-Week Highway Training Curriculum</h2>
        <p className="mt-1 text-sm text-slate-500">Edit the curriculum topics and expectations for each week.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-slate-500">Loading curriculum...</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-20">Week</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Topic</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Expectation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <EditableWeekRow
                  key={week.weekNumber}
                  week={week}
                  onSave={handleSaveWeek}
                  isSaving={savingWeek === week.weekNumber}
                  error={savingWeek === week.weekNumber && error ? error : null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          <strong>{weeks.length} weeks</strong> configured. This curriculum is shared across all trainees.
        </p>
      </div>
    </div>
  );
}
