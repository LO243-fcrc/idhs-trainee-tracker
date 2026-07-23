import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function EditModulesForm({ course, onSaved }) {
  const { setIsOpen } = useDialogContext();
  const [modules, setModules] = useState(course.modules || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const contentTypes = ['VIDEO', 'PDF', 'TEXT'];

  function addModule() {
    setModules([
      ...modules,
      {
        id: `new-${Date.now()}`,
        title: '',
        contentType: 'VIDEO',
        contentUrl: '',
        order: modules.length,
      },
    ]);
  }

  function updateModule(index, field, value) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  }

  function removeModule(index) {
    setModules(modules.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      if (!mod.title || !mod.contentUrl) {
        setErrorMessage(`Module ${i + 1}: Title and URL are required`);
        return;
      }
      if (!contentTypes.includes(mod.contentType)) {
        setErrorMessage(`Module ${i + 1}: Invalid content type`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.updateCourseModules(course.id, modules);
      onSaved();
      setIsOpen(false);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {modules.length === 0 ? (
          <p className="text-sm text-slate-500">No modules yet. Click "Add Module" to create one.</p>
        ) : (
          modules.map((mod, index) => (
            <div key={mod.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-900">Module {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeModule(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                <Input
                  value={mod.title}
                  onChange={(e) => updateModule(index, 'title', e.target.value)}
                  placeholder="Module title"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Content Type</label>
                <select
                  value={mod.contentType}
                  onChange={(e) => updateModule(index, 'contentType', e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">URL</label>
                <Input
                  value={mod.contentUrl}
                  onChange={(e) => updateModule(index, 'contentUrl', e.target.value)}
                  placeholder="https://example.com/content"
                  required
                />
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addModule}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        + Add Module
      </button>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Save Modules'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function EditModulesModal({ course, onSaved }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Modules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Course Modules</DialogTitle>
        </DialogHeader>
        <EditModulesForm course={course} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
