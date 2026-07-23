// Shared across TraineeDetail, Reports, and the self-report form so labels
// stay consistent everywhere.
export const METRIC_LABELS = {
  POLICY_EFFICIENCY: 'Policy Efficiency',
  IES_EFFICIENCY: 'IES Efficiency',
  DATA_ENTRY_ACCURACY: 'Data Entry Accuracy',
  CASE_COMMENTS_QUALITY: 'Case Comments Quality',
  INTERVIEWING_IN_PERSON: 'Interviewing Skills (In Person)',
  INTERVIEWING_PHONE: 'Interviewing Skills (Phone)',
  TIMELINESS: 'Timeliness',
  ELIGIBILITY_BENEFIT_ACCURACY: 'Eligibility & Benefit Accuracy',
  VERIFICATION_THOROUGHNESS: 'Verification Thoroughness',
  NOTICE_PROCEDURAL_ACCURACY: 'Notice & Procedural Accuracy',
};
export const METRIC_CATEGORIES = Object.keys(METRIC_LABELS);

export const CASE_ACTION_LABELS = {
  INTAKE: 'Intake',
  CHANGE: 'Change',
  ADD_MEMBER: 'Add Member',
  ADD_PROGRAM: 'Add Program',
  REDETERMINATION: 'Redetermination',
};
export const CASE_ACTION_TYPES = Object.keys(CASE_ACTION_LABELS);

export const CASE_TYPE_LABELS = { MEDICAL: 'Medical', SNAP: 'SNAP' };
export const CASE_TYPES = Object.keys(CASE_TYPE_LABELS);

export const REVIEW_OUTCOME_LABELS = {
  CERTIFIED: 'Certified',
  RETURNED_FOR_CORRECTIONS: 'Returned for Corrections',
};
export const REVIEW_OUTCOMES = Object.keys(REVIEW_OUTCOME_LABELS);
