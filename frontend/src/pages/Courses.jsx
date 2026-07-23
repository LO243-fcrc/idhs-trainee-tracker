import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/AppLayout';
import EditCourseModal from '@/components/admin/EditCourseModal';
import EditModulesModal from '@/components/admin/EditModulesModal';
import { api } from '@/lib/api';

function CourseRow({ course, onDelete, onRefresh }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleDelete() {
    if (!window.confirm(`Delete course "${course.title}"? This cannot be undone.`)) return;
    
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await api.deleteCourse(course.id);
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{course.title}</p>
          <p className="text-xs text-slate-500 mt-1">
            {course.modules?.length || 0} modules
          </p>
        </div>
        <span className="text-slate-400 ml-2">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          {course.description && (
            <div>
              <p className="text-xs font-medium text-slate-600">Description</p>
              <p className="text-sm text-slate-700 mt-1">{course.description}</p>
            </div>
          )}

          {course.modules && course.modules.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Modules</p>
              <ul className="space-y-1 text-sm">
                {course.modules.map((module, idx) => (
                  <li key={idx} className="text-slate-700">
                    • {module.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="flex gap-2 pt-2 flex-wrap">
            <EditCourseModal course={course} onSaved={onRefresh} />
            <EditModulesModal course={course} onSaved={onRefresh} />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await api.listCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
          <p className="mt-1 text-slate-500">View and manage all created courses. Edit title, description, and modules. Assign to trainees.</p>
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-400">No courses created yet</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
            {courses.map((course) => (
              <CourseRow key={course.id} course={course} onDelete={() => loadCourses()} onRefresh={loadCourses} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
