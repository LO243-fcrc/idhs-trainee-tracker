import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AddUserForm from '@/components/AddUserForm';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [addSection, setAddSection] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const traineeData = await api.listTrainees();
      const managerData = await api.listManagementUsers();

      const adminList = managerData.users.filter((u) => u.role === 'ADMIN' && !u.archivedAt);
      const managerList = managerData.users.filter((u) => u.role === 'MANAGEMENT' && !u.archivedAt);
      
      // Get trainee assignments to separate trainers from managers
      const trainerIds = new Set();
      traineeData.trainees.forEach(t => {
        if (t.trainerId) trainerIds.add(t.trainerId);
      });
      
      const trainerList = managerList.filter(m => trainerIds.has(m.id));
      const managerOnlyList = managerList.filter(m => !trainerIds.has(m.id));

      setTrainees(traineeData.trainees || []);
      setAdmins(adminList);
      setManagers(managerOnlyList);
      setTrainers(trainerList);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function startEdit(user) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
  }

  async function saveEdit(userId, role) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const payload = {
        name: editName,
        email: editEmail,
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      await api.updateManagementUser(userId, payload);
      setEditingId(null);
      setEditPassword('');
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteUser(userId, name) {
    if (userId === currentUser?.id) {
      setErrorMessage("You cannot delete your own account");
      return;
    }
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setErrorMessage('');
    try {
      await api.deleteManagementUser(userId);
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function addUser(role) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.createManagementUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role,
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setAddSection(null);
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : '—';
  };

  const UserTable = ({ users, role }) => (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Created</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUser?.id;
            return (
            <tr key={user.id} className="bg-white hover:bg-slate-50">
              {editingId === user.id ? (
                <>
                  <td className="px-4 py-3"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoComplete="off" className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                  <td className="px-4 py-3"><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} autoComplete="off" className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                  <td className="px-4 py-3"><input type="password" placeholder="Leave blank to keep" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} autoComplete="new-password" className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => saveEdit(user.id, role)} disabled={isSaving} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
                    <button onClick={() => setEditingId(null)} className="rounded bg-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-400">Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-slate-900">{user.name} {isCurrentUser && <span className="text-xs text-blue-600 font-semibold">(You)</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => startEdit(user)} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300">Edit</button>
                    <button 
                      onClick={() => deleteUser(user.id, user.name)} 
                      disabled={isCurrentUser}
                      title={isCurrentUser ? "Cannot delete your own account" : ""}
                      className={`rounded px-2 py-1 text-xs ${isCurrentUser ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-200 text-red-700 hover:bg-red-300'}`}
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-slate-500">Manage all trainees, trainers, managers, and administrators</p>
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

            {/* Trainers Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Trainers ({trainers.length})</h2>
                {addSection !== 'trainer' && (
                  <button
                    onClick={() => setAddSection('trainer')}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    + Add Trainer
                  </button>
                )}
              </div>
              {addSection === 'trainer' && (
                <AddUserForm 
                  role="MANAGEMENT" 
                  roleName="Trainer"
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  isSaving={isSaving}
                  errorMessage={errorMessage}
                  onAdd={addUser}
                  onCancel={() => setAddSection(null)}
                />
              )}
              {trainers.length === 0 && addSection !== 'trainer' ? (
                <p className="text-sm text-slate-400">No trainers added yet</p>
              ) : trainers.length > 0 ? (
                <UserTable users={trainers} role="MANAGEMENT" />
              ) : null}
            </section>

            {/* Managers Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Managers ({managers.length})</h2>
                {addSection !== 'manager' && (
                  <button
                    onClick={() => setAddSection('manager')}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    + Add Manager
                  </button>
                )}
              </div>
              {addSection === 'manager' && (
                <AddUserForm 
                  role="MANAGEMENT" 
                  roleName="Manager"
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  isSaving={isSaving}
                  errorMessage={errorMessage}
                  onAdd={addUser}
                  onCancel={() => setAddSection(null)}
                />
              )}
              {managers.length === 0 && addSection !== 'manager' ? (
                <p className="text-sm text-slate-400">No managers added yet</p>
              ) : managers.length > 0 ? (
                <UserTable users={managers} role="MANAGEMENT" />
              ) : null}
            </section>

            {/* Administrators Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Administrators ({admins.length})</h2>
                {addSection !== 'admin' && (
                  <button
                    onClick={() => setAddSection('admin')}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    + Add Administrator
                  </button>
                )}
              </div>
              {addSection === 'admin' && (
                <AddUserForm 
                  role="ADMIN" 
                  roleName="Administrator"
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  isSaving={isSaving}
                  errorMessage={errorMessage}
                  onAdd={addUser}
                  onCancel={() => setAddSection(null)}
                />
              )}
              {admins.length === 0 && addSection !== 'admin' ? (
                <p className="text-sm text-slate-400">No administrators added yet</p>
              ) : admins.length > 0 ? (
                <UserTable users={admins} role="ADMIN" />
              ) : null}
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
