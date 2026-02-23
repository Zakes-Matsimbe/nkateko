// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Website from './components/Website';
import Login from './pages/Login';
import LearnerPortal from './pages/LearnerPortal';

function App() {
  const { initAuth, user } = useAuthStore();

  // Restore auth & theme on every app load / refresh
  useEffect(() => {
    initAuth();
  }, []);

  // Show loading while checking auth (prevents flash of login)
  if (user === undefined) {  // null = not logged in, undefined = checking
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Website />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/learner"
          element={user ? <LearnerPortal /> : <Navigate to="/login" replace />}
        />

        {/* Add staff & admin later */}
        <Route path="/staff" element={user ? <div>Staff Portal</div> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={user ? <div>Admin Portal</div> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;