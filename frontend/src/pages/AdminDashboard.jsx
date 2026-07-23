import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import TraineeMatrix from '@/components/admin/TraineeMatrix';
import CreateCourseForm from '@/components/admin/CreateCourseForm';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

function StatCard({ label, value, sublabel, accent }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState(null);

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  // Summary stats derived from the same dashboard + reports data the page
  // already uses - no extra backend surface needed.
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [dashboard, reports] = await Promise.all([api.getTraineesDashboard(), api.getReports()]);
        if (!isMounted) return;
        const rows = dashboard.matrix;
        const atRiskCount = rows.filter((r) => r.trainee.riskStatus === 'AT_RISK').length;
        const onTrackCount = rows.filter((r) => r.trainee.riskStatus === 'ON_TRACK').length;
        setStats({
          activeTrainees: rows.length,
          onTrackCount,
          atRiskCount,
          certificationRate: reports.selfReportSummary?.certificationRate ?? null,
        });
      } catch {
        // Stats are additive; the matrix still renders without them.
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, [refreshKey]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Trainee progress across every active program.</p>
          </div>
          <Button onClick={() => setShowCreateCourse((prev) => !prev)}>
            {showCreateCourse ? 'Close' : 'Create Course'}
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Active Trainees" value={stats.activeTrainees} />
            <StatCard label="On Track" value={stats.onTrackCount} accent="text-green-600" sublabel="above 70% in every scored area" />
            <StatCard label="At Risk" value={stats.atRiskCount} accent={stats.atRiskCount > 0 ? 'text-red-600' : 'text-slate-900'} sublabel="below the bar at month 9+" />
            <StatCard
              label="Certification Rate"
              value={stats.certificationRate === null ? '\u2014' : `${stats.certificationRate}%`}
              sublabel="from trainee self-reports"
            />
          </div>
        )}

        {showCreateCourse && (
          <CreateCourseForm
            onCourseCreated={() => {
              setShowCreateCourse(false);
              triggerRefresh();
            }}
          />
        )}

        <p className="text-sm text-slate-500">Click a trainee's name to view and update their progress.</p>

        <TraineeMatrix refreshKey={refreshKey} />
      </div>
    </AppLayout>
  );
}
