// src/pages/learner_comp/Notifications.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/learner/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/api/learner/notifications/${notificationId}/read`);

      // Optimistic UI update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
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
        <ol className="list-group shadow-sm rounded">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`list-group-item d-flex justify-content-between align-items-start
                ${!n.is_read ? 'list-group-item-warning' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => !n.is_read && markAsRead(n.id)}
            >
              <div className="ms-2 me-auto">
                <div className="fw-bold">{n.title || 'Notification'}</div>

                <p className="mb-1">{n.content || 'No content available'}</p>

                <small className="text-muted d-block">
                  From {n.sender_name} ({n.sender_type})
                </small>

                <small className="text-muted">
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString()
                    : 'No date'}
                </small>
              </div>

              <span
                className={`badge rounded-pill align-self-center
                  ${n.is_read ? 'bg-success' : 'bg-warning text-dark'}`}
              >
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