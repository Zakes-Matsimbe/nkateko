// src/pages/staff_comp/Notifications.jsx

import { useEffect, useState } from "react";
import api from "../../lib/api";

const Notifications = () => {

  const [notifications, setNotifications] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/staff/staffnotifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleNotification = async (notif) => {

    if (openId === notif.id) {
      setOpenId(null);
      return;
    }

    setOpenId(notif.id);

    if (!notif.is_read) {

      try {
        await api.patch(`/api/staff/staffnotifications/${notif.id}/read`);

        setNotifications(prev =>
          prev.map(n =>
            n.id === notif.id ? { ...n, is_read: 1 } : n
          )
        );

      } catch (err) {
        console.error("Failed to mark read");
      }

    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4">

      {/* Header */}
      <div className="d-flex align-items-center mb-4">

        <h2 className="fw-bold text-primary me-3">
          <i className="bi bi-bell me-2"></i>
          Notifications
        </h2>

        {unreadCount > 0 && (
          <span className="badge bg-danger fs-6">
            {unreadCount}
          </span>
        )}

      </div>

      {notifications.length === 0 && (
        <div className="alert alert-info">
          No notifications yet
        </div>
      )}

      <div className="card shadow-sm border-0">

        <div className="list-group list-group-flush">

          {notifications.map((n) => {

            const isOpen = openId === n.id;

            return (
              <div
                key={n.id}
                className={`list-group-item notification-item ${
                  !n.is_read ? "unread" : ""
                }`}
              >

                {/* Title Row */}
                <div
                  className="d-flex justify-content-between align-items-center notification-header"
                  onClick={() => toggleNotification(n)}
                  style={{ cursor: "pointer" }}
                >

                  <div>

                    <strong>{n.title}</strong>

                    {!n.is_read && (
                      <span className="badge bg-primary ms-2">
                        new
                      </span>
                    )}

                  </div>

                  <small className="text-muted">
                    {new Date(n.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                  </small>

                </div>

                {/* Expand Content */}
                {isOpen && (

                  <div className="notification-body mt-3 text-muted">

                    {n.content}

                  </div>

                )}

              </div>
            );
          })}

        </div>

      </div>

      {/* Styling */}
      <style jsx>{`

        .notification-item {
          transition: all 0.2s ease;
        }

        .notification-item:hover {
          background: #f8fbff;
        }

        .notification-item.unread {
          border-left: 4px solid #0d6efd;
          background: #f5f9ff;
        }

        .notification-header strong {
          font-size: 15px;
        }

        .notification-body {
          font-size: 14px;
          line-height: 1.5;
          padding-left: 4px;
        }

      `}</style>

    </div>
  );
};

export default Notifications;