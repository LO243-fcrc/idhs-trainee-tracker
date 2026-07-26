import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { CASE_TYPE_LABELS, CASE_TYPES, CASE_ACTION_LABELS, CASE_ACTION_TYPES, REVIEW_OUTCOME_LABELS } from '@/lib/metrics';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SecondPartyReviewPanel({ traineeId, recentReviews, onRecorded }) {
  const [caseType, setCaseType] = useState('MEDICAL');
  const [caseActionType, setCaseActionType] = useState('');
  const [outcome, setOutcome] = useState('CERTIFIED');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.recordSecondPartyReview(traineeId, caseType, caseActionType || null, outcome, notes || null);
      setNotes('');
      onRecorded();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 rounded-md border border-gray-100 p-3 sm:grid-cols-2">
        <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          {CASE_TYPES.map((type) => <option key={type} value={type}>{CASE_TYPE_LABELS[type]}</option>)}
        </select>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          {Object.entries(REVIEW_OUTCOME_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={caseActionType} onChange={(e) => setCaseActionType(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm sm:col-span-2">
          <option value="">Case action (optional)</option>
          {CASE_ACTION_TYPES.map((type) => <option key={type} value={type}>{CASE_ACTION_LABELS[type]}</option>)}
        </select>
        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
        />
        {errorMessage && <p className="text-xs text-red-600 sm:col-span-2">{errorMessage}</p>}
        <Button type="submit" variant="outline" disabled={isSaving} className="sm:col-span-2">
          {isSaving ? 'Saving...' : 'Record Review'}
        </Button>
      </form>

      {recentReviews.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-500">
          {recentReviews.map((review) => (
            <li key={review.id} className="flex justify-between gap-2 border-b border-gray-50 pb-1">
              <span>
                {formatDate(review.createdAt)} \u00b7 {CASE_TYPE_LABELS[review.caseType]}
                {review.caseActionType ? ` \u00b7 ${CASE_ACTION_LABELS[review.caseActionType]}` : ''}
                {review.reviewedBy?.name ? ` \u00b7 ${review.reviewedBy.name}` : ''}
              </span>
              <span className={`font-medium ${review.outcome === 'CERTIFIED' ? 'text-green-700' : 'text-yellow-700'}`}>
                {REVIEW_OUTCOME_LABELS[review.outcome]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
