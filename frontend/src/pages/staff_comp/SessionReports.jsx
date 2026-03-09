// src/pages/staff_comp/SessionReports.jsx
import { useState } from 'react';

const SessionReports = () => {
  const [form, setForm] = useState({
    class_name: '',
    session_date: '',
    subject: '',
    topic: '',
    description: '',
    positives: '',
    negatives: '',
    comments: '',
  });

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/staff/session-report
    setSuccess('Session report submitted (placeholder)');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Submit Session Report</h2>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Class / Grade</label>
            <select name="class_name" className="form-select" value={form.class_name} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Subject</label>
            <select name="subject" className="form-select" value={form.subject} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physical Sciences">Physical Sciences</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Session Date</label>
            <input type="date" name="session_date" className="form-control" value={form.session_date} onChange={handleChange} required />
          </div>

          <div className="col-12">
            <label className="form-label fw-bold">Topic / Lesson Title</label>
            <input name="topic" className="form-control" placeholder="e.g. Quadratic Equations" value={form.topic} onChange={handleChange} required />
          </div>

          <div className="col-12">
            <label className="form-label fw-bold">Description</label>
            <textarea name="description" rows="3" className="form-control" placeholder="What happened during the session..." value={form.description} onChange={handleChange} required />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Positives / Successes</label>
            <textarea name="positives" rows="3" className="form-control" placeholder="What went well..." value={form.positives} onChange={handleChange} />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Challenges / Negatives</label>
            <textarea name="negatives" rows="3" className="form-control" placeholder="What needs improvement..." value={form.negatives} onChange={handleChange} />
          </div>

          <div className="col-12">
            <label className="form-label fw-bold">Additional Comments</label>
            <textarea name="comments" rows="2" className="form-control" placeholder="Any notes..." value={form.comments} onChange={handleChange} />
          </div>

          <div className="col-12 text-center mt-4">
            <button type="submit" className="btn btn-primary btn-lg px-5">Submit Report</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SessionReports;