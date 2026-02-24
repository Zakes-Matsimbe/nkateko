// src/pages/learner_comp/Notifications.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/notifications');
        setNotifications(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load notifications');
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
      <h2 className="mb-4 fw-bold">Notifications</h2>

      {notifications.length > 0 ? (
        <ol className="list-group list-group-numbered shadow-sm rounded">
          {notifications.map((n, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">{n.title || 'Notification'}</div>
                <p className="mb-1">{n.content || 'No content available'}</p>
                <small className="text-muted">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : 'No date'}
                </small>
              </div>
              <span className={`badge ${n.is_read ? 'bg-success' : 'bg-warning'} rounded-pill`}>
                {n.is_read ? 'Read' : 'Unread'}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="alert alert-info text-center py-5">
          No notifications at the moment
        </div>
      )}
    </div>
  );
};

export default Notifications;