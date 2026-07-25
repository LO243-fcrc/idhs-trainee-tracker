// In production this app is served by the same Express server as the API,
// so a relative path is correct and needs no env var. VITE_API_URL only
// matters if you run `vite dev` against a separately-running backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getSessionToken() {
  return localStorage.getItem('sessionToken');
}
function getTraineeSessionToken() {
  return localStorage.getItem('traineeSessionToken');
}

async function apiRequest(path, options = {}, tokenOverride) {
  const token = tokenOverride !== undefined ? tokenOverride : getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Trainee self-report requests always use the trainee token, never the
// management one - keeps the two credential spaces from ever crossing on
// the frontend, mirroring the backend's separate scope check.
function traineeRequest(path, options = {}) {
  return apiRequest(path, options, getTraineeSessionToken());
}

export const api = {
  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getSetupStatus: () => apiRequest('/auth/setup-status'),

  register: (name, email, password) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  getTraineesDashboard: () => apiRequest('/admin/trainees-dashboard'),

  getTraineeDetail: (traineeId) => apiRequest(`/admin/trainees/${traineeId}`),

  updateTraineeProgress: (traineeId, moduleId, status) =>
    apiRequest(`/admin/trainees/${traineeId}/progress/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  setEmploymentStartDate: (traineeId, employmentStartDate) =>
    apiRequest(`/admin/trainees/${traineeId}/employment-start-date`, {
      method: 'PATCH',
      body: JSON.stringify({ employmentStartDate }),
    }),

  recordTraineeMetric: (traineeId, category, score, notes, caseActionType) =>
    apiRequest(`/admin/trainees/${traineeId}/metrics/${category}`, {
      method: 'POST',
      body: JSON.stringify({ score, notes, caseActionType }),
    }),

  getTraineeMetricHistory: (traineeId, category) =>
    apiRequest(`/admin/trainees/${traineeId}/metrics/${category}/history`),

  recordCaseTypeEvent: (traineeId, caseType, eventType, notes) =>
    apiRequest(`/admin/trainees/${traineeId}/case-events`, {
      method: 'POST',
      body: JSON.stringify({ caseType, eventType, notes }),
    }),

  getCaseTypeStatus: (traineeId) => apiRequest(`/admin/trainees/${traineeId}/case-status`),

  recordSecondPartyReview: (traineeId, caseType, caseActionType, outcome, notes) =>
    apiRequest(`/admin/trainees/${traineeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ caseType, caseActionType, outcome, notes }),
    }),

  getReviewHistory: (traineeId) => apiRequest(`/admin/trainees/${traineeId}/reviews`),

  getTraineeSelfReports: (traineeId) => apiRequest(`/admin/trainees/${traineeId}/self-reports`),

  getHighwayTrainingWeeks: () => apiRequest('/admin/highway-training'),

  updateHighwayTrainingWeek: (weekNumber, data) =>
    apiRequest(`/admin/highway-training/${weekNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  setHighwayTrainingDates: (traineeId, highwayTrainingStartDate, highwayTrainingEndDate) =>
    apiRequest(`/admin/trainees/${traineeId}/highway-training-dates`, {
      method: 'PATCH',
      body: JSON.stringify({ highwayTrainingStartDate, highwayTrainingEndDate }),
    }),

  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return apiRequest(`/admin/reports${query ? `?${query}` : ''}`);
  },

  createCourse: (payload) =>
    apiRequest('/admin/courses', { method: 'POST', body: JSON.stringify(payload) }),

  listCourses: () => apiRequest('/admin/courses'),

  updateCourseModules: (courseId, modules) =>
    apiRequest(`/admin/courses/${courseId}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    }),

  assignCourseToTrainee: (traineeId, courseId) =>
    apiRequest(`/admin/trainees/${traineeId}/assign-course`, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    }),

  unassignCourseFromTrainee: (traineeId, courseId) =>
    apiRequest(`/admin/trainees/${traineeId}/assign-course/${courseId}`, {
      method: 'DELETE',
    }),

  updateCourse: (courseId, data) =>
    apiRequest(`/admin/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCourse: (courseId) =>
    apiRequest(`/admin/courses/${courseId}`, { method: 'DELETE' }),

  // Open to any management account - "everyone except trainees" can add,
  // edit, or archive a trainee.
  createTrainee: (payload) =>
    apiRequest('/admin/trainees', { method: 'POST', body: JSON.stringify(payload) }),

  listTrainees: () => apiRequest('/admin/trainees'),

  updateTrainee: (traineeId, payload) =>
    apiRequest(`/admin/trainees/${traineeId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  markCourseCompleted: (traineeId, courseId) =>
    apiRequest('/admin/trainees/' + traineeId + '/course-completed', {
      method: 'POST',
      body: JSON.stringify({ traineeId, courseId }),
    }),

  unmarkCourseCompleted: (traineeId, courseId) =>
    apiRequest('/admin/trainees/' + traineeId + '/courses/' + courseId + '/completed', { method: 'DELETE' }),

  getTraineeCourseCompletions: (traineeId) =>
    apiRequest('/admin/trainees/' + traineeId + '/course-completions'),

  deleteTrainee: (traineeId) =>
    apiRequest(`/admin/trainees/${traineeId}`, { method: 'DELETE' }),

  setTraineeArchived: (traineeId, archived) =>
    apiRequest(`/admin/trainees/${traineeId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    }),

  // Admin-only (server-enforced regardless of what the UI shows/hides).
  createManagementUser: (payload) =>
    apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),

  updateManagementUser: (userId, payload) =>
    apiRequest(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  assignTraineeRelationships: (traineeId, trainerId, directManagerId, backupManagerId, note) =>
    apiRequest(`/admin/trainees/${traineeId}/relationships`, {
      method: 'PATCH',
      body: JSON.stringify({ trainerId, directManagerId, backupManagerId, note }),
    }),

  getAssignmentHistory: (traineeId) => apiRequest(`/admin/trainees/${traineeId}/assignment-history`),

  listManagementUsers: () => apiRequest('/admin/users'),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/admin/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  setUserArchived: (userId, archived) =>
    apiRequest(`/admin/users/${userId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    }),

  deleteManagementUser: (userId) =>
    apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),

  generateSelfReportCredentials: (traineeId) =>
    apiRequest(`/admin/trainees/${traineeId}/self-report-credentials`, {
      method: 'POST',
    }),

  // Trainee token-based access (no username/password)
  verifySelfReportToken: (token) =>
    apiRequest('/auth/verify-self-report-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  submitSelfReport: (token, payload) =>
    apiRequest('/self-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  getMyReportHistory: () => traineeRequest('/self-report/history'),

  getTraineeAssignedCourses: (traineeId, token) =>
    apiRequest(`/self-report/courses`, {
      method: 'GET',
    }, token),

  markCourseCompleteAsSelf: (courseId) =>
    traineeRequest(`/self-report/courses/${courseId}/complete`, {
      method: 'POST',
    }),

  getDashboardMetrics: () => apiRequest('/dashboard/metrics'),
  getDashboardByCourse: () => apiRequest('/dashboard/by-course'),
  getDashboardByManager: () => apiRequest('/dashboard/by-manager'),
  getDashboardTimeline: () => apiRequest('/dashboard/timeline'),
  getDashboardStatusDistribution: () => apiRequest('/dashboard/status-distribution'),

  getSubmissionRateAnalytics: () => apiRequest('/analytics/submission-rate'),
  getBottleneckAnalysis: () => apiRequest('/analytics/bottleneck'),
  getSubmissionTimeline: () => apiRequest('/analytics/submission-timeline'),
  getHelpAreaRequests: () => apiRequest('/analytics/help-areas'),

  getSkillAreas: () => apiRequest('/skill-areas'),
  getAllSkillAreas: () => apiRequest('/skill-areas/admin/all'),
  updateSkillArea: (id, data) => apiRequest(`/skill-areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createSkillArea: (data) => apiRequest('/skill-areas', { method: 'POST', body: JSON.stringify(data) }),
  deleteSkillArea: (id) => apiRequest(`/skill-areas/${id}`, { method: 'DELETE' }),
};
