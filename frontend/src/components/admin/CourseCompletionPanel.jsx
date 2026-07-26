import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function CourseCompletionPanel({ traineeId, courses, completions, onRefresh }) {
  const [isSaving, setIsSaving] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Only show courses that were created on the platform (have modules).
  // Seeded placeholder courses don't have modules, so they're excluded.
  const platformCourses = courses.filter((c) => c.modules && c.modules.length > 0);

  if (platformCourses.length === 0) {
    return null; // Don't show the panel if no platform courses exist
  }

  // Only mark as completed if status is ACTUALLY 'COMPLETED'
  const completedIds = new Set(
    completions
      .filter((c) => c.status === 'COMPLETED')
      .map((c) => c.courseId)
  );

  async function toggleCompletion(courseId, isCompleted) {
    setIsSaving(courseId);
    setErrorMessage('');
    try {
      if (isCompleted) {
        await api.unmarkCourseCompleted(traineeId, courseId);
      } else {
        await api.markCourseCompleted(traineeId, courseId);
      }
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(null);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Course Completion (Compliance)</h3>
        <p className="mt-1 text-xs text-slate-500">Mark courses as completed for trainee compliance tracking</p>
      </div>

      <div className="space-y-2">
        {platformCourses.map((course) => {
          const isCompleted = completedIds.has(course.id);
          const completion = completions.find((c) => c.courseId === course.id);
          
          // Make status human-readable
          const statusDisplay = completion?.status 
            ? completion.status.split('_').join(' ').toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : 'Not Started';
          
          return (
            <div key={course.id} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{course.title}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Status: <span className="font-medium">{statusDisplay}</span>
                </p>
                {completion?.completedAt && (
                  <p className="text-xs text-slate-500">
                    Completed {new Date(completion.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleCompletion(course.id, isCompleted)}
                disabled={isSaving === course.id}
                className={`ml-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                } disabled:opacity-50`}
              >
                {isSaving === course.id ? 'Saving...' : isCompleted ? '✓ Completed' : 'Mark Complete'}
              </button>
            </div>
          );
        })}
      </div>

      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
    </div>
  );
}
