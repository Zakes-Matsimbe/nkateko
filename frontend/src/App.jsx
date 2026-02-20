import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            {/* Header */}
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="mb-1">Nkateko Portal</h2>
              <p className="mb-0">Welcome back</p>
            </div>

            {/* Body */}
            <div className="card-body p-5 text-center">
              <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '6rem' }}></i>
              <h1 className="display-5 mt-4 mb-4 fw-bold">Choose Your Portal</h1>

              <p className="lead text-muted mb-5">
                Login to access your personalized dashboard
              </p>

              <div className="d-grid gap-4">
                <a href="#" className="btn btn-primary btn-lg">
                  <i className="bi bi-person-fill me-2"></i> Learner Portal
                </a>
                <a href="#" className="btn btn-outline-primary btn-lg">
                  <i className="bi bi-people-fill me-2"></i> Staff Portal
                </a>
                <a href="#" className="btn btn-outline-secondary btn-lg">
                  <i className="bi bi-person-gear me-2"></i> Admin Portal
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer bg-light text-center py-3">
              <small className="text-muted">
                © 2026 Bokamoso Educational Trust • Dedicated to Nkateko
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;