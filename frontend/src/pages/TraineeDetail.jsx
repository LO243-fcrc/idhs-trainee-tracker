import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';
import ProgressStatusSelect from '@/components/admin/ProgressStatusSelect';
import MetricScoreEditor from '@/components/admin/MetricScoreEditor';
import MetricTrendChart from '@/components/admin/MetricTrendChart';
import QuarterlySnapshot from '@/components/admin/QuarterlySnapshot';
import CaseTypeStatusPanel from '@/components/admin/CaseTypeStatusPanel';
import CourseCompletionPanel from '@/components/admin/CourseCompletionPanel';
import SecondPartyReviewPanel from '@/components/admin/SecondPartyReviewPanel';
import AssignmentsPanel from '@/components/admin/AssignmentsPanel';
import AssignmentHistoryList from '@/components/admin/AssignmentHistoryList';
import IssueSelfReportCredentialsModal from '@/components/admin/IssueSelfReportCredentialsModal';
import AssignCourseModal from '@/components/admin/AssignCourseModal';
import { Button } from '@/components/ui/button';
import { describeTimeline } from '@/lib/trainingTimeline';

function formatDate(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInputValue(isoString) {
  return isoString ? new Date(isoString).toISOString().slice(0, 10) : '';
}

export default function TraineeDetail() {
  const { traineeId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingModuleId, setSavingModuleId] = useState(null);

  const [employmentStartDraft, setEmploymentStartDraft] = useState('');
  const [isSavingEmploymentStart, setIsSavingEmploymentStart] = useState(false);

  const [highwayStartDraft, setHighwayStartDraft] = useState('');
  const [highwayEndDraft, setHighwayEndDraft] = useState('');
  const [isSavingHighwayDates, setIsSavingHighwayDates] = useState(false);

  const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traineeId]);

  useEffect(() => {
    if (detail?.trainee) {
      setEmploymentStartDraft(toDateInputValue(detail.trainee.employmentStartDate));
      setHighwayStartDraft(toDateInputValue(detail.trainee.highwayTrainingStartDate));
      setHighwayEndDraft(toDateInputValue(detail.trainee.highwayTrainingEndDate));
    }
  }, [detail?.trainee]);

  async function loadDetail() {
    setIsLoading(true);
    try {
      const [detailData, caseStatus] = await Promise.all([
        api.getTraineeDetail(traineeId),
        api.getCaseTypeStatus(traineeId),
      ]);
      setDetail({ ...detailData, caseTypeStatus: caseStatus });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(moduleId, status) {
    setSavingModuleId(moduleId);
    try {
      await api.updateTraineeProgress(traineeId, moduleId, status);
      setDetail((prev) => ({
        ...prev,
        courses: prev.courses.map((course) => ({
          ...course,
          modules: course.modules.map((mod) => (mod.id === moduleId ? { ...mod, status } : mod)),
        })),
      }));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSavingModuleId(null);
    }
  }

  async function handleMetricRecord(category, score, notes, caseActionType) {
    const newEntry = await api.recordTraineeMetric(traineeId, category, score, notes, caseActionType);
    setDetail((prev) => ({
      ...prev,
      performanceMetrics: prev.performanceMetrics.map((m) =>
        m.category === category
          ? {
              ...m,
              latestScore: newEntry.score,
              latestNotes: newEntry.notes || '',
              latestCaseActionType: newEntry.caseActionType,
              latestRecordedAt: newEntry.createdAt,
              entryCount: m.entryCount + 1,
              recentHistory: [newEntry, ...m.recentHistory].slice(0, 5),
            }
          : m
      ),
    }));
  }

  async function handleSaveEmploymentStart() {
    setIsSavingEmploymentStart(true);
    setErrorMessage('');
    try {
      const result = await api.setEmploymentStartDate(traineeId, employmentStartDraft || null);
      setDetail((prev) => ({ ...prev, trainee: { ...prev.trainee, employmentStartDate: result.employmentStartDate } }));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingEmploymentStart(false);
    }
  }

  async function handleSaveHighwayDates() {
    setIsSavingHighwayDates(true);
    setErrorMessage('');
    try {
      const result = await api.setHighwayTrainingDates(traineeId, highwayStartDraft || null, highwayEndDraft || null);
      setDetail((prev) => ({
        ...prev,
        trainee: {
          ...prev.trainee,
          highwayTrainingStartDate: result.highwayTrainingStartDate,
          highwayTrainingEndDate: result.highwayTrainingEndDate,
        },
      }));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingHighwayDates(false);
    }
  }

  if (isLoading) return <AppLayout><p className="text-sm text-slate-500">Loading...</p></AppLayout>;
  if (errorMessage && !detail) return <AppLayout><p className="text-sm text-red-600">{errorMessage}</p></AppLayout>;

  const { trainee, courses, courseCompletions, performanceMetrics, caseTypeStatus, recentSelfReports, recentSecondPartyReviews } = detail;

  return (
    <AppLayout>
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/" className="text-sm text-gray-500 hover:underline">← Back to dashboard</Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trainee.name}</h1>
            {trainee.email && <p className="text-sm text-gray-500">{trainee.email}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Trainer: {trainee.trainer?.name || 'Unassigned'} · Direct Manager: {trainee.directManager?.name || 'Unassigned'} · Backup Manager: {trainee.backupManager?.name || 'Unassigned'}
            </p>
          </div>
          {isAdmin && <IssueSelfReportCredentialsModal traineeId={traineeId} onIssued={loadDetail} />}
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {isAdmin && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Trainer / Manager Assignment (Admin)</h2>
          <AssignmentsPanel
            traineeId={traineeId}
            trainer={trainee.trainer}
            directManager={trainee.directManager}
            backupManager={trainee.backupManager}
            onAssigned={() => {
              loadDetail();
              setAssignmentRefreshKey((k) => k + 1);
            }}
          />
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-gray-600">Assignment History</p>
            <AssignmentHistoryList traineeId={traineeId} refreshKey={assignmentRefreshKey} />
          </div>
        </div>
      )}

      <div className="rounded-md border border-gray-100 p-3">
        <p className="mb-2 text-sm font-medium text-gray-800">Training Timeline</p>
        <p className="mb-2 text-xs text-gray-500">
          {describeTimeline(trainee.employmentStartDate).label}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="employment-start-date" className="text-xs text-gray-600">Start of Employment:</label>
          <input
            id="employment-start-date"
            type="date"
            value={employmentStartDraft}
            onChange={(e) => setEmploymentStartDraft(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <Button variant="outline" onClick={handleSaveEmploymentStart} disabled={isSavingEmploymentStart}>
            {isSavingEmploymentStart ? 'Saving...' : 'Save'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Set this to a past date for trainees who are already partway through their 12 months.
        </p>
      </div>

      <div className="rounded-md border border-gray-100 p-3">
        <p className="mb-2 text-sm font-medium text-gray-800">10 Week Highway Training</p>
        <p className="mb-2 text-xs text-gray-400">
          {trainee.highwayTrainingEndDate
            ? `Completed ${formatDate(trainee.highwayTrainingEndDate)}`
            : trainee.highwayTrainingStartDate
              ? `Started ${formatDate(trainee.highwayTrainingStartDate)}, in progress`
              : 'Not yet started'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="highway-start-date" className="text-xs text-gray-600">Start:</label>
          <input
            id="highway-start-date"
            type="date"
            value={highwayStartDraft}
            onChange={(e) => setHighwayStartDraft(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <label htmlFor="highway-end-date" className="text-xs text-gray-600">End:</label>
          <input
            id="highway-end-date"
            type="date"
            value={highwayEndDraft}
            onChange={(e) => setHighwayEndDraft(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <Button variant="outline" onClick={handleSaveHighwayDates} disabled={isSavingHighwayDates}>
            {isSavingHighwayDates ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Program Progress</h2>
          <AssignCourseModal 
            traineeId={traineeId} 
            assignedCourses={courseCompletions || []} 
            onAssigned={loadDetail}
          />
        </div>
        <CourseCompletionPanel
          traineeId={traineeId}
          courses={courses}
          completions={courseCompletions || []}
          onRefresh={loadDetail}
        />

        <h2 className="mb-3 mt-6 text-lg font-semibold text-gray-900">Case-Type Authorization &amp; Review Status</h2>
        <CaseTypeStatusPanel traineeId={traineeId} caseTypeStatus={caseTypeStatus} onChanged={loadDetail} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Second-Party Reviews</h2>
        <SecondPartyReviewPanel traineeId={traineeId} recentReviews={recentSecondPartyReviews} onRecorded={loadDetail} />
      </div>

      {recentSelfReports.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Self-Reports</h2>
          <div className="overflow-x-auto rounded-md border border-gray-100">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Medical</th>
                  <th className="px-3 py-2 text-left">SNAP</th>
                  <th className="px-3 py-2 text-left">Certified</th>
                  <th className="px-3 py-2 text-left">Pending</th>
                  <th className="px-3 py-2 text-left">Help Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSelfReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-3 py-2">{formatDate(report.reportDate)}</td>
                    <td className="px-3 py-2">{report.medicalCasesDone}</td>
                    <td className="px-3 py-2">{report.snapCasesDone}</td>
                    <td className="px-3 py-2">{report.casesCertified}</td>
                    <td className="px-3 py-2">{report.casesPending}</td>
                    <td className="px-3 py-2">{report.helpNeededCategory || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Performance Metrics</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {performanceMetrics.map((metric) => {
            // "Help requested" flag: any of the trainee's recent daily
            // self-reports asked for help in this category.
            const helpRequested = (recentSelfReports || []).some(
              (report) => report.helpNeededCategory === metric.category
            );
            return (
              <div key={metric.category} className="space-y-2">
                {helpRequested && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    Trainee requested help here
                  </span>
                )}
                <MetricScoreEditor
                  metric={metric}
                  onRecord={(score, notes, caseActionType) =>
                    handleMetricRecord(metric.category, score, notes, caseActionType)
                  }
                />
                <MetricTrendChart scoreHistory={metric.scoreHistory} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Quarterly Evaluation Snapshot</h2>
        <QuarterlySnapshot
          employmentStartDate={trainee.employmentStartDate}
          performanceMetrics={performanceMetrics}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Program Progress</h2>
        {courses.length === 0 && <p className="text-gray-400">No courses published yet.</p>}
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-900">{course.title}</h3>
              <div className="space-y-2">
                {course.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{mod.title}</p>
                      <p className="text-xs text-gray-400">{mod.contentType}</p>
                    </div>
                    <ProgressStatusSelect
                      status={mod.status}
                      disabled={savingModuleId === mod.id}
                      onChange={(status) => handleStatusChange(mod.id, status)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
