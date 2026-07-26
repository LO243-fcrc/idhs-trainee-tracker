import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { METRIC_LABELS, CASE_ACTION_LABELS, CASE_ACTION_TYPES } from '@/lib/metrics';
import MetricSparkline from './MetricSparkline';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// One category's card: shows the latest score + a trend line from recent
// history, and a form to record a new score (never overwrites past entries -
// every save appends a new history row).
export default function MetricScoreEditor({ metric, onRecord }) {
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(metric.latestScore ?? 50);
  const [notes, setNotes] = useState('');
  const [caseActionType, setCaseActionType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Oldest-to-newest for the sparkline; recentHistory arrives newest-first.
  const trendScores = [...metric.recentHistory].reverse().map((entry) => entry.score);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      await onRecord(score, notes, caseActionType || null);
      setNotes('');
      setCaseActionType('');
      setIsRecording(false);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-100 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{METRIC_LABELS[metric.category]}</p>
          {metric.latestRecordedAt && (
            <p className="text-xs text-gray-400">Last recorded {formatDate(metric.latestRecordedAt)}</p>
          )}
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {metric.latestScore === null ? '—' : metric.latestScore}
        </span>
      </div>

      {metric.recentHistory.length >= 2 && <MetricSparkline scores={trendScores} />}

      {metric.entryCount > 0 && (
        <ul className="space-y-1 text-xs text-gray-500">
          {metric.recentHistory.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-2">
              <span>
                {formatDate(entry.createdAt)}
                {entry.caseActionType ? ` · ${CASE_ACTION_LABELS[entry.caseActionType]}` : ''}
              </span>
              <span className="font-medium text-gray-700">{entry.score}</span>
            </li>
          ))}
        </ul>
      )}

      {!isRecording ? (
        <Button variant="outline" onClick={() => setIsRecording(true)}>Record New Score</Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor={`score-${metric.category}`} className="text-gray-600">Score</label>
            <span className="font-semibold text-gray-900">{score}/100</span>
          </div>
          <input
            id={`score-${metric.category}`}
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full"
          />

          <select
            value={caseActionType}
            onChange={(e) => setCaseActionType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Case action type (optional)</option>
            {CASE_ACTION_TYPES.map((type) => (
              <option key={type} value={type}>{CASE_ACTION_LABELS[type]}</option>
            ))}
          </select>

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />

          {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Score'}</Button>
            <Button type="button" variant="ghost" onClick={() => setIsRecording(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
