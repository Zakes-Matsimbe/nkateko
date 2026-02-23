// src/pages/learner_comp/TeacherReviews.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace with your real API endpoint when available
        // const res = await api.get('/api/learner/teacher-reviews');
        // setReviews(res.data);

        // Mock data for now (remove when real API is ready)
        const mockReviews = [
          {
            id: 1,
            teacher: 'Mr. Smith',
            subject: 'Mathematics',
            rating: 4.5,
            comment: 'Excellent explanation of concepts. Very patient and helpful.',
            date: '2025-11-10',
          },
          {
            id: 2,
            teacher: 'Ms. Johnson',
            subject: 'Physical Sciences',
            rating: 3.8,
            comment: 'Good knowledge but needs to improve on marking consistency.',
            date: '2025-10-25',
          },
          {
            id: 3,
            teacher: 'Mr. Nkosi',
            subject: 'English',
            rating: 4.8,
            comment: 'Highly engaging lessons. Encourages critical thinking.',
            date: '2025-12-01',
          },
        ];
        setReviews(mockReviews);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load teacher reviews');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold">Teacher Reviews</h2>

      {reviews.length > 0 ? (
        <div className="row g-4">
          {reviews.map((review) => (
            <div key={review.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow border-0 rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{review.teacher}</h5>
                    <span className="badge bg-primary rounded-pill">
                      {review.rating} / 5
                    </span>
                  </div>
                  <h6 className="card-subtitle mb-2 text-muted">{review.subject}</h6>
                  <p className="card-text">{review.comment}</p>
                  <small className="text-muted">
                    Reviewed on {new Date(review.date).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          No teacher reviews available yet
        </div>
      )}
    </div>
  );
};

export default TeacherReviews;