// src/pages/learner_comp/Warnings.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Warnings = () => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Assuming you have an API endpoint for warnings (or use placeholder data)
    // Change this to your actual endpoint if you have one
    const fetchData = async () => {
      try {
        // Example: api.get('/api/learner/warnings')
        // For now using placeholder - replace with real fetch
        const mockData = [
          { id: 1, type: 'Yellow', reason: 'Low attendance in Term 1', date: '2025-11-15', severity: 'medium' },
          { id: 2, type: 'Red', reason: 'Multiple missed assessments', date: '2025-10-20', severity: 'high' },
        ];
        setWarnings(mockData);
        // Uncomment when you have real endpoint:
        // const res = await api.get('/api/learner/warnings');
        // setWarnings(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load warnings');
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
      <h2 className="mb-4 fw-bold">Warnings & Notices</h2>

      {warnings.length > 0 ? (
        <div className="list-group shadow-sm rounded">
          {warnings.map((w) => (
            <div key={w.id} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  {w.type} Card
                  {w.severity === 'high' && <span className="badge bg-danger ms-2">High</span>}
                  {w.severity === 'medium' && <span className="badge bg-warning ms-2">Medium</span>}
                </h5>
                <small>{new Date(w.date).toLocaleDateString()}</small>
              </div>
              <p className="mb-1">{w.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-success text-center py-5">
          No active warnings at this time
        </div>
      )}
    </div>
  );
};

export default Warnings;