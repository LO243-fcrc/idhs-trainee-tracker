import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

function getStoredTraineeName() {
  return localStorage.getItem('traineeName') || '';
}

function getStoredTraineeId() {
  return localStorage.getItem('traineeId') || '';
}

export default function TraineeSelfReport() {
  const [searchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [traineeName, setTraineeName] = useState('');
  const [traineeId, setTraineeId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    // PRIORITY 1: If there's a token in the URL, use it (fresh from link)
    if (token) {
      console.log(`[FRONTEND] Token from URL: ${token.substring(0, 8)}...`);
      verifyToken(token);
      return;
    }
    
    // PRIORITY 2: If no URL token, check if already logged in (returning to same session)
    const sessionToken = localStorage.getItem('traineeSessionToken');
    if (sessionToken) {
      console.log(`[FRONTEND] Using stored session token: ${sessionToken.substring(0, 8)}...`);
      setIsLoggedIn(true);
      setTraineeName(getStoredTraineeName());
      setTraineeId(getStoredTraineeId());
      return;
    }
    
    // No token in URL and no session token = not logged in
    console.log('[FRONTEND] No token provided - showing login message');
  }, [searchParams]);

  async function verifyToken(token) {
    console.log(`[FRONTEND] Verifying token: ${token.substring(0, 8)}...`);
    setIsVerifying(true);
    try {
      const result = await api.verifySelfReportToken(token);
      console.log(`[FRONTEND] Token verified for: ${result.traineeName}`);
      localStorage.setItem('traineeSessionToken', token);
      localStorage.setItem('traineeName', result.traineeName);
      localStorage.setItem('traineeId', result.traineeId);
      setTraineeName(result.traineeName);
      setTraineeId(result.traineeId);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(`[FRONTEND] Token verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('traineeSessionToken');
    localStorage.removeItem('traineeName');
    localStorage.removeItem('traineeId');
    setIsLoggedIn(false);
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <NoAccessMessage />;
  }

  return <TraineePortal traineeName={traineeName} traineeId={traineeId} onLogout={handleLogout} />;
}

function NoAccessMessage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="rounded-lg border border-slate-200 bg-white p-8 max-w-md text-center">
        <p className="text-lg font-semibold text-slate-900 mb-2">Self-Report Access</p>
        <p className="text-slate-600 text-sm">
          You can access the self-report form using the link your manager provided. Make sure the URL includes the access code at the end.
        </p>
      </div>
    </div>
  );
}

function TraineePortal({ traineeName, traineeId, onLogout }) {
  const [activeTab, setActiveTab] = useState('daily-report'); // 'daily-report' or 'courses'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="text-lg font-semibold text-slate-900">{traineeName}</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('daily-report')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'daily-report'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Daily Case Report
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Assigned Courses
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'daily-report' && <DailyReportForm />}
          {activeTab === 'courses' && <AssignedCoursesSection traineeId={traineeId} />}
        </div>
      </div>
    </div>
  );
}

function DailyReportForm() {
  const [formData, setFormData] = useState({
    snapCasesDone: '',
    medicalCasesDone: '',
    casesCertified: '',
    casesPending: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate
    if (!formData.snapCasesDone || !formData.medicalCasesDone || !formData.casesCertified || !formData.casesPending) {
      setErrorMessage('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('traineeSessionToken');
      const payload = {
        snapCasesDone: parseInt(formData.snapCasesDone, 10),
        medicalCasesDone: parseInt(formData.medicalCasesDone, 10),
        casesCertified: parseInt(formData.casesCertified, 10),
        casesPending: parseInt(formData.casesPending, 10),
      };

      await api.submitSelfReport(token, payload);
      setFormData({ snapCasesDone: '', medicalCasesDone: '', casesCertified: '', casesPending: '' });
      setSuccessMessage('Daily report submitted successfully! Come back tomorrow to submit another one.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Daily Case Report</h2>
        <p className="text-sm text-slate-600 mb-6">Record the cases you worked on today and their status</p>

        <div className="space-y-4">
          {/* SNAP Cases */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of SNAP cases worked on today
            </label>
            <input
              type="number"
              min="0"
              value={formData.snapCasesDone}
              onChange={(e) => setFormData({ ...formData, snapCasesDone: e.target.value })}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Medical Cases */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of Medical cases worked on today
            </label>
            <input
              type="number"
              min="0"
              value={formData.medicalCasesDone}
              onChange={(e) => setFormData({ ...formData, medicalCasesDone: e.target.value })}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Certified Cases */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total cases certified today (SNAP + Medical)
            </label>
            <input
              type="number"
              min="0"
              value={formData.casesCertified}
              onChange={(e) => setFormData({ ...formData, casesCertified: e.target.value })}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Pending Second-Party Review */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cases still waiting on second-party review
            </label>
            <input
              type="number"
              min="0"
              value={formData.casesPending}
              onChange={(e) => setFormData({ ...formData, casesPending: e.target.value })}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}
        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        <div className="mt-6 flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Submitting...' : 'Submit Daily Report'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function AssignedCoursesSection({ traineeId }) {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingCourseId, setSavingCourseId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCourses();
  }, [traineeId]);

  async function loadCourses() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('traineeSessionToken');
      if (!token) {
        setErrorMessage('No token found. Please log in again.');
        return;
      }

      const response = await fetch('/api/self-report/courses', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      setCourses(data.courseCompletions || []);
    } catch (err) {
      console.error('Error loading courses:', err);
      setErrorMessage(`Failed to load courses: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function markCourseComplete(courseId) {
    setSavingCourseId(courseId);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const token = localStorage.getItem('traineeSessionToken');
      if (!token) {
        setErrorMessage('No token found. Please log in again.');
        setSavingCourseId(null);
        return;
      }

      const response = await fetch(`/api/self-report/courses/${courseId}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Update the course in state with new status
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, status: 'COMPLETED', completedAt: new Date().toISOString() } : c
      ));
      setSuccessMessage('Course marked as complete!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error marking course complete:', err);
      setErrorMessage(`Failed to mark course complete: ${err.message}`);
    } finally {
      setSavingCourseId(null);
    }
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading your courses...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-slate-500">No courses assigned yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">My Assigned Courses ({courses.length})</h2>
        <p className="text-sm text-slate-600 mb-4">
          These are the training courses assigned to you. Click the links to view course content.
        </p>
      </div>

      <div className="space-y-4">
        {courses.map((completion) => (
          <div key={completion.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-slate-900">{completion.course.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{completion.course.description}</p>
              <p className="text-xs text-slate-600 mt-2">
                Status: <span className="font-medium">{completion.status}</span>
              </p>
            </div>

            {completion.course.modules && completion.course.modules.length > 0 && (
              <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200">
                <p className="text-xs font-medium text-slate-600">Modules:</p>
                {completion.course.modules.map((module) => (
                  <div key={module.id} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 mt-1">•</span>
                    <div>
                      <p className="text-slate-700">{module.title}</p>
                      <p className="text-xs text-slate-500">({module.contentType})</p>
                      {module.contentUrl && (
                        <a
                          href={module.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open Content →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completion.status !== 'COMPLETED' && (
              <div className="mt-4">
                <button
                  onClick={() => markCourseComplete(completion.course.id)}
                  disabled={savingCourseId === completion.course.id}
                  className="w-full rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingCourseId === completion.course.id ? 'Marking Complete...' : 'Mark Course Complete'}
                </button>
              </div>
            )}

            {completion.status === 'COMPLETED' && (
              <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-2">
                <p className="text-sm font-medium text-green-800">✓ Course Completed</p>
                {completion.completedAt && (
                  <p className="text-xs text-green-700">
                    Marked on {new Date(completion.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-6">
        Contact your manager if you have questions about your assigned courses or need support.
      </p>
    </div>
  );
}
