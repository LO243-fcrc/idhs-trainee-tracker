import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function BottleneckContent() {
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
      const analyticsData = await api.getBottleneckAnalysis();
      setData(analyticsData);
    } catch (err) {
      console.error('Error loading bottleneck analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading bottleneck analysis...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bottleneck Analysis</h1>
        <p className="text-slate-600 mt-1">Identify which skill areas need the most training focus</p>
      </div>

      {/* Key Metric */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-sm text-red-600 font-medium">Trainees Below 70% Benchmark</p>
        <p className="text-3xl font-bold text-red-900 mt-2">{data?.atRiskTrainees?.length || 0} of {data?.totalTrainees || 0}</p>
        <p className="text-xs text-red-600 mt-1">trainees struggling in one or more areas</p>
      </div>

      {/* Categories Ranked by Bottleneck */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Skill Areas Ranked by Challenge Level</h2>
        {data?.bottlenecks && data.bottlenecks.length > 0 ? (
          <div className="space-y-4">
            {data.bottlenecks.map((bottleneck, idx) => (
              <div key={bottleneck.category} className="border-b border-slate-100 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-400 min-w-8">{idx + 1}.</span>
                    <div>
                      <p className="font-semibold text-slate-900">{bottleneck.label}</p>
                      <p className="text-xs text-slate-500">{bottleneck.below70Count} of {bottleneck.total} trainees below 70%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">Avg: {bottleneck.avgScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bottleneck.percentageBelow70 > 50 ? 'bg-red-500' : bottleneck.percentageBelow70 > 30 ? 'bg-amber-500' : 'bg-yellow-500'}`}
                      style={{ width: `${bottleneck.percentageBelow70}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 min-w-12">{bottleneck.percentageBelow70}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No performance data available</p>
        )}
      </div>

      {/* At-Risk Trainees */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Trainees Needing Support</h2>
        {data?.atRiskTrainees && data.atRiskTrainees.length > 0 ? (
          <div className="space-y-3">
            {data.atRiskTrainees.map((trainee) => (
              <div key={trainee.traineeId} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-amber-900">{trainee.traineeName}</p>
                    <p className="text-sm text-amber-800 mt-1">Struggling in {trainee.count} area{trainee.count !== 1 ? 's' : ''}:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trainee.strugglingCategories.map((cat) => (
                        <span key={cat} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{trainee.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">All trainees are meeting benchmarks! 🎉</p>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Biggest Bottleneck</p>
            <p className="text-lg font-bold text-red-600 mt-1">
              {data?.bottlenecks?.[0]?.label || 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data?.bottlenecks?.[0]?.percentageBelow70 || 0}% of trainees below 70%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Strongest Area</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              {data?.bottlenecks && data.bottlenecks.length > 0 
                ? data.bottlenecks[data.bottlenecks.length - 1].label 
                : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data?.bottlenecks && data.bottlenecks.length > 0
                ? data.bottlenecks[data.bottlenecks.length - 1].percentageBelow70
                : 0}% of trainees below 70%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Areas with Issues</p>
            <p className="text-lg font-bold text-amber-600 mt-1">
              {data?.bottlenecks?.filter(b => b.percentageBelow70 > 0).length || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">of {data?.bottlenecks?.length || 0} total</p>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Recommended Actions</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ <strong>Focus Training:</strong> Prioritize coaching in {data?.bottlenecks?.[0]?.label || 'the most challenged area'}</li>
          <li>✓ <strong>Peer Learning:</strong> Have strong performers in weak areas mentor struggling trainees</li>
          <li>✓ <strong>Targeted Help:</strong> {data?.atRiskTrainees?.length || 0} trainees need immediate support</li>
          <li>✓ <strong>Track Progress:</strong> Monitor if coaching interventions improve scores over next 30 days</li>
        </ul>
      </div>
    </div>
  );
}

export default function BottleneckAnalytics() {
  return (
    <AppLayout>
      <BottleneckContent />
    </AppLayout>
  );
}
