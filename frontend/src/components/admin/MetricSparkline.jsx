// Minimal inline SVG line chart - no charting library needed for a handful
// of points. Expects scores oldest-to-newest (left to right).
export default function MetricSparkline({ scores, width = 200, height = 48 }) {
  if (scores.length < 2) {
    return <p className="text-xs text-gray-400">Record at least 2 scores to see a trend line.</p>;
  }

  const padding = 4;
  const stepX = (width - padding * 2) / (scores.length - 1);
  const toY = (score) => height - padding - (score / 100) * (height - padding * 2);

  const points = scores.map((score, i) => `${padding + i * stepX},${toY(score)}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600" />
      {scores.map((score, i) => (
        <circle key={i} cx={padding + i * stepX} cy={toY(score)} r="2.5" className="fill-green-600" />
      ))}
    </svg>
  );
}
