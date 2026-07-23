import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function ManageUsersForm({ onUserAdded }) {
  const { setIsOpen } = useDialogContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MANAGEMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const user = await api.createManagementUser({ name, email, password, role });
      setSuccessMessage(`Account created for ${user.email} (${user.role === 'ADMIN' ? 'Administrator' : 'Management'}).`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('MANAGEMENT');
      onUserAdded(); // Refresh the list
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input
        type="password"
        placeholder="Temporary password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="MANAGEMENT">Management (trainer / direct manager)</option>
          <option value="ADMIN">Administrator</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Administrators can create accounts and assign trainers/managers. Everyone has the same access to trainee data.
        </p>
      </div>

      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Creating...' : 'Create Account'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          {successMessage ? 'Done' : 'Cancel'}
        </Button>
      </div>
    </form>
  );
}

function UsersList({ users, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleDelete(user) {
    if (!window.confirm(`Permanently delete user "${user.email}"? This cannot be undone.`)) return;
    
    setDeletingId(user.id);
    setErrorMessage('');
    try {
      await api.deleteManagementUser(user.id);
      onDeleted();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleArchive(user) {
    setArchivingId(user.id);
    setErrorMessage('');
    try {
      await api.setUserArchived(user.id, !user.archivedAt);
      onDeleted(); // Refresh the list
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Current Users</h3>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {users.length === 0 ? (
        <p className="text-sm text-slate-400">No users yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between rounded-md border p-3 ${
                user.archivedAt ? 'border-slate-200 bg-slate-50/80' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${user.archivedAt ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="mt-1 flex gap-2">
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {user.role === 'ADMIN' ? 'Administrator' : 'Management'}
                  </span>
                  {user.archivedAt && (
                    <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Archived
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleArchive(user)}
                  disabled={archivingId === user.id}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    user.archivedAt
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  } disabled:opacity-50`}
                >
                  {archivingId === user.id ? 'Saving...' : user.archivedAt ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  disabled={deletingId === user.id}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  {deletingId === user.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageUsersModal() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await api.listManagementUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && loadUsers()}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Users</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Management Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Add user form */}
          <div className="border-b border-slate-200 pb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Add New User</h3>
            <ManageUsersForm onUserAdded={loadUsers} />
          </div>

          {/* Users list */}
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <UsersList users={users} onDeleted={loadUsers} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
