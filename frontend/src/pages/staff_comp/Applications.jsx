// src/pages/learner_comp/Applications.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/applications');
        setApplications(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load applications');
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
      <h2 className="mb-4 fw-bold">My Applications</h2>

      {applications.length > 0 ? (
        <div className="list-group shadow-sm rounded">
          {applications.map((app, i) => (
            <div key={app.id || i} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1 fw-bold">{app.app_id || 'Application #' + (i + 1)}</h5>
                <small className="text-muted">
                  {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                </small>
              </div>
              <p className="mb-1">
                <strong>Year:</strong> {app.year || 'N/A'} |{' '}
                <strong>Status:</strong>{' '}
                <span className={`badge ${
                  app.status === 'Accepted' ? 'bg-success' :
                  app.status === 'Rejected' ? 'bg-danger' :
                  app.status === 'Under Review' ? 'bg-warning' :
                  'bg-secondary'
                }`}>
                  {app.status || 'Draft'}
                </span>
              </p>
              <p className="mb-1">
                <strong>Grade:</strong> {app.grade || 'N/A'} |{' '}
                <strong>Math Type:</strong> {app.math_type || 'N/A'}
              </p>
              {app.data && (
                <small className="text-muted">
                  Additional data: {JSON.stringify(app.data).substring(0, 100)}...
                </small>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          No applications submitted yet
        </div>
      )}

      {/* Optional: Add New Application Button */}
      <div className="text-center mt-5">
        <button className="btn btn-primary btn-lg px-5">
          Submit New Application
        </button>
      </div>
    </div>
  );
};

export default Applications;