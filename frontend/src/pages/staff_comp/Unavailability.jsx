// src/pages/staff_comp/Unavailability.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Unavailability = () => {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [unavailList, setUnavailList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    fetchUnavailability();
  }, []);

  const fetchUnavailability = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/staff/unavailability');
      setUnavailList(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load previous requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!date || !reason.trim()) {
      setError('Please select a date and provide a reason');
      return;
    }

    setSubmitLoading(true);

    try {
      await api.post('/api/staff/unavailability', { date, reason: reason.trim() });

      setSuccess('Unavailability request submitted successfully!');
      setDate('');
      setReason('');
      fetchUnavailability(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Group by month (current year only)
  const groupedUnavail = unavailList.reduce((acc, item) => {
    const dateObj = new Date(item.unavailable_date);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthName]) acc[monthName] = [];
    acc[monthName].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="mb-5 fw-bold text-center text-primary">
        <i className="bi bi-calendar-x me-2"></i>
        Report Unavailability
      </h2>

      {/* Submission Form */}
      <div className="card shadow-lg border-0 rounded-4 mb-5 overflow-hidden">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-calendar-exclamation me-2"></i>
            New Unavailability Request
          </h4>
        </div>

        <div className="card-body p-5 bg-light">
          {success && (
            <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
            </div>
          )}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Date of Unavailability</label>
                <input
                  type="date"
                  className="form-control form-control-lg border-primary shadow-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  required
                />
                <small className="text-muted mt-1 d-block">
                  Select a future date only
                </small>
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-primary">Reason</label>
                <textarea
                  className="form-control form-control-lg border-primary shadow-sm"
                  rows="5"
                  placeholder="e.g. Medical appointment, family responsibility, religious observance, personal matter..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i>
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Previous Requests - Grouped by Month */}
      <h3 className="mb-4 fw-bold text-primary">
        <i className="bi bi-clock-history me-2"></i>
        Previous Unavailability Requests (Current Year)
      </h3>

      {unavailList.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          No previous unavailability requests this year.
        </div>
      ) : (
        Object.entries(groupedUnavail).map(([month, items]) => (
          <div key={month} className="card shadow border-0 rounded-4 mb-4">
            <div className="card-header bg-info text-white fw-bold py-3">
              {month}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>{new Date(item.unavailable_date).toLocaleDateString('en-GB')}</td>
                        <td>{item.reason}</td>
                        <td>{new Date(item.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Unavailability;