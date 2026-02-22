// src/pages/LearnerPortal.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import api from '../lib/api';

function LearnerPortal() {
  const { user, logout, toggleTheme, theme } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [rawAssessments, setRawAssessments] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, assessRes, attendRes, notifRes, appRes] = await Promise.all([
          api.get('/api/learner/profile'),
          api.get('/api/learner/assessments'),
          api.get('/api/learner/attendance'),
          api.get('/api/learner/notifications'),
          api.get('/api/learner/applications'),
        ]);

        setProfile(profileRes.data);
        setRawAssessments(assessRes.data);
        setRawAttendance(attendRes.data);
        setNotifications(notifRes.data);
        setApplications(appRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group raw attendance by month
  const groupedAttendance = rawAttendance.reduce((acc, item) => {
    const month = new Date(item.class_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { total_days: 0, attended: 0 };
    }
    acc[month].total_days += 1;
    if (item.status === 'Attended') acc[month].attended += 1;
    return acc;
  }, {});

  // Group raw assessments by month/subject
  const groupedAssessments = rawAssessments.reduce((acc, item) => {
    const month = new Date(item.date_written).toLocaleString('default', { month: 'long', year: 'numeric' });
    const subject = item.subject;
    const key = `${month} - ${subject}`;
    if (!acc[key]) {
      acc[key] = { month, subject, marks: [] };
    }
    acc[key].marks.push(parseFloat(item.mark));
    return acc;
  }, {});

  const getAttendanceComment = (perc) => {
    if (perc < 60) return 'Bad';
    if (perc < 75) return 'Be careful';
    if (perc < 85) return 'No so well';
    if (perc < 100) return 'Good';
    return 'Good';
  };

  const getAssessmentComment = (avg) => {
    if (avg < 60) return 'Not doing well';
    if (avg < 70) return 'Trying';
    if (avg < 85) return 'Good';
    return 'Excellent';
  };

  const getOutcome = (perc) => {
    if (perc < 45) return 'Failed';
    if (perc < 60) return 'Below expectation';
    if (perc < 85) return 'Passed';
    return 'Excellent';
  };

  if (loading) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center">
      <div className="spinner-border text-primary" role="status"></div>
    </div>;
  }

  if (error) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center">
      <div className="alert alert-danger">{error}</div>
    </div>;
  }

  return (
    <div className="d-flex min-vh-100" data-bs-theme={theme}>
      {/* Sidebar */}
      <div
        className={`offcanvas offcanvas-start ${sidebarOpen ? 'show' : ''}`}
        tabIndex="-1"
        id="sidebar"
        style={{ width: '280px' }}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Learner Menu</h5>
          <button type="button" className="btn-close" onClick={() => setSidebarOpen(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <ul className="list-group list-group-flush">
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
              Dashboard
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('assessments'); setSidebarOpen(false); }}>
              Assessments
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }}>
              Attendance
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }}>
              Notifications
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('applications'); setSidebarOpen(false); }}>
              Applications
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('term-marks'); setSidebarOpen(false); }}>
              Term Marks
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('teacher-reviews'); setSidebarOpen(false); }}>
              Teacher Reviews
            </li>
            <li className="list-group-item list-group-item-action" onClick={() => { setActiveTab('warnings'); setSidebarOpen(false); }}>
              Warnings
            </li>
            <li className="list-group-item list-group-item-action text-danger" onClick={logout}>
              Logout
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Navbar */}
        <nav className="navbar navbar-expand navbar-light bg-white dark:bg-dark shadow-sm sticky-top">
          <div className="container-fluid px-4">
            <button className="btn btn-outline-secondary d-lg-none me-3" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-4"></i>
            </button>
            <a className="navbar-brand fw-bold fs-4" href="#">
              Learner Portal
            </a>
            <div className="ms-auto d-flex align-items-center gap-3">
              <span className="d-none d-md-block">
                {profile?.name}
              </span>
              <button className="btn btn-outline-secondary" onClick={toggleTheme}>
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>
              <button className="btn btn-outline-danger" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Dashboard */}
        <div className="container py-5">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="mb-4">Dashboard</h2>
              <div className="row g-4 mb-5">




{/* Profile Section */}
<section id="profile" className="mb-5">
  <div className="card shadow border-0 rounded-4 overflow-hidden">
    <div className="card-body p-4 p-md-5 text-center">
      <i className="bi bi-person-circle display-1 text-primary mb-4"></i>
      
      <h2 className="mb-3 fw-bold">
        Hi, 🤗 {profile?.name || 'Learner'} 
      </h2>
      
      <div className="mb-4">
       {/*} <p className="fs-5 text-muted mb-1">
          Bokamoso Number
        </p> */}
        <p className="fs-4 fw-bold text-dark">
          {profile?.bokamoso_number || 'Not available'}
        </p>
      </div>

          {/* Other profile info */}
          <div className="row g-3 justify-content-center mb-4">
            <div className="col-6 col-md-4">
              <div className="bg-light dark:bg-secondary p-3 rounded">
                <strong>Email</strong><br />
                {profile?.email || 'N/A'}
              </div>
            </div>


          </div>

          <button className="btn btn-outline-primary btn-lg px-5">
            Change Email
          </button>
        </div>
      </div>
    </section>


                {/* Attendance Summary */}
                <div className="col-12 col-md-6">
                  <div className="card shadow">
                    <div className="card-body">
                      <h4>Attendance Summary</h4>
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Month</th>
                            <th>Total Days</th>
                            <th>Attended</th>
                            <th>%</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedAttendance).map(([month, data], i) => {
                            const perc = (data.attended / data.total_days * 100).toFixed(0);
                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{month}</td>
                                <td>{data.total_days}</td>
                                <td>{data.attended}</td>
                                <td>{perc}%</td>
                                <td>{getAttendanceComment(perc)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Assessments Summary */}
                <div className="col-12 col-md-6">
                  <div className="card shadow">
                    <div className="card-body">
                      <h4>Assessments Summary</h4>
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Month</th>
                            <th>Subject</th>
                            <th>Average</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(groupedAssessments).map((item, i) => {
                            const avg = item.marks.reduce((a, b) => a + b, 0) / item.marks.length;
                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{item.month}</td>
                                <td>{item.subject}</td>
                                <td>{avg.toFixed(0)}%</td>
                                <td>{getAssessmentComment(avg)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessments' && (
            <div>
              <h2 className="mb-4">Assessments</h2>
              <table className="table table-striped table-hover table-bordered shadow-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Assessment Name</th>
                    <th>Date Written</th>
                    <th>%</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {rawAssessments.map((a, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{a.subject}</td>
                      <td>{a.assessment_name}</td>
                      <td>{new Date(a.date_written).toLocaleDateString()}</td>
                      <td>{a.mark}%</td>
                      <td>{getOutcome(a.mark)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary below */}
              <h4 className="mt-4">Summary</h4>
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Subject</th>
                    <th>Average</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groupedAssessments).map((item, i) => {
                    const avg = item.marks.reduce((a, b) => a + b, 0) / item.marks.length;
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.month}</td>
                        <td>{item.subject}</td>
                        <td>{avg.toFixed(0)}%</td>
                        <td>{getAssessmentComment(avg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h2 className="mb-4">Attendance</h2>
              <table className="table table-striped table-hover table-bordered shadow-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {rawAttendance.map((a, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{new Date(a.class_date).toLocaleDateString()}</td>
                      <td>{a.status}</td>
                      <td>{a.status === 'Apology' ? a.apology_message : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary below */}
              <h4 className="mt-4">Summary</h4>
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Total Days</th>
                    <th>Attended</th>
                    <th>%</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedAttendance).map(([month, data], i) => {
                    const perc = (data.attended / data.total_days * 100).toFixed(0);
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{month}</td>
                        <td>{data.total_days}</td>
                        <td>{data.attended}</td>
                        <td>{perc}%</td>
                        <td>{getAttendanceComment(perc)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add other tabs similarly */}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="mb-4">Notifications</h2>
              <ol className="list-group list-group-numbered shadow-sm rounded">
                {notifications.map((n, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-start">
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{n.title}</div>
                      {n.content}
                    </div>
                    <span className="badge bg-primary rounded-pill">{n.created_at}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Applications tab */}
          {activeTab === 'applications' && (
            <div>
              <h2 className="mb-4">Applications</h2>
              <ol className="list-group list-group-numbered shadow-sm rounded">
                {applications.map((a, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-start">
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{a.app_id}</div>
                      Year: {a.year}, Status: {a.status}, Grade: {a.grade}
                    </div>
                    <span className="badge bg-primary rounded-pill">{a.created_at}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearnerPortal;