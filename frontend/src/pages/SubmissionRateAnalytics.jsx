import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function SubmissionRateAnalytics() {
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [rateData, timelineData] = await Promise.all([
        api.getSubmissionRateAnalytics(),
        api.getSubmissionTimeline(),
      ]);
      setData(rateData);
      setTimeline(timelineData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <AppLayout><p className="text-slate-500">Loading analytics...</p></AppLayout>;
  }

  if (error) {
    return <AppLayout><p className="text-red-600">{error}</p></AppLayout>;
  }

  if (!data) {
    return <AppLayout><p className="text-slate-500">No data available</p></AppLayout>;
  }

  const stats = data.systemStats;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Daily Report Submission Analytics</h1>
          <p className="text-slate-600 mt-1">Track trainee engagement with daily self-reporting</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Trainees</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalTrainees}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Avg Submission Rate</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.avgSubmissionRate}%</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-600 font-medium">On Track</p>
            <p className="text-3xl font-bold text-amber-900 mt-2">{stats.traineesOnTrack}</p>
            <p className="text-xs text-amber-600 mt-1">submitted within 3 days</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600 font-medium">Overdue</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.traineesOverdue}</p>
            <p className="text-xs text-red-600 mt-1">no report in 3+ days</p>
          </div>
        </div>

        {/* Submission Timeline */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Submissions Over Time</h2>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(timeline.length / 5)}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Daily Reports"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No submission data yet</p>
          )}
        </div>

        {/* Trainee Submission Rates */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Trainee Submission Rates (Last 30 Days)</h2>
          {data.trainees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Trainee</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Submission Rate</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Reports</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Last Report</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trainees.map((trainee) => (
                    <tr key={trainee.traineeId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700 font-medium">{trainee.traineeName}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                trainee.submissionRate >= 80
                                  ? 'bg-green-500'
                                  : trainee.submissionRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${trainee.submissionRate}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-900 min-w-12">{trainee.submissionRate}%</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-slate-700">{trainee.reportsInLast30Days}/30</td>
                      <td className="text-center py-3 px-4">
                        {trainee.daysSinceLastReport === null ? (
                          <span className="text-slate-500">Never</span>
                        ) : trainee.daysSinceLastReport === 0 ? (
                          <span className="text-green-600 font-medium">Today</span>
                        ) : (
                          <span className={trainee.daysSinceLastReport > 3 ? 'text-red-600' : 'text-slate-700'}>
                            {trainee.daysSinceLastReport} days ago
                          </span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            trainee.status === 'ON_TRACK'
                              ? 'bg-green-100 text-green-800'
                              : trainee.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {trainee.status === 'ON_TRACK'
                            ? 'On Track'
                            : trainee.status === 'OVERDUE'
                            ? 'Overdue'
                            : 'Never'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No trainees with reports yet</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
