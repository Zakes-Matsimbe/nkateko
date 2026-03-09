// src/pages/staff_comp/Timesheets.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';

const Timesheets = () => {
  const { user } = useAuthStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [logs, setLogs] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(250); // fallback
  const [estimatedPay, setEstimatedPay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimesheets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch profile once to get hourly_rate (only if not already set)
      if (hourlyRate === 250) {
        const profileRes = await api.get('/api/staff/profile');
        const rate = profileRes.data.hourly_rate || 41.67;
        setHourlyRate(rate);
      }

      // Fetch timesheets
      const params = { year };
      if (month !== 'all') params.month = month;

      const res = await api.get('/api/staff/timesheets', { params });
      const data = res.data;

      setLogs(data.logs || []);
      const hours = data.total_hours || 0;
      setTotalHours(hours.toFixed(1));
      setEstimatedPay((hours * hourlyRate).toFixed(2));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load timesheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [year, month]);


  const formatSeconds = (seconds) => {
  if (!seconds && seconds !== 0) return '-';

  const totalSeconds = parseInt(seconds, 10);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  // If you want seconds too: :${secs.toString().padStart(2, '0')}
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Timesheets</h2>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Year</label>
          <select
            className="form-select"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            <option>{year - 1}</option>
            <option>{year}</option>
            <option>{year + 1}</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Month</label>
          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 d-flex align-items-end">
          <button
            className="btn btn-outline-primary w-100"
            onClick={fetchTimesheets}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card shadow border-0 rounded-4 mb-5 bg-light">
        <div className="card-body p-4">
          <div className="row text-center">
            <div className="col-md-6 mb-3 mb-md-0">
              <h5 className="fw-bold text-muted">Total Hours This Period</h5>
              <div className="display-5 fw-bold text-primary">{totalHours}</div>
            </div>
            <div className="col-md-6">
              <h5 className="fw-bold text-muted">Estimated Pay</h5>
              <div className="display-5 fw-bold text-success">R{estimatedPay}</div>
              <small className="text-muted">(@ R{hourlyRate.toFixed(2)}/hr)</small>
            </div>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center py-4">{error}</div>
      ) : logs.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          No timesheet records found for this period.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td>{log.date}</td>
                  <td>{formatSeconds(log.time_in)}</td>          {/* ← converted */}
                  <td>{formatSeconds(log.time_out)}</td>         {/* ← converted */}
                  <td className="fw-bold">{(log.hours || 0).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        log.status === 'Present' ? 'success' :
                        log.status === 'Absent' ? 'danger' :
                        'secondary'
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.disputed ? (
                      <span className="badge bg-warning ms-2">Disputed</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Timesheets;