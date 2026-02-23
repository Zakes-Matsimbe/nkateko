// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../lib/api';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [detectedRole, setDetectedRole] = useState('Unknown');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleIdentifierChange = (e) => {
    const value = e.target.value.toUpperCase();
    setIdentifier(value);

    if (value.startsWith('ADM')) setDetectedRole('Admin');
    else if (value.startsWith('BET')) setDetectedRole('Staff');
    else if (value.startsWith('BOK')) setDetectedRole('Learner');
    else if (value.startsWith('OTH')) setDetectedRole('Other');
    else setDetectedRole('Unknown');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let roleFromPrefix = 'Guest';
    if (identifier.startsWith('ADM')) roleFromPrefix = 'Admin';
    else if (identifier.startsWith('BET')) roleFromPrefix = 'Staff';
    else if (identifier.startsWith('BOK')) roleFromPrefix = 'Learner';
    else if (identifier.startsWith('OTH')) roleFromPrefix = 'Other';

    console.log("Sending:", { identifier, password, detected_role: roleFromPrefix });

    try {
      const response = await api.post('/api/login', {
        identifier,
        password,
        detected_role: roleFromPrefix,
      });

      console.log("Success response:", response.data);

      const { user, token } = response.data;

      // Store user & token
      login({ ...user, token });
      localStorage.setItem('nkatekoUser', JSON.stringify(user));
      localStorage.setItem('nkatekoToken', token);

      // Redirect based on role - no intermediate /
      if (user.role === 'Learner') {
        navigate('/learner', { replace: true });
      } else if (user.role === 'Staff') {
        navigate('/staff', { replace: true });
      } else if (user.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        setError('Unknown role returned from server');
      }
    } catch (err) {
      console.log("Login error:", err.response?.data, err.response?.status);
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your reference number and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container-fluid px-3 px-md-5">
        <div className="row justify-content-center">
          <div className="col-12" style={{ maxWidth: '1100px' }}>
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              
              {/* Header */}
              <div className="card-header bg-primary text-white text-center py-5">
                <h2 className="mb-1">Login to Nkateko</h2>
                <small className="d-block opacity-75">Secure access to your portal</small>
                <small>Enter your Bokamoso reference number and password</small>
              </div>

              {/* Body */}
              <div className="card-body p-5">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError('')}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Reference */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Reference Number</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={identifier}
                      onChange={handleIdentifierChange}
                      placeholder="ADM12345, BET0001, BOK9999"
                      required
                    />
                    <div className="form-text mt-2">
                      Detected role:{' '}
                      <strong
                        className={
                          detectedRole === 'Unknown'
                            ? 'text-danger'
                            : 'text-success'
                        }
                      >
                        {detectedRole}
                      </strong>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Password</label>
                    <div className="input-group input-group-lg">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 py-3"
                    disabled={loading || detectedRole === 'Unknown' || !identifier}
                  >
                    {loading ? 'Signing In…' : 'Sign In'}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <a href="#" className="text-muted">
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;