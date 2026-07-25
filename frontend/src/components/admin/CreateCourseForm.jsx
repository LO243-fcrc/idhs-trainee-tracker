import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

const CONTENT_TYPES = ['VIDEO', 'PDF', 'TEXT'];

function createEmptyModule(order) {
  return { title: '', contentType: 'VIDEO', contentUrl: '', order };
}

export default function CreateCourseForm({ onCourseCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState([createEmptyModule(0)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function updateModuleField(index, field, value) {
    setModules((prev) => prev.map((mod, i) => (i === index ? { ...mod, [field]: value } : mod)));
  }

  function addModule() {
    setModules((prev) => [...prev, createEmptyModule(prev.length)]);
  }

  function removeModule(index) {
    setModules((prev) => prev.filter((_, i) => i !== index).map((mod, i) => ({ ...mod, order: i })));
  }

  function moveModule(index, direction) {
    setModules((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((mod, i) => ({ ...mod, order: i }));
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const course = await api.createCourse({ title, description, modules });
      onCourseCreated?.(course);
      setTitle('');
      setDescription('');
      setModules([createEmptyModule(0)]);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Create Course</h2>

      <Input placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Modules</p>
        {modules.map((mod, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 rounded border border-gray-100 p-3">
            <span className="w-5 text-xs text-gray-400">{index + 1}</span>
            <Input
              placeholder="Module title"
              value={mod.title}
              onChange={(e) => updateModuleField(index, 'title', e.target.value)}
              required
              className="flex-1 min-w-[140px]"
            />
            <select
              className="rounded border border-gray-200 px-2 py-1 text-sm"
              value={mod.contentType}
              onChange={(e) => updateModuleField(index, 'contentType', e.target.value)}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Input
              placeholder="Content URL"
              value={mod.contentUrl}
              onChange={(e) => updateModuleField(index, 'contentUrl', e.target.value)}
              required
              className="flex-1 min-w-[160px]"
            />
            <Button type="button" variant="ghost" onClick={() => moveModule(index, -1)}>↑</Button>
            <Button type="button" variant="ghost" onClick={() => moveModule(index, 1)}>↓</Button>
            <Button type="button" variant="ghost" onClick={() => removeModule(index)}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addModule}>+ Add Module</Button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Course'}
      </Button>
    </form>
  );
}
