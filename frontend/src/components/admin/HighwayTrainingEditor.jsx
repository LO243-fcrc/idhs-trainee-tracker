import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function HighwayTrainingEditor() {
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadWeeks();
  }, []);

  async function loadWeeks() {
    setIsLoading(true);
    try {
      const data = await api.getHighwayTrainingWeeks();
      setWeeks(data.weeks || []);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveWeek(week) {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.updateHighwayTrainingWeek(week.weekNumber, {
        topic: editValues[week.id]?.topic || week.topic,
        expectation: editValues[week.id]?.expectation || week.expectation,
      });
      setSuccessMessage(`Week ${week.weekNumber} updated`);
      setEditingWeekId(null);
      setEditValues({});
      await loadWeeks();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">10 Week Highway Training</h3>
      <p className="text-xs text-slate-500">Edit the topic and expectations for each week of training</p>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          {weeks.map((week) => (
            <div key={week.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-900">Week {week.weekNumber}</p>
                {editingWeekId === week.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveWeek(week)}
                      disabled={isSaving}
                      className="text-xs py-1 px-2 h-auto"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingWeekId(null);
                        setEditValues({});
                      }}
                      className="text-xs py-1 px-2 h-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingWeekId(week.id);
                      setEditValues({ [week.id]: { topic: week.topic, expectation: week.expectation } });
                    }}
                    className="text-xs py-1 px-2 h-auto"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {editingWeekId === week.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Topic</label>
                    <input
                      type="text"
                      value={editValues[week.id]?.topic || ''}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          [week.id]: { ...editValues[week.id], topic: e.target.value },
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expectations</label>
                    <textarea
                      value={editValues[week.id]?.expectation || ''}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          [week.id]: { ...editValues[week.id], expectation: e.target.value },
                        })
                      }
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">{week.topic}</p>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{week.expectation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
