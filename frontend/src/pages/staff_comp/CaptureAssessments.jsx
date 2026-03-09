// src/pages/staff_comp/CaptureAssessments.jsx
import { useState } from 'react';

const CaptureAssessments = () => {
  const [form, setForm] = useState({
    name: '',
    subject: '',
    date_written: '',
    grade: '',
    marks: {} // {learnerId: percentage}
  });

  const [success, setSuccess] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/staff/assessments
    setSuccess('Assessment results captured (placeholder)');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Capture Assessment Results</h2>

      {success && <div className="alert alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Assessment Name</label>
            <input type="text" className="form-control" placeholder="e.g. Test 1 - Algebra" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Subject</label>
            <select className="form-select" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required>
              <option value="">Select...</option>
              <option>Mathematics</option>
              <option>Physical Sciences</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Date Written</label>
            <input type="date" className="form-control" value={form.date_written} onChange={e => setForm({...form, date_written: e.target.value})} required />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Grade</label>
            <select className="form-select" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} required>
              <option value="">Select...</option>
              <option>10</option>
              <option>11</option>
              <option>12</option>
            </select>
          </div>

          {/* Placeholder for learner marks input */}
          <div className="col-12 mt-4">
            <h5>Learner Marks (placeholder)</h5>
            <div className="alert alert-info">Learner list & marks input will appear here after selecting grade</div>
          </div>

          <div className="col-12 text-center mt-4">
            <button type="submit" className="btn btn-primary btn-lg px-5">Save Assessment</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CaptureAssessments;