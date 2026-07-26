// Inline SVG trend chart for a metric's full score history - no charting
// library. Shows the 70% certification bar as a dashed reference line so
// every trend is read against the standard that matters. Expects
// scoreHistory oldest-first: [{ score, recordedAt }].
const CHART_W = 220;
const CHART_H = 56;
const PAD = 5;

function formatShortDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MetricTrendChart({ scoreHistory }) {
  if (!scoreHistory || scoreHistory.length === 0) {
    return <p className="text-xs text-slate-400">No scores recorded yet.</p>;
  }
  if (scoreHistory.length === 1) {
    return (
      <p className="text-xs text-slate-400">
        One score so far ({scoreHistory[0].score}) — a trend appears after the next one.
      </p>
    );
  }

  const stepX = (CHART_W - PAD * 2) / (scoreHistory.length - 1);
  const toY = (score) => CHART_H - PAD - (score / 100) * (CHART_H - PAD * 2);
  const points = scoreHistory.map((e, i) => `${PAD + i * stepX},${toY(e.score)}`).join(' ');
  const barY = toY(70);

  const latest = scoreHistory[scoreHistory.length - 1];
  const previous = scoreHistory[scoreHistory.length - 2];
  const delta = latest.score - previous.score;
  const lineColor = latest.score > 70 ? 'text-green-600' : 'text-amber-600';

  return (
    <div>
      <svg width={CHART_W} height={CHART_H} className="overflow-visible">
        {/* 70% certification bar */}
        <line x1={PAD} y1={barY} x2={CHART_W - PAD} y2={barY} strokeDasharray="3 3" className="stroke-slate-300" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className={lineColor} />
        {scoreHistory.map((e, i) => (
          <circle key={i} cx={PAD + i * stepX} cy={toY(e.score)} r="2.5" className={e.score > 70 ? 'fill-green-600' : 'fill-amber-600'}>
            <title>{`${e.score} on ${formatShortDate(e.recordedAt)}`}</title>
          </circle>
        ))}
      </svg>
      <p className="mt-0.5 text-xs text-slate-400">
        {formatShortDate(scoreHistory[0].recordedAt)} \u2192 {formatShortDate(latest.recordedAt)}
        {delta !== 0 && (
          <span className={delta > 0 ? 'ml-2 text-green-600' : 'ml-2 text-red-500'}>
            {delta > 0 ? '\u25b2' : '\u25bc'} {Math.abs(delta)} since last
          </span>
        )}
      </p>
    </div>
  );
}
