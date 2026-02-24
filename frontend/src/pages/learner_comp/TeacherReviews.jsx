// src/pages/learner_comp/TeacherReviews.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [options, setOptions] = useState({ reviews_open: false, teachers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get options (teachers + open status)
        const optionsRes = await api.get('/api/learner/teacher-review-options');
        setOptions(optionsRes.data);

        // Get my reviews
        const reviewsRes = await api.get('/api/learner/teacher-reviews');
        setReviews(reviewsRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTeacher || !selectedSubject || rating === 0) {
      setError("Please select teacher/tutor, subject, and give a rating");
      return;
    }

    try {
      await api.post('/api/learner/teacher-reviews', {
        staff_id: parseInt(selectedTeacher),
        subject: selectedSubject,
        rating: parseFloat(rating),
        comment: comment.trim() || null
      });

      setSuccess("Review submitted successfully!");
      setSelectedTeacher('');
      setSelectedSubject('');
      setRating(0);
      setComment('');

      // Refresh reviews
      const res = await api.get('/api/learner/teacher-reviews');
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    }
  };

  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    setSelectedTeacher(teacherId);
    setSelectedSubject(''); // Reset subject
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  if (error) return <div className="alert alert-danger text-center">{error}</div>;

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold">Teacher & Tutor Reviews</h2>

      {!options.reviews_open ? (
        <div className="alert alert-warning text-center py-4">
          Submission of reviews is currently closed.
        </div>
      ) : (
        <div className="card shadow border-0 rounded-4 mb-5">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">Submit a New Review</h4>

            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              <div className="mb-3">
                <label className="form-label fw-bold">Select Teacher/Tutor</label>
                <select
                  className="form-select"
                  value={selectedTeacher}
                  onChange={handleTeacherChange}
                  required
                >
                  <option value="">Choose teacher/tutor</option>
                  {options.teachers.map(t => (
                    <option key={t.staff_id} value={t.staff_id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Subject</label>
                <select
                  className="form-select"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  required
                  disabled={!selectedTeacher}
                >
                  <option value="">Choose subject</option>
                  {selectedTeacher &&
                    options.teachers
                      .find(t => t.staff_id === parseInt(selectedTeacher))
                      ?.subjects.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Rating</label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`btn btn-outline-warning fs-4 p-2 ${rating >= star ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Comment (optional)</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-lg px-5">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      <h4 className="mb-3">Your Previous Reviews</h4>

      {reviews.length > 0 ? (
        <div className="row g-4">
          {reviews.map(review => (
            <div key={review.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow border-0 rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{review.teacher}</h5>
                    <span className="badge bg-primary rounded-pill fs-6">
                      {review.rating} ★
                    </span>
                  </div>
                  <h6 className="card-subtitle mb-2 text-muted">{review.subject}</h6>
                  <p className="card-text">{review.comment || <em>No comment</em>}</p>
                  <small className="text-muted d-block">
                    Reviewed on {new Date(review.date).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          You haven't submitted any reviews yet.
        </div>
      )}
    </div>
  );
};

export default TeacherReviews;