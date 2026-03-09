// src/pages/StaffPortal.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Dashboard from './staff_comp/Dashboard';  // Overview, stats
import Timesheets from './staff_comp/Timesheets'; 
import SessionReport from './staff_comp/SessionReports';
import Unavailability from './staff_comp/Unavailability';
import CaptureAssessments from './staff_comp/CaptureAssessments';
import ViewResults from './staff_comp/ViewResults';
import Attendance from './staff_comp/Attenandance';  // Admin only
import Notifications from './staff_comp/Notifications';
import SendMessage from './staff_comp/SendMessage';
import ClassList from './staff_comp/ClassList';  // with modal
import Footer from './learner_comp/Footer';  // Reuse or copy
import './learner_comp/learner.css';  // Reuse or copy to staff

function StaffPortal() {
  const { user, logout, toggleTheme, theme } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body">
      <div className="spinner-border text-primary" role="status" style={{ width: '5rem', height: '5rem' }} />
    </div>;
  }

  if (error || !user) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body">
      <div className="alert alert-danger text-center p-5 rounded-4 shadow">
        {error || 'Session expired. Please login again.'}
        <div className="mt-4">
          <a href="/login" className="btn btn-primary btn-lg">Go to Login</a>
        </div>
      </div>
    </div>;
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div className="d-flex flex-column min-vh-100" data-bs-theme={theme}>
      {/* Fixed Navbar */}
      <nav className="navbar navbar-expand-lg bg-white dark:bg-dark shadow fixed-top">
        <div className="container-fluid px-3 px-md-5">
          <button
            className="btn btn-outline-secondary me-3"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list fs-3"></i>
          </button>

          <a className="navbar-brand fw-bold fs-4 fs-md-3" href="#">
            Staff Portal
          </a>

          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="fw-medium d-inline">
              {user?.name || 'Staff'}
            </span>

            <button className="btn btn-outline-secondary rounded-circle p-2" onClick={toggleTheme}>
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
            </button>

            <button className="btn btn-outline-danger d-none d-md-block" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Layout */}
      <div className="d-flex flex-grow-1" style={{ paddingTop: '70px' }}>
        {/* Sidebar */}
        <aside
          className={`bg-white dark:bg-dark shadow transition-all duration-300 ${sidebarCollapsed ? 'collapsed' : ''}`}
          style={{
            width: sidebarCollapsed ? '80px' : '280px',
            minHeight: 'calc(100vh - 70px)',
            transition: 'width 0.3s ease',
            position: 'fixed',
            top: '70px',
            left: 0,
            zIndex: 1020,
            overflowY: 'auto',
          }}
        >
          <div className="p-4">
            <h5 className="mb-4 fw-bold" style={{ opacity: sidebarCollapsed ? 0 : 1, transition: 'opacity 0.3s ease' }}>
              Menu
            </h5>
            <ul className="nav flex-column nav-pills gap-2">
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                  <i className="bi bi-house-door me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Dashboard</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'timesheets' ? 'active' : ''}`} onClick={() => setActiveTab('timesheets')}>
                  <i className="bi bi-clock-history me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Timesheets</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'session-report' ? 'active' : ''}`} onClick={() => setActiveTab('session-report')}>
                  <i className="bi bi-file-text me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Session Report</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'unavailability' ? 'active' : ''}`} onClick={() => setActiveTab('unavailability')}>
                  <i className="bi bi-calendar-x me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Unavailability</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'capture-assessments' ? 'active' : ''}`} onClick={() => setActiveTab('capture-assessments')}>
                  <i className="bi bi-journal-check me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Capture Assessments</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'view-results' ? 'active' : ''}`} onClick={() => setActiveTab('view-results')}>
                  <i className="bi bi-graph-up me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>View Results</span>
                </button>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <button className={`nav-link w-100 text-start ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                    <i className="bi bi-calendar-check me-2"></i>
                    <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Attendance</span>
                  </button>
                </li>
              )}
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                  <i className="bi bi-bell me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Notifications</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'send-message' ? 'active' : ''}`} onClick={() => setActiveTab('send-message')}>
                  <i className="bi bi-envelope me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Send Message</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'class-list' ? 'active' : ''}`} onClick={() => setActiveTab('class-list')}>
                  <i className="bi bi-people me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Class List</span>
                </button>
              </li>
              <li className="nav-item mt-5">
                <button className="nav-link w-100 text-start text-danger" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-grow-1 overflow-auto bg-body w-100"
          style={{
            marginLeft: sidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease',
            paddingBottom: '80px',
          }}
        >
          <div className="w-100 h-100 px-3 px-lg-4 py-4">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'timesheets' && <Timesheets />}
            {activeTab === 'session-report' && <SessionReport />}
            {activeTab === 'unavailability' && <Unavailability />}
            {activeTab === 'capture-assessments' && <CaptureAssessments />}
            {activeTab === 'view-results' && <ViewResults />}
            {activeTab === 'attendance' && isAdmin && <Attendance />}
            {activeTab === 'notifications' && <Notifications />}
            {activeTab === 'send-message' && <SendMessage />}
            {activeTab === 'class-list' && <ClassList />}
          </div>
        </main>
      </div>

      <Footer sidebarIsClosed={sidebarCollapsed} />
    </div>
  );
}

export default StaffPortal;