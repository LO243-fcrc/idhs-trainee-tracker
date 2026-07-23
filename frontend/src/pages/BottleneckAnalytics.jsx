import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function BottleneckAnalytics() {
  const [data, setData] = useState([]);
  const [helpAreas, setHelpAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [bottleneckData, helpAreaData] = await Promise.all([
        api.getBottleneckAnalysis(),
        api.getHelpAreaRequests(),
      ]);
      setData(bottleneckData);
      setHelpAreas(helpAreaData);
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

  // Key metrics
  const worstCategory = data[0];
  const bestCategory = data[data.length - 1];
  const categoriesWithIssues = data.filter((c) => c.percentageBelow >= 30).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bottleneck Analysis</h1>
          <p className="text-slate-600 mt-1">Identify which skill categories hold trainees back from certification</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600 font-medium">Biggest Bottleneck</p>
            <p className="text-lg font-bold text-red-900 mt-2">{worstCategory?.categoryLabel || 'N/A'}</p>
            <p className="text-xs text-red-600 mt-1">{worstCategory?.percentageBelow || 0}% below 70%</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Strongest Category</p>
            <p className="text-lg font-bold text-green-900 mt-2">{bestCategory?.categoryLabel || 'N/A'}</p>
            <p className="text-xs text-green-600 mt-1">{bestCategory?.percentageBelow || 0}% below 70%</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-600 font-medium">Categories with Issues</p>
            <p className="text-lg font-bold text-amber-900 mt-2">{categoriesWithIssues}/10</p>
            <p className="text-xs text-amber-600 mt-1">≥30% trainees below 70%</p>
          </div>
        </div>

        {/* Bottleneck Bar Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">% of Trainees Below 70% by Category</h2>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="categoryLabel" type="category" width={195} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentageBelow" fill="#ef4444" name="% Below 70%" radius={[0, 8, 8, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentageBelow >= 50 ? '#dc2626' : entry.percentageBelow >= 30 ? '#ef4444' : '#fca5a5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">No data available</p>
          )}
        </div>

        {/* Category Details Table */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Detailed Breakdown</h2>
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Category</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Avg Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Trainees Scored</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Below 70%</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((category, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700 font-medium">{category.categoryLabel}</td>
                      <td className="text-center py-3 px-4">
                        <span className={category.avgScore >= 70 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {category.avgScore}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-slate-700">{category.totalTraineesScored}</td>
                      <td className="text-center py-3 px-4 text-slate-700">{category.traineesBelow70}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                category.percentageBelow >= 50
                                  ? 'bg-red-600'
                                  : category.percentageBelow >= 30
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-400'
                              }`}
                              style={{ width: `${category.percentageBelow}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-900 min-w-12">{category.percentageBelow}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No category data available</p>
          )}
        </div>

        {/* Top Help Area Requests */}
        {helpAreas.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Help Areas Requested (Last 30 Days)</h2>
            <div className="space-y-3">
              {helpAreas.slice(0, 5).map((area, idx) => (
                <div key={area.areaId} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 w-6">{idx + 1}.</span>
                    <span className="font-medium text-slate-900">{area.areaLabel}</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {area.requestCount} requests
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Recommendations</h3>
          <ul className="space-y-2 text-sm text-blue-900">
            {worstCategory && worstCategory.percentageBelow >= 50 && (
              <li>• <strong>Priority:</strong> {worstCategory.categoryLabel} is a major bottleneck ({worstCategory.percentageBelow}% of trainees below 70%). Consider targeted training interventions.</li>
            )}
            {categoriesWithIssues >= 5 && (
              <li>• <strong>systemic Issue:</strong> Many categories have >30% of trainees below 70%. This may indicate gaps in the Highway Training program.</li>
            )}
            {helpAreas.length > 0 && (
              <li>• <strong>Trainee Feedback:</strong> Trainees are requesting help with: {helpAreas.slice(0, 3).map((a) => a.areaLabel).join(', ')}. Focus coaching on these areas.</li>
            )}
            <li>• Compare trainee self-assessment ("need help" flags) with actual performance to identify blind spots.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
