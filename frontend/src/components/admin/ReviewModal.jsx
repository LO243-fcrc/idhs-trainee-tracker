import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

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

function getCategoryLabel(category) {
  const labels = {
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
  return labels[category] || category;
}

function ReviewForm({ trainee, reviewNumber, existingReview, onSaved, onClose }) {
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('PENDING');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(!existingReview);
  const [reviewId, setReviewId] = useState(existingReview?.id || null);

  console.log('[ReviewForm] Mounted:', { trainee: trainee?.name, reviewNumber, existingReview });

  useEffect(() => {
    console.log('[ReviewForm] useEffect triggered:', { existingReview });
    if (existingReview) {
      console.log('[ReviewForm] Using existing review data');
      setScores(existingReview.scores || {});
      setNotes(existingReview.notes || '');
      setDecision(existingReview.decision || 'PENDING');
      setIsLoading(false);
    } else {
      console.log('[ReviewForm] Loading auto-populated scores');
      loadAutoPopulatedScores();
    }
  }, [existingReview]);

  async function loadAutoPopulatedScores() {
    try {
      console.log('[ReviewForm] Creating review:', { traineeId: trainee.id, reviewNumber });
      // Create the review to get auto-populated scores
      const newReview = await api.createReview(trainee.id, reviewNumber);
      console.log('[ReviewForm] Review created successfully:', newReview);
      setReviewId(newReview.id);
      setScores(newReview.scores || {});
      setNotes('');
      setDecision('PENDING');
      setIsLoading(false);
    } catch (err) {
      console.error('[ReviewForm] Error creating review:', err);
      // If review already exists, get it
      if (err.message?.includes('already exists')) {
        console.log('[ReviewForm] Review already exists, fetching it...');
        const traineeReviews = await api.getTraineeReviews(trainee.id);
        const review = traineeReviews.reviews.find(r => r.reviewNumber === reviewNumber);
        if (review) {
          setReviewId(review.id);
          setScores(review.scores || {});
          setNotes(review.notes || '');
          setDecision(review.decision || 'PENDING');
        }
      } else {
        console.error('[ReviewForm] Setting error:', err.message);
        setError(err.message);
      }
      setIsLoading(false);
    }
  }

  function handleScoreChange(category, value) {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setScores({ ...scores, [category]: numValue });
  }

  function calculatePassed() {
    return Object.values(scores).every(score => score >= 70);
  }

  function getFailedCategories() {
    return Object.entries(scores)
      .filter(([, score]) => score < 70)
      .map(([category]) => category);
  }

  async function handleSave() {
    try {
      console.log('[ReviewForm] handleSave called');
      setError('');
      setIsSaving(true);

      const data = {
        scores,
        notes,
        decision,
        overriddenCategories: null,
      };

      console.log('[ReviewForm] Save data:', data);
      console.log('[ReviewForm] Review ID:', reviewId);

      if (!reviewId) {
        throw new Error('Review ID not found');
      }

      console.log('[ReviewForm] Updating review:', reviewId);
      await api.updateReview(reviewId, data);

      console.log('[ReviewForm] Save successful');
      onSaved();
      onClose();
    } catch (err) {
      console.error('[ReviewForm] Save error:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const monthLabel = reviewNumber === 4 ? '12-Month (Certification)' : `${reviewNumber * 3}-Month`;
  const passed = calculatePassed();
  const failedCategories = getFailedCategories();

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-900">{trainee.name}</p>
        <p className="text-xs text-slate-600">{monthLabel} Review</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading scores...</p>
      ) : (
        <>
          {/* Scores Grid */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <p className="text-sm font-semibold text-slate-900">Performance Scores (0-100)</p>
            {METRIC_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-slate-600 w-40">
                  {getCategoryLabel(category)}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scores[category] || 0}
                  onChange={(e) => handleScoreChange(category, e.target.value)}
                  className={`w-16 rounded border px-2 py-1 text-sm ${
                    scores[category] < 70
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-300'
                  }`}
                />
                <span className={`text-xs font-medium w-8 ${scores[category] >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                  {scores[category] >= 70 ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">
              {passed ? '✓ All scores ≥ 70 (PASS eligible)' : `✗ ${failedCategories.length} categories below 70`}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Manager Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Add comments about overall performance..."
            />
          </div>

          {/* Decision */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Decision</p>
            <div className="flex gap-2">
              <Button
                variant={decision === 'PASS' ? 'default' : 'outline'}
                onClick={() => setDecision('PASS')}
                disabled={!passed}
                className="flex-1"
              >
                Pass
              </Button>
              <Button
                variant={decision === 'FAIL' ? 'danger' : 'outline'}
                onClick={() => setDecision('FAIL')}
                className="flex-1"
              >
                Fail
              </Button>
              <Button
                variant={decision === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setDecision('PENDING')}
                className="flex-1"
              >
                Pending
              </Button>
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Review'}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReviewModal({ isOpen, onClose, trainee, reviewNumber, existingReview, onSaved }) {
  if (!isOpen) return null;

  console.log('[ReviewModal] Rendering modal:', { trainee: trainee?.name, reviewNumber });

  const monthLabel = reviewNumber === 4 ? '12-Month (Certification)' : `${reviewNumber * 3}-Month`;
  const title = existingReview ? `Edit ${monthLabel} Review` : `Create ${monthLabel} Review`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto z-50">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-200 bg-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <ReviewForm
            trainee={trainee}
            reviewNumber={reviewNumber}
            existingReview={existingReview}
            onSaved={onSaved}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}
