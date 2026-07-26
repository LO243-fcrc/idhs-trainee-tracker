import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const METRIC_LABELS = {
  'POLICY_EFFICIENCY': 'Policy Efficiency',
  'IES_EFFICIENCY': 'IES Efficiency',
  'DATA_ENTRY_ACCURACY': 'Data Entry Accuracy',
  'CASE_COMMENTS_QUALITY': 'Case Comments Quality',
  'INTERVIEWING_IN_PERSON': 'Interviewing (In-Person)',
  'INTERVIEWING_PHONE': 'Interviewing (Phone)',
  'TIMELINESS': 'Timeliness',
  'ELIGIBILITY_BENEFIT_ACCURACY': 'Eligibility & Benefit Accuracy',
  'VERIFICATION_THOROUGHNESS': 'Verification Thoroughness',
  'NOTICE_PROCEDURAL_ACCURACY': 'Notice & Procedural Accuracy',
};

const METRIC_CATEGORIES = [
  'POLICY_EFFICIENCY',
  'IES_EFFICIENCY',
  'DATA_ENTRY_ACCURACY',
  'CASE_COMMENTS_QUALITY',
  'INTERVIEWING_IN_PERSON',
  'INTERVIEWING_PHONE',
  'TIMELINESS',
  'ELIGIBILITY_BENEFIT_ACCURACY',
  'VERIFICATION_THOROUGHNESS',
  'NOTICE_PROCEDURAL_ACCURACY',
];

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function QuarterlySnapshot({ traineeId, employmentStartDate }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[QuarterlySnapshot] Loading reviews for traineeId:', traineeId);
    loadReviews();
  }, [traineeId]);

  async function loadReviews() {
    try {
      console.log('[QuarterlySnapshot] Calling getTraineeReviews:', traineeId);
      const data = await api.getTraineeReviews(traineeId);
      console.log('[QuarterlySnapshot] Full response:', data);
      console.log('[QuarterlySnapshot] Response keys:', Object.keys(data));
      console.log('[QuarterlySnapshot] data.reviews:', data.reviews);
      console.log('[QuarterlySnapshot] data.reviews type:', Array.isArray(data.reviews) ? 'Array' : typeof data.reviews);
      console.log('[QuarterlySnapshot] data.reviews length:', data.reviews?.length);
      setReviews(data.reviews || []);
      console.log('[QuarterlySnapshot] Reviews set:', data.reviews);
    } catch (err) {
      console.error('[QuarterlySnapshot] Error loading quarterly reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading reviews...</p>;
  }

  if (!employmentStartDate) {
    return (
      <p className="text-sm text-slate-400">
        Set the Start of Employment date to see snapshots aligned to the 3/6/9/12-month review schedule.
      </p>
    );
  }

  // Map reviews by review number (1, 2, 3, 4)
  const reviewsByNumber = {};
  reviews.forEach(r => {
    reviewsByNumber[r.reviewNumber] = r;
  });

  return (
    <div className="space-y-4">
      {/* Reviews Summary */}
      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">No quarterly reviews yet. Create one in the Quarterly Reviews tab.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Metric</th>
                {[1, 2, 3, 4].map((reviewNum) => {
                  const review = reviewsByNumber[reviewNum];
                  const monthLabel = reviewNum === 4 ? '12-Month\n(Certification)' : `${reviewNum * 3}-Month`;
                  return (
                    <th key={reviewNum} className="px-4 py-2.5 text-left font-semibold text-slate-700">
                      <div>{monthLabel}</div>
                      {review && (
                        <span className={`block text-xs font-normal ${
                          review.decision === 'PASS' ? 'text-green-600' :
                          review.decision === 'FAIL' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {review.decision}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {METRIC_CATEGORIES.map((category) => (
                <tr key={category}>
                  <td className="px-4 py-2 font-medium text-slate-800">{METRIC_LABELS[category]}</td>
                  {[1, 2, 3, 4].map((reviewNum) => {
                    const review = reviewsByNumber[reviewNum];
                    if (!review) {
                      return <td key={reviewNum} className="px-4 py-2 text-slate-300">—</td>;
                    }
                    const score = review.scores?.[category];
                    if (score === undefined) {
                      return <td key={reviewNum} className="px-4 py-2 text-xs text-slate-400">no score</td>;
                    }
                    return (
                      <td key={reviewNum} className={`px-4 py-2 font-semibold ${score >= 70 ? 'text-green-700' : 'text-red-600'}`}>
                        {score}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Green = score ≥ 70 (pass). Data from Quarterly Reviews.
          </p>
        </div>
      )}

      {/* Review Details */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-900">
                  {review.reviewNumber === 4 ? '12-Month (Certification)' : `${review.reviewNumber * 3}-Month`} Review
                </p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  review.decision === 'PASS' ? 'bg-green-100 text-green-700' :
                  review.decision === 'FAIL' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {review.decision}
                </span>
              </div>
              {review.notes && (
                <p className="text-sm text-slate-600 mb-2">{review.notes}</p>
              )}
              <p className="text-xs text-slate-400">
                {formatDate(new Date(review.reviewDate))}
                {review.certifiedAt && ` • Certified ${formatDate(new Date(review.certifiedAt))}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
