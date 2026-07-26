import { formatDate, formatDateShort } from '@/lib/dateUtils';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import ReviewModal from '@/components/admin/ReviewModal';
import { api } from '@/lib/api';


function ReviewBadge({ review }) {
  const decisionColors = {
    PASS: 'bg-green-100 text-green-700',
    FAIL: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${decisionColors[review.decision]}`}>
      {review.reviewNumber}M: {review.decision}
    </span>
  );
}

export default function QuarterlyReviews() {
  const [trainees, setTrainees] = useState([]);
  const [reviews, setReviews] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedReviewNumber, setSelectedReviewNumber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError('');

      // Load trainees
      const traineesData = await api.listTrainees();
      setTrainees(traineesData.trainees || []);

      // Load all reviews
      const reviewsData = await api.listReviews();
      const reviewsByTrainee = {};
      (reviewsData.reviews || []).forEach(review => {
        if (!reviewsByTrainee[review.traineeId]) {
          reviewsByTrainee[review.traineeId] = [];
        }
        reviewsByTrainee[review.traineeId].push(review);
      });
      setReviews(reviewsByTrainee);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateReview(trainee, reviewNumber) {
    console.log('[QuarterlyReviews] Create clicked:', { trainee: trainee.name, reviewNumber });
    setSelectedTrainee(trainee);
    setSelectedReviewNumber(reviewNumber);
    setIsModalOpen(true);
    console.log('[QuarterlyReviews] Modal should open now');
  }

  async function handleReviewSaved() {
    setIsModalOpen(false);
    await loadData();
  }

  function getReview(traineeId, reviewNumber) {
    return (reviews[traineeId] || []).find(r => r.reviewNumber === reviewNumber);
  }

  function hasReview(traineeId, reviewNumber) {
    return !!getReview(traineeId, reviewNumber);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quarterly Reviews</h1>
          <p className="text-sm text-slate-500">Create and manage quarterly performance reviews at 3, 6, 9, and 12-month checkpoints.</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">Loading reviews...</p>
          </div>
        ) : trainees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-400">No trainees found. Add trainees first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainees.filter(t => !t.archivedAt).map((trainee) => (
              <div key={trainee.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{trainee.name}</p>
                    <p className="text-xs text-slate-500">
                      Started: {formatDate(trainee.employmentStartDate) || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Review Status Grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((reviewNumber) => {
                    const review = getReview(trainee.id, reviewNumber);
                    const monthLabel = reviewNumber === 4 ? '12M (Certification)' : `${reviewNumber * 3}M`;

                    return (
                      <div key={reviewNumber} className="rounded border border-slate-200 p-3 text-center">
                        <p className="text-xs font-medium text-slate-600 mb-2">{monthLabel}</p>
                        {review ? (
                          <div className="space-y-2">
                            <ReviewBadge review={review} />
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTrainee(trainee);
                                  setSelectedReviewNumber(reviewNumber);
                                  setIsModalOpen(true);
                                }}
                                className="flex-1 text-xs py-1 h-auto"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateReview(trainee, reviewNumber)}
                            className="w-full text-xs py-1 h-auto"
                          >
                            Create
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTrainee && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trainee={selectedTrainee}
          reviewNumber={selectedReviewNumber}
          existingReview={getReview(selectedTrainee.id, selectedReviewNumber)}
          onSaved={handleReviewSaved}
        />
      )}
    </AppLayout>
  );
}
