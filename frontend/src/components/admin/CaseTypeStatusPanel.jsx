import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { CASE_TYPE_LABELS, CASE_TYPES } from '@/lib/metrics';

const EVENT_LABELS = {
  AUTHORIZATION_RECOMMENDED: 'Recommend Authorization',
  AUTHORIZATION_APPROVED: 'Approve Authorization',
  REVIEW_INDEPENDENCE_RECOMMENDED: 'Recommend Review Independence',
  REVIEW_INDEPENDENCE_APPROVED: 'Approve Review Independence',
};

function StatusLine({ label, active, pending }) {
  const color = active ? 'text-green-700' : pending ? 'text-yellow-700' : 'text-gray-400';
  const text = active ? 'Yes' : pending ? 'Recommended, awaiting approval' : 'No';
  return (
    <p className="text-sm">
      <span className="text-gray-600">{label}: </span>
      <span className={`font-medium ${color}`}>{text}</span>
    </p>
  );
}

function CaseTypeCard({ traineeId, caseType, status, onChanged }) {
  const [eventType, setEventType] = useState('AUTHORIZATION_RECOMMENDED');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.recordCaseTypeEvent(traineeId, caseType, eventType, notes || null);
      setNotes('');
      onChanged();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-gray-100 p-3">
      <p className="text-sm font-medium text-gray-800">{CASE_TYPE_LABELS[caseType]}</p>
      <StatusLine label="Authorized" active={status.authorized} pending={status.authorizationRecommendationPending} />
      <StatusLine
        label="Needs Second-Party Review"
        active={status.authorized && !status.reviewIndependent}
        pending={status.reviewIndependenceRecommendationPending}
      />
      <StatusLine
        label="Review-independent"
        active={status.reviewIndependent}
        pending={status.reviewIndependenceRecommendationPending}
      />

      <form onSubmit={handleSubmit} className="space-y-2 border-t border-gray-100 pt-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(EVENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
        <Button type="submit" variant="outline" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Record'}
        </Button>
      </form>
    </div>
  );
}

export default function CaseTypeStatusPanel({ traineeId, caseTypeStatus, onChanged }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CASE_TYPES.map((caseType) => (
        <CaseTypeCard
          key={caseType}
          traineeId={traineeId}
          caseType={caseType}
          status={caseTypeStatus[caseType] || {}}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
