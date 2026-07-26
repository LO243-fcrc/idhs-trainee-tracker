import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ROLE_LABELS = {
  TRAINER: 'Trainer',
  DIRECT_MANAGER: 'Direct Manager',
  BACKUP_MANAGER: 'Backup Manager',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Admin-only: shows the trail of trainer/manager/backup-manager changes for
// this trainee - who it changed from/to, who made the change, and why.
export default function AssignmentHistoryList({ traineeId, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getAssignmentHistory(traineeId)
      .then((data) => setHistory(data.history))
      .finally(() => setIsLoading(false));
  }, [traineeId, refreshKey]);

  if (isLoading) return null;
  if (history.length === 0) {
    return <p className="text-xs text-gray-400">No reassignments recorded yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {history.map((entry) => (
        <li key={entry.id} className="rounded-md border border-gray-50 bg-gray-50/50 px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">{ROLE_LABELS[entry.role]}</span>
            <span className="text-gray-400">{formatDate(entry.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-gray-600">
            {entry.previousUserName || 'Unassigned'} → {entry.newUserName || 'Unassigned'}
            <span className="text-gray-400"> · changed by {entry.changedBy.name}</span>
          </p>
          {entry.note && <p className="mt-0.5 italic text-gray-500">"{entry.note}"</p>}
        </li>
      ))}
    </ul>
  );
}
