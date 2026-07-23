import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { METRIC_LABELS, CASE_TYPE_LABELS, CASE_TYPES } from '@/lib/metrics';

function CompletionBar({ completionRate, colorClass = 'bg-green-500' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${completionRate}%` }} />
    </div>
  );
}

const EMPTY_FILTERS = { traineeId: '', trainerId: '', directManagerId: '', courseId: '', caseType: '', dateFrom: '', dateTo: '' };

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function FilterBar({ filters, onChange, trainees, users, courses, onClear, onExport, canExport }) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function set(field) {
    return (value) => onChange({ ...filters, [field]: value });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Trainee"
          value={filters.traineeId}
          onChange={set('traineeId')}
          placeholder="All trainees"
          options={trainees.map((t) => ({ value: t.id, label: t.name }))}
        />
        <FilterSelect
          label="Trainer"
          value={filters.trainerId}
          onChange={set('trainerId')}
          placeholder="All trainers"
          options={users.map((u) => ({ value: u.id, label: u.name }))}
        />
        <FilterSelect
          label="Direct Manager"
          value={filters.directManagerId}
          onChange={set('directManagerId')}
          placeholder="All managers"
          options={users.map((u) => ({ value: u.id, label: u.name }))}
        />
        <FilterSelect
          label="Program"
          value={filters.courseId}
          onChange={set('courseId')}
          placeholder="All programs"
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
        />
        <FilterSelect
          label="Case Type"
          value={filters.caseType}
          onChange={set('caseType')}
          placeholder="Both case types"
          options={CASE_TYPES.map((ct) => ({ value: ct, label: CASE_TYPE_LABELS[ct] }))}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">From date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">To date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end gap-4">
          <button
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="text-sm text-slate-500 underline decoration-dotted hover:text-slate-800 disabled:opacity-40 disabled:no-underline"
          >
            Clear filters
          </button>
          <button
            onClick={onExport}
            disabled={!canExport}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export to Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [trainees, setTrainees] = useState([]);
  const [users, setUsers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [programMetrics, setProgramMetrics] = useState([]);
  const [performanceAverages, setPerformanceAverages] = useState([]);
  const [overallPerformanceAverages, setOverallPerformanceAverages] = useState([]);
  const [caseTypeSummary, setCaseTypeSummary] = useState([]);
  const [selfReportSummary, setSelfReportSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter dropdown options - loaded once, unaffected by the filters.
  useEffect(() => {
    api.listTrainees().then((d) => setTrainees(d.trainees.filter((t) => !t.archivedAt))).catch(() => {});
    api.listManagementUsers().then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await api.getReports(filters);
        if (!isMounted) return;
        setProgramMetrics(data.programMetrics);
        setPerformanceAverages(data.performanceAverages);
        setOverallPerformanceAverages(data.overallPerformanceAverages || []);
        setCaseTypeSummary(data.caseTypeSummary || []);
        setSelfReportSummary(data.selfReportSummary || null);
        // Populate the program dropdown from an unfiltered load so filtering
        // by one program doesn't shrink the dropdown itself.
        if (!filters.courseId) {
          setAllCourses(data.programMetrics.map((p) => ({ id: p.courseId, title: p.title })));
        }
      } catch (err) {
        if (isMounted) setErrorMessage(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadReports();
    return () => { isMounted = false; };
  }, [filters]);

  // Builds a CSV of everything currently on screen - respecting the active
  // filters - and downloads it. Client-side only; the data is already loaded.
  function handleExportCsv() {
    const esc = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [];

    const activeFilters = Object.entries(filters).filter(([, v]) => v);
    lines.push('IDHS Trainee Tracker - Report Export');
    lines.push(`Exported,${esc(new Date().toLocaleString())}`);
    if (activeFilters.length > 0) {
      const labels = {
        traineeId: (v) => `Trainee: ${trainees.find((t) => t.id === v)?.name || v}`,
        trainerId: (v) => `Trainer: ${users.find((u) => u.id === v)?.name || v}`,
        directManagerId: (v) => `Direct Manager: ${users.find((u) => u.id === v)?.name || v}`,
        courseId: (v) => `Program: ${allCourses.find((c) => c.id === v)?.title || v}`,
        caseType: (v) => `Case Type: ${CASE_TYPE_LABELS[v] || v}`,
        dateFrom: (v) => `From: ${v}`,
        dateTo: (v) => `To: ${v}`,
      };
      lines.push(`Filters,${esc(activeFilters.map(([k, v]) => labels[k](v)).join('; '))}`);
    } else {
      lines.push('Filters,None (all data)');
    }
    lines.push('');

    if (selfReportSummary) {
      lines.push('Certification Rate');
      lines.push('Certified,Pending,Rate');
      lines.push(
        [
          selfReportSummary.totalCertified,
          selfReportSummary.totalPending,
          selfReportSummary.certificationRate === null ? '' : `${selfReportSummary.certificationRate}%`,
        ].join(',')
      );
      lines.push('');
    }

    lines.push('Case-Type Authorization');
    lines.push('Case Type,Authorized,Review-Independent,Total Trainees');
    for (const s of caseTypeSummary) {
      lines.push([esc(CASE_TYPE_LABELS[s.caseType] || s.caseType), s.authorizedCount, s.reviewIndependentCount, s.totalTrainees].join(','));
    }
    lines.push('');

    lines.push('Performance Averages');
    lines.push('Metric,Average Score,Trainees Scored,Total Trainees');
    for (const m of performanceAverages) {
      lines.push([esc(METRIC_LABELS[m.category] || m.category), m.averageScore ?? '', m.scoredCount, m.totalTrainees].join(','));
    }
    lines.push('');

    lines.push('Overall Performance Averages');
    lines.push('Metric,Average Score,Trainees Scored,Total Trainees');
    for (const m of overallPerformanceAverages) {
      lines.push([esc(METRIC_LABELS[m.category] || m.category), m.averageScore ?? '', m.scoredCount, m.totalTrainees].join(','));
    }
    lines.push('');

    lines.push('Program Completion');
    lines.push('Program,Completed,In Progress,Not Started,Total Trainees,Completion Rate');
    for (const p of programMetrics) {
      lines.push([esc(p.title), p.COMPLETED, p.IN_PROGRESS, p.NOT_STARTED, p.totalTrainees, `${p.completionRate}%`].join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trainee-tracker-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Filter by trainee, trainer, manager, program, case type, or date range.</p>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          trainees={trainees}
          users={users}
          courses={allCourses}
          onClear={() => setFilters(EMPTY_FILTERS)}
          onExport={handleExportCsv}
          canExport={!isLoading && !errorMessage}
        />

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading reports...</p>
        ) : (
          <>
            {selfReportSummary && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Certification Rate</h2>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-3xl font-bold text-slate-900">
                    {selfReportSummary.certificationRate === null ? '\u2014' : `${selfReportSummary.certificationRate}%`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selfReportSummary.totalCertified} certified of {selfReportSummary.totalCertified + selfReportSummary.totalPending} self-reported cases
                  </p>
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Case-Type Authorization</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {caseTypeSummary.map((summary) => (
                  <div key={summary.caseType} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-900">{CASE_TYPE_LABELS[summary.caseType]}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Authorized: <span className="font-medium text-slate-800">{summary.authorizedCount}</span> of {summary.totalTrainees}
                    </p>
                    <p className="text-xs text-slate-500">
                      Review-independent: <span className="font-medium text-slate-800">{summary.reviewIndependentCount}</span> of {summary.totalTrainees}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Performance Averages</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {performanceAverages.map((metric) => (
                  <div key={metric.category} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">{METRIC_LABELS[metric.category]}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {metric.averageScore === null ? '\u2014' : metric.averageScore}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {metric.scoredCount} of {metric.totalTrainees} trainees scored
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Overall Performance Averages</h2>
              <p className="mb-3 text-sm text-slate-500">Performance across all trainees (regardless of filters)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {overallPerformanceAverages.map((metric) => (
                  <div key={metric.category} className="rounded-lg border border-slate-200 bg-blue-50 p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">{METRIC_LABELS[metric.category]}</p>
                    <p className="mt-1 text-3xl font-bold text-blue-900">
                      {metric.averageScore === null ? '\u2014' : metric.averageScore}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {metric.scoredCount} of {metric.totalTrainees} trainees scored
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Program Completion</h2>
              {programMetrics.length === 0 ? (
                <p className="text-slate-400">No courses match the current filters.</p>
              ) : (
                <div className="space-y-4">
                  {programMetrics.map((program) => (
                    <div key={program.courseId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{program.title}</p>
                        <p className="text-sm font-semibold text-slate-900">{program.completionRate}%</p>
                      </div>
                      <CompletionBar completionRate={program.completionRate} />
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>{program.COMPLETED} completed</span>
                        <span>{program.IN_PROGRESS} in progress</span>
                        <span>{program.NOT_STARTED} not started</span>
                        <span className="text-slate-400">of {program.totalTrainees} trainees</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
