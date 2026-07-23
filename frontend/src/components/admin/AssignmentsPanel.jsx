import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

// Admin-only: assigns/reassigns trainer, direct manager, and backup
// manager for this trainee - one action, and every actual change is
// logged (see AssignmentHistoryList) with who did it and why. Direct
// Manager and Backup Manager are specifically the two people who perform
// second-party review for this trainee. Not an access boundary - every
// management account can still act on any trainee regardless of assignment.
export default function AssignmentsPanel({ traineeId, trainer, directManager, backupManager, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [trainerId, setTrainerId] = useState(trainer?.id || '');
  const [directManagerId, setDirectManagerId] = useState(directManager?.id || '');
  const [backupManagerId, setBackupManagerId] = useState(backupManager?.id || '');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    api.listManagementUsers().then((data) => setUsers(data.users)).catch(() => {});
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.assignTraineeRelationships(traineeId, trainerId || null, directManagerId || null, backupManagerId || null, note || null);
      setNote('');
      onAssigned();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-gray-100 p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Trainer</label>
        <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Direct Manager</label>
        <select value={directManagerId} onChange={(e) => setDirectManagerId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Backup Manager</label>
        <select value={backupManagerId} onChange={(e) => setBackupManagerId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Reason for change (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Manager A went on leave"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      <Button variant="outline" onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Assignments'}
      </Button>
    </div>
  );
}
