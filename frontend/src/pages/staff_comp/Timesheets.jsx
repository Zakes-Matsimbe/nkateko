// src/pages/staff_comp/Timesheets.jsx
import { useState, useEffect } from 'react';

const Timesheets = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('all');
  const [logs, setLogs] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch from /api/staff/timesheets?year=...&month=...
    setLoading(false);
    // Placeholder data
    setLogs([
      { date: '2026-03-01', time_in: '08:00', time_out: '15:30', hours: 7.5, status: 'Present' },
      { date: '2026-03-02', time_in: '07:45', time_out: '14:00', hours: 6.25, status: 'Present' },
    ]);
    setTotalHours(13.75);
  }, [year, month]);

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Timesheets</h2>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Year</label>
          <select className="form-select" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            <option>{year - 1}</option>
            <option>{year}</option>
            <option>{year + 1}</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Month</label>
          <select className="form-select" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-outline-primary w-100">Refresh</button>
        </div>
      </div>

      {/* Summary */}
      <div className="alert alert-info mb-4">
        <strong>Total Hours:</strong> {totalHours} • Estimated Pay: R{totalHours * 250} (R250/hr placeholder)
      </div>

      {/* Table */}
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
            {logs.length ? (
              logs.map((log, i) => (
                <tr key={i}>
                  <td>{log.date}</td>
                  <td>{log.time_in || '-'}</td>
                  <td>{log.time_out || '-'}</td>
                  <td className="fw-bold">{log.hours?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`badge bg-${log.status === 'Present' ? 'success' : 'danger'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">No timesheet records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timesheets;