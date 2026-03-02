// src/pages/parent_comp/Notifications.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

     // Child's name from profile (fallback if missing)
  const { user } = useAuthStore();
  const childName = user?.childName || 'Child';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/parent/notifications');  // ← parent endpoint
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (notification) => {
    setExpandedId(expandedId === notification.id ? null : notification.id);
    // NO mark as read for parents
  };

  const groupByDate = (items) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const groups = { Earlier: [], Yesterday: [], Today: [] };

    items.forEach((n) => {
      if (!n.created_at) {
        groups.Earlier.push(n);
        return;
      }
      const date = new Date(n.created_at);
      const dateOnly = date.toDateString();
      if (dateOnly === today.toDateString()) groups.Today.push(n);
      else if (dateOnly === yesterday.toDateString()) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });

    return groups;
  };

  const grouped = groupByDate(notifications);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold">{childName}'s  Notifications</h2>

      {notifications.length === 0 && (
        <div className="alert alert-info text-center py-5">
          No notifications at the moment
        </div>
      )}

      {['Earlier', 'Yesterday', 'Today'].map(group => (
        grouped[group].length > 0 && (
          <div key={group} className="mb-4">
            <h6 className="text-uppercase text-muted fw-bold mb-2">{group}</h6>
            <ul className="list-group shadow-sm rounded">
              {grouped[group].map(n => {
                const isExpanded = expandedId === n.id;
                return (
                  <li
                    key={n.id}
                    className={`list-group-item mb-2 rounded-3 border ${
                      isExpanded ? 'border-primary shadow-sm' : ''
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => handleToggle(n)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{n.title || 'Notification'}</div>
                        <small className="text-muted">
                          From {n.sender_name} ({n.sender_type})
                        </small>
                      </div>
                      {/* No read/unread badge for parents */}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 border-top pt-3">
                        <p className="mb-2">{n.content || 'No content available'}</p>
                        <small className="text-muted">
                          Date: {new Date(n.created_at).toLocaleString()}
                        </small>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ))}
    </div>
  );
};

export default Notifications;