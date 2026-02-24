// src/pages/learner_comp/Warnings.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Warnings = () => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // ← Added for success message
  const [openId, setOpenId] = useState(null);   // tracks which warning is expanded

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/warnings');
        setWarnings(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load warnings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDropdown = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const handleAcknowledge = async (id) => {
    try {
      const response = await api.post(`/api/learner/warnings/${id}/acknowledge`);

      if (response.data?.success) {
        setWarnings(prev => prev.filter(w => w.id !== id));
        setOpenId(null);

        // Show success alert
        setSuccess("Warning acknowledged successfully");

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 8000);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Acknowledge error:", err);
      setError(
        err.response?.data?.detail ||
        "Failed to acknowledge warning. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold">Warnings & Notices</h2>

      {/* Success alert - placed right after error */}
      {success && (
        <div 
          className="alert alert-success alert-dismissible fade show mt-3 mb-4 rounded-3 shadow-sm text-center" 
          role="alert"
          style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            color: '#155724',
            border: '1px solid #badbcc',
            fontWeight: 500,
            fontSize: '1.1rem'
          }}
        >
          <i className="bi bi-check-circle-fill me-2 fs-4"></i>
          {success}
          <button
            type="button"
            className="btn-close ms-2"
            onClick={() => setSuccess(null)}
            aria-label="Close"
            style={{ filter: 'invert(0.5)' }}
          ></button>
        </div>
      )}

      {warnings.length > 0 ? (
        <div className="list-group shadow-sm rounded">
          {warnings.map((w) => (
            <div key={w.id} className="mb-3"> {/* ← Space between cards */}
              <div
                className={`card border-0 shadow-sm cursor-pointer ${
                  w.type === 'Red' ? 'border-danger border-start border-5' :
                  w.type === 'Yellow' ? 'border-warning border-start border-5' : ''
                }`}
                onClick={() => toggleDropdown(w.id)}
                role="button"
                tabIndex={0}
              >
                <div className="card-body py-3 px-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-semibold">
                      {w.type} Card
                      {w.severity === 'high' && <span className="badge bg-danger ms-2">High</span>}
                      {w.severity === 'medium' && <span className="badge bg-warning ms-2">Medium</span>}
                    </h5>

                    <small className="text-muted">
                      Date :{" "}
                      {new Date(w.date).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).replace(",", " at")}
                    </small>

                  </div>
                </div>
              </div>

              {/* Dropdown content - only visible when open */}
              {openId === w.id && (
                <div className="card border-0 shadow-sm bg-light mt-1">
                  <div className="card-body px-4 py-3">
                    <p className="mb-3 text-dark">{w.reason}</p>
                    <button
                      className="btn btn-success btn-sm px-4"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent card click
                        handleAcknowledge(w.id);
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-success text-center py-5">
          No active warnings at this time
        </div>
      )}
    </div>
  );
};

export default Warnings;