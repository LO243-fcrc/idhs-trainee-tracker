import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import AddTraineeModal from '@/components/admin/AddTraineeModal';
import EditTraineeModal from '@/components/admin/EditTraineeModal';
import HighwayTrainingEditor from '@/components/admin/HighwayTrainingEditor';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

function formatDate(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [trainees, setTrainees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingArchiveId, setPendingArchiveId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    loadTrainees();
  }, []);

  async function loadTrainees() {
    setIsLoading(true);
    try {
      const data = await api.listTrainees();
      setTrainees(data.trainees);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleArchive(trainee) {
    setPendingArchiveId(trainee.id);
    setErrorMessage('');
    try {
      await api.setTraineeArchived(trainee.id, !trainee.archivedAt);
      await loadTrainees();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setPendingArchiveId(null);
    }
  }

  async function handleDeleteTrainee(trainee) {
    if (!window.confirm(`Permanently delete trainee "${trainee.name}"? This cannot be undone.`)) return;
    setPendingDeleteId(trainee.id);
    setErrorMessage('');
    try {
      await api.deleteTrainee(trainee.id);
      await loadTrainees();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Trainees & Highway Training</h1>
          <p className="text-sm text-slate-500">Add and manage trainees. Edit the 10-week Highway Training curriculum.</p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Trainees</h2>
            <AddTraineeModal onAdded={loadTrainees} />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          {isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : trainees.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
              No trainees yet. Use "Add Trainee" to create the first one.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainees.map((trainee) => (
                    <tr key={trainee.id} className={trainee.archivedAt ? 'bg-slate-50/60' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <Link to={`/trainees/${trainee.id}`} className="hover:text-blue-700 hover:underline">
                          {trainee.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{trainee.email || '\u2014'}</td>
                      <td className="px-4 py-3 text-sm">
                        {trainee.archivedAt ? (
                          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Archived {formatDate(trainee.archivedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <EditTraineeModal trainee={trainee} onSaved={loadTrainees} />
                          <Button
                            variant={trainee.archivedAt ? 'outline' : 'danger'}
                            disabled={pendingArchiveId === trainee.id}
                            onClick={() => handleToggleArchive(trainee)}
                          >
                            {pendingArchiveId === trainee.id ? 'Saving...' : trainee.archivedAt ? 'Restore' : 'Archive'}
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={pendingDeleteId === trainee.id}
                            onClick={() => handleDeleteTrainee(trainee)}
                            title="Permanently delete this trainee"
                          >
                            {pendingDeleteId === trainee.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="space-y-3">
            <HighwayTrainingEditor />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
