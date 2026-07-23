import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function DashboardContent() {
  const [metrics, setMetrics] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [managersData, setManagersData] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [statusDist, setStatusDist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    setError('');
    try {
      const [metricsRes, coursesRes, managersRes, timelineRes, statusRes] = await Promise.all([
        fetch('/api/dashboard/metrics', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/dashboard/by-course', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/dashboard/by-manager', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/dashboard/timeline', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/dashboard/status-distribution', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
      ]);

      if (!metricsRes.ok) throw new Error('Failed to load metrics');
      if (!coursesRes.ok) throw new Error('Failed to load courses data');
      if (!managersRes.ok) throw new Error('Failed to load managers data');
      if (!timelineRes.ok) throw new Error('Failed to load timeline');
      if (!statusRes.ok) throw new Error('Failed to load status distribution');

      const metricsData = await metricsRes.json();
      const coursesDataRes = await coursesRes.json();
      const managersDataRes = await managersRes.json();
      const timelineDataRes = await timelineRes.json();
      const statusDataRes = await statusRes.json();

      setMetrics(metricsData);
      setCoursesData(coursesDataRes);
      setManagersData(managersDataRes);
      setTimeline(timelineDataRes);
      setStatusDist(statusDataRes);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Progress Dashboard</h1>
        <p className="text-slate-600 mt-1">Real-time completion metrics and progress tracking</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Overall Completion Rate</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{metrics?.completionRate || 0}%</p>
          <p className="text-xs text-blue-600 mt-1">{metrics?.completedAssignments || 0} of {metrics?.totalAssignments || 0}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Active Trainees</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{metrics?.activeTrainees || 0}</p>
          <p className="text-xs text-green-600 mt-1">trainees in system</p>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-600 font-medium">Courses Available</p>
          <p className="text-3xl font-bold text-amber-900 mt-2">{metrics?.allCourses || 0}</p>
          <p className="text-xs text-amber-600 mt-1">training courses</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Total Assignments</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{metrics?.totalAssignments || 0}</p>
          <p className="text-xs text-purple-600 mt-1">courses assigned</p>
        </div>
      </div>

      {/* Charts Row 1: Status Distribution & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Assignment Status Distribution</h2>
          {statusDist && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: statusDist.completed },
                    { name: 'In Progress', value: statusDist.inProgress },
                    { name: 'Not Started', value: statusDist.notStarted },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Timeline Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Completions Over Time (Last 30 Days)</h2>
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
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completions"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">No completion data yet</p>
          )}
        </div>
      </div>

      {/* Completion by Course */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Completion Rate by Course</h2>
        {coursesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coursesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="courseTitle" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="notStarted" stackId="a" fill="#ef4444" name="Not Started" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-center py-12">No course data available</p>
        )}
      </div>

      {/* Completion by Manager Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Completion by Manager/Trainer</h2>
        {managersData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Manager</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Trainees</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Total Assignments</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Completed</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {managersData.map((manager) => (
                  <tr key={manager.managerId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-700">{manager.managerEmail}</td>
                    <td className="text-center py-3 px-4 text-slate-700">{manager.traineesCount}</td>
                    <td className="text-center py-3 px-4 text-slate-700">{manager.totalAssignments}</td>
                    <td className="text-center py-3 px-4 text-slate-700">{manager.completedAssignments}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${manager.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-900 min-w-12">{manager.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No manager data available</p>
        )}
      </div>

      {/* Top Courses */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Courses</h2>
        {coursesData.length > 0 ? (
          <div className="space-y-3">
            {coursesData.slice(0, 5).map((course, idx) => (
              <div key={course.courseId} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600 w-6">{idx + 1}.</span>
                  <div>
                    <p className="font-medium text-slate-900">{course.courseTitle}</p>
                    <p className="text-xs text-slate-500">{course.completed} of {course.total} completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{course.completionRate}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No data available</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
