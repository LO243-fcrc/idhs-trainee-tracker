import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function SkillAreasManager() {
  const { user } = useAuth();
  const [skillAreas, setSkillAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newArea, setNewArea] = useState({ label: '', name: '' });
  const [editForm, setEditForm] = useState({ label: '', name: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    console.log('[SkillAreasManager] User role:', user?.role);
    loadSkillAreas();
  }, []);

  async function loadSkillAreas() {
    setIsLoading(true);
    try {
      console.log('[SkillAreasManager] Loading skill areas...');
      const areas = await api.getAllSkillAreas();
      console.log('[SkillAreasManager] Loaded areas:', areas);
      setSkillAreas(areas);
    } catch (err) {
      console.error('[SkillAreasManager] Error loading skill areas:', err);
      setErrorMessage(err.message || 'Failed to load skill areas');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddSkillArea(e) {
    e.preventDefault();
    console.log('[SkillAreasManager] handleAddSkillArea called');
    console.log('[SkillAreasManager] newArea:', newArea);
    console.log('[SkillAreasManager] User role:', user?.role);
    
    if (!newArea.label || !newArea.name) {
      setErrorMessage('Label and name are required');
      return;
    }

    if (user?.role !== 'ADMIN') {
      setErrorMessage('You must be logged in as an administrator to manage skill areas');
      console.error('[SkillAreasManager] Not admin. User role:', user?.role);
      return;
    }

    setIsAdding(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('[SkillAreasManager] Calling api.createSkillArea with:', { label: newArea.label, name: newArea.name });
      const response = await api.createSkillArea({
        label: newArea.label,
        name: newArea.name,
      });
      console.log('[SkillAreasManager] Success response:', response);
      setNewArea({ label: '', name: '' });
      setSuccessMessage('Skill area added successfully');
      await loadSkillAreas();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      console.error('[SkillAreasManager] Error creating skill area:', err);
      console.error('[SkillAreasManager] Error message:', err.message);
      console.error('[SkillAreasManager] Full error:', err);
      setErrorMessage(err.message || 'Failed to add skill area. Check browser console for details.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdateSkillArea(id) {
    if (!editForm.label) {
      setErrorMessage('Label is required');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.updateSkillArea(id, { label: editForm.label });
      setEditingId(null);
      setSuccessMessage('Skill area updated');
      await loadSkillAreas();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      console.error('Error updating skill area:', err);
      setErrorMessage(err.message || 'Failed to update skill area');
    }
  }

  async function handleDeleteSkillArea(id) {
    if (!window.confirm('Delete this skill area? Trainees will no longer see it in their self-report.')) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.deleteSkillArea(id);
      setSuccessMessage('Skill area deleted');
      await loadSkillAreas();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      console.error('Error deleting skill area:', err);
      setErrorMessage(err.message || 'Failed to delete skill area');
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Help Categories for Self-Report</h3>
        <p className="text-sm text-slate-500">Edit the dropdown menu trainees see when they report needing help</p>
        <p className="text-xs text-slate-400 mt-2">
          🔐 Your role: <strong>{user?.role || 'unknown'}</strong> {user?.role !== 'ADMIN' && '(admin required to edit)'}
        </p>
      </div>

      {errorMessage && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded">{successMessage}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading skill areas...</p>
      ) : (
        <div className="space-y-4">
          {/* Add New Skill Area */}
          <form onSubmit={handleAddSkillArea} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900 mb-3">Add New Category</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newArea.label}
                onChange={(e) => setNewArea({ ...newArea, label: e.target.value })}
                placeholder="Display name (e.g., 'Case Comments Quality')"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                placeholder="System name (e.g., 'case_comments')"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <Button type="submit" disabled={isAdding} className="whitespace-nowrap">
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">System name must be unique, lowercase with underscores (no spaces). Cannot duplicate existing names like 'POLICY_EFFICIENCY'</p>
          </form>

          {/* Existing Skill Areas */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {skillAreas.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No skill areas yet. Add one above.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Display Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">System Name</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {skillAreas.map((area) => (
                    <tr key={area.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {editingId === area.id ? (
                          <input
                            type="text"
                            value={editForm.label}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-900">{area.label}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{area.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          area.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {area.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === area.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdateSkillArea(area.id)}
                              className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingId(area.id);
                                setEditForm({ label: area.label, name: area.name });
                              }}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSkillArea(area.id)}
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> These categories appear in the trainee daily self-report form under "Which area do you need more help with?" 
              Change them to match your team's coaching focus areas.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
