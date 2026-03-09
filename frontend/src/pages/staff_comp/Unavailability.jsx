// src/pages/staff_comp/Unavailability.jsx
import { useState } from 'react';

const Unavailability = () => {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/staff/unavailability
    setSuccess('Unavailability reported (placeholder)');
    setDate('');
    setReason('');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Report Unavailability</h2>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4">
        <div className="mb-4">
          <label className="form-label fw-bold">Date</label>
          <input type="date" className="form-control form-control-lg" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Reason</label>
          <textarea className="form-control" rows="4" placeholder="e.g. Medical appointment, family emergency..." value={reason} onChange={e => setReason(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100">Submit Request</button>
      </form>
    </div>
  );
};

export default Unavailability;