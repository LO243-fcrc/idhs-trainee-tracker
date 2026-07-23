// Computes where a trainee sits in the 12-month arc from their training
// start date. Used on the detail page and the dashboard matrix so
// trainees added mid-program (start date in the past) show correctly
// instead of looking like they just started.
export function monthsElapsedSince(dateString) {
  if (!dateString) return null;
  const start = new Date(dateString);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

const CHECKPOINTS = [3, 6, 9, 12];

export function describeTimeline(employmentStartDate) {
  const monthsElapsed = monthsElapsedSince(employmentStartDate);
  if (monthsElapsed === null) return { monthsElapsed: null, label: 'Start date not set' };

  if (monthsElapsed >= 12) {
    return { monthsElapsed, label: `Month ${monthsElapsed} \u2014 certification evaluation due` };
  }
  const nextCheckpoint = CHECKPOINTS.find((c) => c > monthsElapsed) ?? 12;
  return { monthsElapsed, label: `Month ${monthsElapsed} of 12 \u2014 next checkpoint: ${nextCheckpoint} months` };
}
