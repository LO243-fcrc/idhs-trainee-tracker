import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import StatusBadge from './StatusBadge';
import RiskBadge from './RiskBadge';
import { describeTimeline } from '@/lib/trainingTimeline';

export default function TraineeMatrix({ refreshKey }) {
  const [courses, setCourses] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const data = await api.getTraineesDashboard();
        if (isMounted) {
          setCourses(data.courses);
          setMatrix(data.matrix);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => { isMounted = false; };
  }, [refreshKey]);

  if (isLoading) return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  if (errorMessage) return <p className="text-sm text-red-600">{errorMessage}</p>;

  if (matrix.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
        No trainees yet. Add one from the Settings tab.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700">
              Trainee
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Timeline</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            {courses.map((course) => (
              <th key={course.id} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                {course.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matrix.map((row) => {
            const timeline = describeTimeline(row.trainee.employmentStartDate);
            return (
              <tr key={row.trainee.id} className="hover:bg-slate-50/60">
                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-slate-900">
                  <Link to={`/trainees/${row.trainee.id}`} className="hover:text-blue-700 hover:underline">
                    {row.trainee.name}
                  </Link>
                  <div className="text-xs text-slate-400">{row.trainee.email || '—'}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {timeline.monthsElapsed === null ? (
                    <span className="text-slate-300">Not set</span>
                  ) : (
                    `Month ${timeline.monthsElapsed} of 12`
                  )}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge status={row.trainee.riskStatus} />
                </td>
                {row.courseStatuses.map((cell) => (
                  <td key={cell.courseId} className="px-4 py-3">
                    <StatusBadge status={cell.status} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
