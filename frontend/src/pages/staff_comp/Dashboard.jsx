// src/pages/staff_comp/Dashboard.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [currentMonthHours, setCurrentMonthHours] = useState(0);
  const [estimatedPay, setEstimatedPay] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, timesheetsRes, notificationsRes] = await Promise.all([
          api.get('/api/staff/profile'),
          api.get('/api/staff/timesheets', { params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } }),
          api.get('/api/staff/notifications'),
        ]);

        const profileData = profileRes.data;
        setProfile(profileData);

        const hours = timesheetsRes.data.total_hours || 0;
        setCurrentMonthHours(hours.toFixed(1));

        // Use real hourly rate from profile (fallback to 250 if missing)
        const rate = profileData.hourly_rate || 250;
        setEstimatedPay((hours * rate).toFixed(2));

        setNotifications(notificationsRes.data.slice(0, 5) || []);

        // Placeholder projects (replace with real fetch later)
        setProjects([
          { name: 'Grade 11 Math Revision', status: 'Ongoing', due: '2026-03-15' },
          { name: 'Physics Lab Prep', status: 'Pending', due: '2026-03-20' },
        ]);
      } catch (err) {
        setError('Failed to load dashboard data');
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
        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center py-5 shadow rounded-4">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="py-4">
        <h2 className="mb-5 fw-bold text-center text-primary">Staff Dashboard</h2>

        {/* Profile Card */}
        <div className="card shadow border-0 rounded-4 mb-5">
          <div className="card-body p-5 text-center">
            <i className="bi bi-person-circle display-1 text-primary mb-4"></i>
            <h3 className="fw-bold mb-3">Hi, {profile?.name || user?.name || 'Staff'}!</h3>
            <div className="d-flex flex-wrap justify-content-center gap-4 mt-3">
              <div>
                <small className="text-muted d-block">Your Assigned Role</small>
                <strong>{profile?.role}</strong>
              </div>
              <div>
                <small className="text-muted d-block">Your Assigned Subject(s)</small>
                <strong>{profile?.subjects || '—'}</strong>
              </div>
              <div>
                <small className="text-muted d-block">Your Assigned Grade(s)</small>
                <strong>{profile?.grades || '—'}</strong>
              </div>
              <div>
                <small className="text-muted d-block">Your Hourly Rate</small>
                <strong>R{profile?.hourly_rate?.toFixed(2) || '41.67'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="card shadow border-0 rounded-4 h-100 bg-gradient bg-opacity-10 bg-primary">
              <div className="card-body p-5 text-center">
                <h5 className="fw-bold mb-3">Current Month Hours</h5>
                <div className="display-4 fw-bold text-primary">{currentMonthHours}</div>
                <small className="text-muted">hours worked this month</small>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow border-0 rounded-4 h-100 bg-gradient bg-opacity-10 bg-success">
              <div className="card-body p-5 text-center">
                <h5 className="fw-bold mb-3">Estimated Pay</h5>
                <div className="display-4 fw-bold text-success">R{estimatedPay}</div>
                <small className="text-muted">based on {profile?.hourly_rate ? `R${profile.hourly_rate.toFixed(2)}/hr` : 'R250/hr'}</small>
              </div>
            </div>
          </div>
        </div>

          {/* Latest Notifications */}
          <div className="card shadow border-0 rounded-4 mb-5">
            <div className="card-header bg-primary text-white fw-bold">
              Latest Notifications
            </div>
            <div className="card-body">
              {notifications.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {notifications.map((n, i) => (
                    <li key={i} className="list-group-item">
                      <strong>{n.title}</strong>
                      <p className="mb-1 small text-muted">{n.content?.substring(0, 120)}...</p>
                      <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-center my-4">No recent notifications</p>
              )}
            </div>
          </div>

          {/* Projects / Tasks */}
          <div className="card shadow border-0 rounded-4">
            <div className="card-header bg-info text-white fw-bold">
              Ongoing Projects / Tasks
            </div>
            <div className="card-body">
              {projects.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, i) => (
                        <tr key={i}>
                          <td>{p.name}</td>
                          <td><span className={`badge bg-${p.status === 'Ongoing' ? 'warning' : 'secondary'}`}>{p.status}</span></td>
                          <td>{p.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center my-4">No ongoing projects</p>
              )}
            </div>
          </div>
        </div>
      
    </>
  );
};

export default Dashboard;