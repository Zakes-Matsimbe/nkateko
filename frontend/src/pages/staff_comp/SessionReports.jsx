// src/pages/staff_comp/SessionReports.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';

const SessionReports = () => {
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    id: null, // for edit mode
    class_name: '',
    session_date: '',
    subject: '',
    topic: '',
    description: '',
    positives: '',
    negatives: '',
    comments: '',
  });

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch profile + reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Profile → grades & subjects
        const profileRes = await api.get('/api/staff/profile');
        const profile = profileRes.data;

        // Handle "all" or comma-separated values
        const gradeList = profile.grades?.toLowerCase().includes('all')
          ? ['10', '11', '12']
          : profile.grades?.split(',').map(g => g.trim()) || [];
        const subjectList = profile.subjects?.toLowerCase().includes('all')
          ? ['Mathematics', 'Physical Sciences', 'Accounting', 'English']
          : profile.subjects?.split(',').map(s => s.trim()) || [];

        setGrades(gradeList);
        setSubjects(subjectList);

        // Previous reports (current year)
        const currentYear = new Date().getFullYear();
        const reportsRes = await api.get('/api/staff/session-reports', {
          params: { year: currentYear }
        });
        setReports(reportsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const requiredFields = ['class_name', 'session_date', 'subject', 'topic', 'description'];
    if (requiredFields.some(field => !form[field]?.trim())) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitLoading(true);

    try {
      if (isEditMode && form.id) {
        // Update existing report
        await api.put(`/api/staff/session-reports/${form.id}`, form);
        setSuccess('Session report updated successfully!');
      } else {
        // Create new report
        await api.post('/api/staff/session-report', form);
        setSuccess('Session report submitted successfully!');
      }

      // Reset form
      setForm({
        id: null,
        class_name: '',
        session_date: '',
        subject: '',
        topic: '',
        description: '',
        positives: '',
        negatives: '',
        comments: '',
      });
      setIsEditMode(false);

      // Refresh reports
      const currentYear = new Date().getFullYear();
      const res = await api.get('/api/staff/session-reports', { params: { year: currentYear } });
      setReports(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save report');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (report) => {
    setForm({
      id: report.id,
      class_name: report.class_name,
      session_date: report.session_date,
      subject: report.subject,
      topic: report.topic,
      description: report.description,
      positives: report.positives || '',
      negatives: report.negatives || '',
      comments: report.comments || '',
    });
    setIsEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm({
      id: null,
      class_name: '',
      session_date: '',
      subject: '',
      topic: '',
      description: '',
      positives: '',
      negatives: '',
      comments: '',
    });
    setIsEditMode(false);
  };

  // Check if report is editable (within 6 days)
  const canEdit = (reportDate) => {
    const submitted = new Date(reportDate);
    const now = new Date();
    const diffDays = (now - submitted) / (1000 * 60 * 60 * 24);
    return diffDays <= 6;
  };

  // Group reports by month
  const groupedReports = reports.reduce((acc, report) => {
    const date = new Date(report.session_date);
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthName]) acc[monthName] = [];
    acc[monthName].push(report);
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
        <i className="bi bi-journal-text me-2"></i>
        Session Reports
      </h2>

      {/* Submit / Edit Form */}
      <div className="card shadow-lg border-0 rounded-4 mb-5 overflow-hidden">
        <div className={`card-header text-white text-center py-4 ${isEditMode ? 'bg-warning' : 'bg-primary'}`}>
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-journal-check me-2"></i>
            {isEditMode ? 'Edit Session Report' : 'Submit New Session Report'}
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
                <label className="form-label fw-bold text-primary">Class / Grade</label>
                <select
                  name="class_name"
                  className="form-select form-select-lg border-primary shadow-sm"
                  value={form.class_name}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select assigned grade...</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Subject</label>
                <select
                  name="subject"
                  className="form-select form-select-lg border-primary shadow-sm"
                  value={form.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select assigned subject...</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Session Date</label>
                <input
                  type="date"
                  name="session_date"
                  className="form-control form-control-lg border-primary shadow-sm"
                  value={form.session_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-primary">Topic / Lesson Title</label>
                <input
                  name="topic"
                  className="form-control form-control-lg border-primary shadow-sm"
                  placeholder="e.g. Quadratic Equations, Forces and Motion..."
                  value={form.topic}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-primary">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="form-control form-control-lg border-primary shadow-sm"
                  placeholder="Summarize the lesson, activities, learner engagement..."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-success">Positives / Successes</label>
                <textarea
                  name="positives"
                  rows="3"
                  className="form-control border-success shadow-sm"
                  placeholder="What went well? Strong participation, clear understanding..."
                  value={form.positives}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-danger">Challenges / Areas for Improvement</label>
                <textarea
                  name="negatives"
                  rows="3"
                  className="form-control border-danger shadow-sm"
                  placeholder="Learners struggled with..., time management issues..."
                  value={form.negatives}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-primary">Additional Comments / Notes</label>
                <textarea
                  name="comments"
                  rows="2"
                  className="form-control form-control-lg border-primary shadow-sm"
                  placeholder="Any follow-up actions, resources needed, etc."
                  value={form.comments}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 text-center mt-4">
                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {isEditMode ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : isEditMode ? (
                      'Update Report'
                    ) : (
                      <>
                        <i className="bi bi-journal-check me-2"></i>
                        Submit Report
                      </>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg px-5 py-3 fw-bold"
                      onClick={cancelEdit}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Previous Reports */}
      <h3 className="mb-4 fw-bold text-primary">
        <i className="bi bi-clock-history me-2"></i>
        Previous Reports ({new Date().getFullYear()})
      </h3>

      {reports.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          No session reports submitted this year yet.
        </div>
      ) : (
        Object.entries(groupedReports).map(([month, monthReports]) => (
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
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Topic</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthReports.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.session_date).toLocaleDateString('en-GB')}</td>
                        <td>{r.class_name}</td>
                        <td>{r.subject}</td>
                        <td>{r.topic}</td>
                        <td title={r.description}>
                          {r.description.substring(0, 80)}
                          {r.description.length > 80 ? '...' : ''}
                        </td>
                        <td>
                          {canEdit(r.session_date) ? (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => startEdit(r)}
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
                            </button>
                          ) : (
                            <span className="text-muted small">Locked</span>
                          )}
                        </td>
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

export default SessionReports;