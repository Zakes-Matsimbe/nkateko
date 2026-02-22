import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Website from './components/Website';
import Login from './pages/Login';
import LearnerPortal from './pages/LearnerPortal';
// Add more portals later: StaffPortal, AdminPortal

function App() {
  const { initAuth, user } = useAuthStore();

  // Run auth init once on app load
  useEffect(() => {
    initAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Website />} />
        <Route path="/login" element={<Login />} />

        {/* Protected - redirect to login if not authenticated */}
        <Route
          path="/learner"
          element={user ? <LearnerPortal /> : <Navigate to="/login" replace />}
        />

        {/* Add more later */}
        <Route path="/staff" element={user ? <div>Staff Portal (coming soon)</div> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={user ? <div>Admin Portal (coming soon)</div> : <Navigate to="/login" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;