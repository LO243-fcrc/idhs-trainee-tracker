import { METRIC_LABELS, METRIC_CATEGORIES } from '@/lib/metrics';

// Evaluation snapshot aligned to the 3/6/9/12-month formal review schedule.
// For each checkpoint that has already passed, shows the trainee's standing
// AS OF that date: the most recent score per category recorded on or before
// the checkpoint. Computed entirely from scoreHistory - no extra endpoint.
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreAsOf(scoreHistory, cutoff) {
  // scoreHistory is oldest-first; walk to the last entry on/before cutoff.
  let result = null;
  for (const entry of scoreHistory) {
    if (new Date(entry.recordedAt) <= cutoff) result = entry.score;
    else break;
  }
  return result;
}

export default function QuarterlySnapshot({ employmentStartDate, performanceMetrics }) {
  if (!employmentStartDate) {
    return (
      <p className="text-sm text-slate-400">
        Set the Start of Employment date to see snapshots aligned to the 3/6/9/12-month review schedule.
      </p>
    );
  }

  const now = new Date();
  const checkpoints = [3, 6, 9, 12].map((months) => ({
    months,
    date: addMonths(employmentStartDate, months),
  }));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Metric</th>
            {checkpoints.map((cp) => (
              <th key={cp.months} className="px-4 py-2.5 text-left font-semibold text-slate-700">
                Month {cp.months}
                <span className="block text-xs font-normal text-slate-400">
                  {cp.date > now ? `upcoming \u00b7 ${formatDate(cp.date)}` : formatDate(cp.date)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {METRIC_CATEGORIES.map((category) => {
            const metric = performanceMetrics.find((m) => m.category === category);
            const history = metric?.scoreHistory || [];
            return (
              <tr key={category}>
                <td className="px-4 py-2 font-medium text-slate-800">{METRIC_LABELS[category]}</td>
                {checkpoints.map((cp) => {
                  if (cp.date > now) {
                    return <td key={cp.months} className="px-4 py-2 text-slate-300">\u2014</td>;
                  }
                  const score = scoreAsOf(history, cp.date);
                  if (score === null) {
                    return <td key={cp.months} className="px-4 py-2 text-xs text-slate-400">not scored</td>;
                  }
                  return (
                    <td key={cp.months} className={`px-4 py-2 font-semibold ${score > 70 ? 'text-green-700' : 'text-red-600'}`}>
                      {score}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Each cell is the most recent score on record as of that checkpoint. Green means above the 70% certification bar.
      </p>
    </div>
  );
}
