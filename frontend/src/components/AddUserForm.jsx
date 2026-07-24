import { memo } from 'react';

const AddUserForm = memo(({ 
  role, 
  roleName, 
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  isSaving,
  errorMessage,
  onAdd,
  onCancel
}) => {
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
      <h3 className="mb-3 font-semibold text-slate-900">Add New {roleName}</h3>
      {errorMessage && <p className="mb-2 text-sm text-red-600">{errorMessage}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          key="add-name"
          type="text"
          placeholder="Full name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          autoComplete="off"
          autoFocus
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          key="add-email"
          type="email"
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          autoComplete="off"
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          key="add-password"
          type="password"
          placeholder="Password (min 8 chars)"
          value={newUserPassword}
          onChange={(e) => setNewUserPassword(e.target.value)}
          autoComplete="new-password"
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="mt-3 space-x-2">
        <button
          onClick={() => onAdd(role)}
          disabled={isSaving || !newUserName || !newUserEmail || !newUserPassword}
          className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? 'Adding...' : 'Add ' + roleName}
        </button>
        <button
          onClick={onCancel}
          className="rounded bg-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

AddUserForm.displayName = 'AddUserForm';

export default AddUserForm;
