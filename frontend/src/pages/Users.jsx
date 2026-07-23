import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ManageUsersModal from '@/components/admin/ManageUsersModal';
import { api } from '@/lib/api';

export default function Users() {
  const [trainees, setTrainees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const traineeData = await api.listTrainees();
      const managerData = await api.listManagementUsers();

      // Separate managers into admins and regular managers
      const adminList = managerData.users.filter((u) => u.role === 'ADMIN' && !u.archivedAt);
      const managerList = managerData.users.filter((u) => u.role === 'MANAGEMENT' && !u.archivedAt);

      setTrainees(traineeData.trainees || []);
      setAdmins(adminList);
      setManagers(managerList);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-slate-500">Manage all trainees, managers, and administrators</p>
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="space-y-8">
            {/* Trainees Section */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Trainees ({trainees.filter(t => !t.archivedAt).length})</h2>
              {trainees.filter(t => !t.archivedAt).length === 0 ? (
                <p className="text-sm text-slate-400">No active trainees</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Employment Start</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Highway Training Start</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {trainees.filter(t => !t.archivedAt).map((trainee) => (
                        <tr key={trainee.id} className="bg-white hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{trainee.name}</td>
                          <td className="px-4 py-3 text-slate-600">{trainee.email}</td>
                          <td className="px-4 py-3 text-slate-600">{trainee.employmentStartDate?.split('T')[0] || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{trainee.highwayTrainingStartDate?.split('T')[0] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Managers Section */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Managers ({managers.length})</h2>
              {managers.length === 0 ? (
                <p className="text-sm text-slate-400">No active managers</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {managers.map((manager) => (
                        <tr key={manager.id} className="bg-white hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{manager.name}</td>
                          <td className="px-4 py-3 text-slate-600">{manager.email}</td>
                          <td className="px-4 py-3 text-slate-600">{manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Administrators Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Administrators ({admins.length})</h2>
                <ManageUsersModal onUserAdded={loadUsers} />
              </div>
              {admins.length === 0 ? (
                <p className="text-sm text-slate-400">No active administrators</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="bg-white hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{admin.name}</td>
                          <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                          <td className="px-4 py-3 text-slate-600">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
