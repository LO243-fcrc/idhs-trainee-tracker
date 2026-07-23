import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SubmissionRateContent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setIsLoading(true);
    setError('');
    try {
      const analyticsData = await api.getSubmissionRateAnalytics();
      setData(analyticsData);
    } catch (err) {
      console.error('Error loading submission rate analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading submission rate analytics...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Submission Rate Analytics</h1>
        <p className="text-slate-600 mt-1">Track daily report submission compliance and engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Overall Submission Rate</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{data?.overallSubmissionRate || 0}%</p>
          <p className="text-xs text-green-600 mt-1">{data?.totalSubmissions || 0} of {data?.totalExpected || 0}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Active Trainees</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{data?.traineeStats?.length || 0}</p>
          <p className="text-xs text-blue-600 mt-1">total reporting</p>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-600 font-medium">At-Risk Trainees</p>
          <p className="text-3xl font-bold text-amber-900 mt-2">{data?.atRiskCount || 0}</p>
          <p className="text-xs text-amber-600 mt-1">below 80% submission</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Total Submissions</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{data?.totalSubmissions || 0}</p>
          <p className="text-xs text-purple-600 mt-1">last 30 days</p>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Submissions Trend (Last 30 Days)</h2>
        {data?.dailyTrend && data.dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(data.dailyTrend.length / 7)}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Submissions"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-center py-12">No submission data yet</p>
        )}
      </div>

      {/* Trainee Submission Rates */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Trainee Submission Rates</h2>
        {data?.traineeStats && data.traineeStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Trainee</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Submission Rate</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Submissions</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Days Since Last</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.traineeStats.map((stat) => (
                  <tr key={stat.traineeId} className={`border-b border-slate-100 hover:bg-slate-50 ${stat.submissionRate < 80 ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-4 text-slate-700 font-medium">{stat.traineeName}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stat.submissionRate >= 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${stat.submissionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-900 min-w-12">{stat.submissionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-700">{stat.actualSubmissions} / {stat.expectedSubmissions}</td>
                    <td className="text-center py-3 px-4 text-slate-700">
                      {stat.daysSinceLastSubmission === null ? '—' : `${stat.daysSinceLastSubmission} days ago`}
                    </td>
                    <td className="text-center py-3 px-4">
                      {stat.submissionRate >= 95 && <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Excellent</span>}
                      {stat.submissionRate >= 80 && stat.submissionRate < 95 && <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Good</span>}
                      {stat.submissionRate < 80 && <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">At Risk</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No trainee data available</p>
        )}
      </div>

      {/* Insights */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ <strong>Overall Rate:</strong> {data?.overallSubmissionRate || 0}% of expected submissions received</li>
          <li>✓ <strong>At Risk:</strong> {data?.atRiskCount || 0} trainees below 80% submission rate</li>
          <li>✓ <strong>Engagement:</strong> Daily submissions show {data?.dailyTrend && data.dailyTrend.length > 0 ? 'engagement trend' : 'no data'}</li>
          <li>⚠️ <strong>Action:</strong> Follow up with at-risk trainees to ensure daily reporting compliance</li>
        </ul>
      </div>
    </div>
  );
}

export default function SubmissionRateAnalytics() {
  return (
    <AppLayout>
      <SubmissionRateContent />
    </AppLayout>
  );
}
