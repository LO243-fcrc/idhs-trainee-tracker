// On Track / Needs Improvement / At Risk indicator, derived server-side
// from each trainee's latest score per category vs the >70% certification
// bar and how far through the 12 months they are.
const RISK_STYLES = {
  ON_TRACK: 'bg-green-100 text-green-700',
  NEEDS_IMPROVEMENT: 'bg-amber-100 text-amber-800',
  AT_RISK: 'bg-red-100 text-red-700',
  NOT_SCORED: 'bg-slate-100 text-slate-500',
};

const RISK_LABELS = {
  ON_TRACK: 'On Track',
  NEEDS_IMPROVEMENT: 'Needs Improvement',
  AT_RISK: 'At Risk',
  NOT_SCORED: 'Not Scored',
};

const RISK_DOTS = {
  ON_TRACK: 'bg-green-500',
  NEEDS_IMPROVEMENT: 'bg-amber-500',
  AT_RISK: 'bg-red-500',
  NOT_SCORED: 'bg-slate-400',
};

export default function RiskBadge({ status }) {
  const key = RISK_STYLES[status] ? status : 'NOT_SCORED';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_STYLES[key]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOTS[key]}`} />
      {RISK_LABELS[key]}
    </span>
  );
}
