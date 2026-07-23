import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function AssignCourseForm({ traineeId, assignedCourses, onAssigned }) {
  const { setIsOpen } = useDialogContext();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setIsLoading(true);
    try {
      const data = await api.listCourses();
      const available = (data.courses || []).filter(
        (c) => !assignedCourses.some((ac) => ac.courseId === c.id)
      );
      setCourses(available);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedCourseId) {
      setErrorMessage('Please select a course');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.assignCourseToTrainee(traineeId, selectedCourseId);
      onAssigned();
      setIsOpen(false);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading courses...</p>;
  }

  if (courses.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        All courses have been assigned to this trainee, or no courses exist yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        >
          <option value="">-- Choose a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Assigning...' : 'Assign Course'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AssignCourseModal({ traineeId, assignedCourses, onAssigned }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign Course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Course to Trainee</DialogTitle>
        </DialogHeader>
        <AssignCourseForm traineeId={traineeId} assignedCourses={assignedCourses} onAssigned={onAssigned} />
      </DialogContent>
    </Dialog>
  );
}
