// src/pages/ParentPortal.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Dashboard from './parent_comp/Dashboard';           // ← copy from learner, adjust if needed
import Assessments from './parent_comp/Assessments';     // ← copy from learner (view-only)
import Attendance from './parent_comp/Attendance';       // ← copy from learner (view-only)
import Notifications from './parent_comp/Notifications'; // ← copy from learner (view-only, no mark as read)
import Warnings from './parent_comp/Warnings';           // ← copy from learner (view-only, no acknowledge)
import SendApology from './parent_comp/SendApology';     // ← new component for apologies
import Footer from './learner_comp/Footer';              
import './learner_comp/learner.css';                    

function ParentPortal() {
  const { user, logout, toggleTheme, theme } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // false = open
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body">
        <div className="spinner-border text-primary" role="status" style={{ width: '5rem', height: '5rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body">
        <div className="alert alert-danger text-center p-5 rounded-4 shadow">
          {error || 'Session expired. Please login again.'}
          <div className="mt-4">
            <a href="/login" className="btn btn-primary btn-lg">Go to Login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100" data-bs-theme={theme}>
      {/* Fixed Navbar */}
      <nav className="navbar navbar-expand-lg bg-white dark:bg-dark shadow fixed-top">
        <div className="container-fluid px-3 px-md-5">
          {/* Hamburger always visible */}
          <button
            className="btn btn-outline-secondary me-3"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list fs-3"></i>
          </button>

          <a className="navbar-brand fw-bold fs-4 fs-md-3" href="#">
            Parent Portal
          </a>

          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-medium d-inline">
                {user?.name || 'Parent'} {/* Shows parent's name */}
              </span>
            </div>

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
        {/* Collapsible Sidebar */}
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
                <button className={`nav-link w-100 text-start ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')}>
                  <i className="bi bi-journal-check me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Child's Assessments</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                  <i className="bi bi-calendar-check me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Child's Attendance</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                  <i className="bi bi-bell me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Child's Notifications</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'warnings' ? 'active' : ''}`} onClick={() => setActiveTab('warnings')}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Child's Warnings</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link w-100 text-start ${activeTab === 'apology' ? 'active' : ''}`} onClick={() => setActiveTab('apology')}>
                  <i className="bi bi-envelope-paper me-2"></i>
                  <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>Send Apology</span>
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

        {/* Main Content (scrollable only) */}
        <main
          className="flex-grow-1 overflow-auto bg-body w-100"
          style={{
            marginLeft: sidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease',
            paddingBottom: '80px', // footer space
          }}
        >
          {/* GLOBAL CONTENT WRAPPER */}
          <div className="w-100 h-100 px-3 px-lg-4 py-4">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'assessments' && <Assessments />}
            {activeTab === 'attendance' && <Attendance />}
            {activeTab === 'notifications' && <Notifications />}
            {activeTab === 'warnings' && <Warnings />}
            {activeTab === 'apology' && <SendApology />}
          </div>
        </main>
      </div>

      {/* Fixed Full-Width Footer */}
      <Footer sidebarIsClosed={sidebarCollapsed} />
    </div>
  );
}

export default ParentPortal;