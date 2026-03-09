// src/pages/staff_comp/CaptureAssessments.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const CaptureAssessments = () => {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [learners, setLearners] = useState([]);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    date_written: '',
    grade: '',
    total_mark: '',
    raw_marks: {}, // { learner_id: raw_mark }
  });

  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Fetch profile (grades & subjects)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/staff/profile');
        const profile = res.data;

        const gradeList = profile.grades?.toLowerCase().includes('all')
          ? ['10', '11', '12']
          : profile.grades?.split(',').map(g => g.trim()) || [];
        const subjectList = profile.subjects?.toLowerCase().includes('all')
          ? ['Mathematics', 'Physical Sciences', 'Accounting', 'English']
          : profile.subjects?.split(',').map(s => s.trim()) || [];

        setGrades(gradeList);
        setSubjects(subjectList);
      } catch (err) {
        setError('Failed to load staff profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch learners when grade changes
  useEffect(() => {
    if (!form.grade) {
      setLearners([]);
      setForm(prev => ({ ...prev, raw_marks: {} }));
      setIsDuplicate(false);
      return;
    }

    const fetchLearners = async () => {
      try {
        const res = await api.get('/api/staff/learners', { params: { grade: form.grade } });
        setLearners(res.data || []);
        const newRawMarks = {};
        res.data.forEach(l => {
          newRawMarks[l.id] = '';
        });
        setForm(prev => ({ ...prev, raw_marks: newRawMarks }));
      } catch (err) {
        setError('Failed to load learners for this grade');
      }
    };

    fetchLearners();
  }, [form.grade]);

  // Auto-check duplicate when name, subject, grade are set
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!form.name.trim() || !form.subject || !form.grade) {
        setIsDuplicate(false);
        return;
      }

      try {
        const res = await api.get('/api/staff/assessments/check', {
          params: {
            name: form.name.trim(),
            grade: parseInt(form.grade),
            subject: form.subject.trim()
          }
        });
        setIsDuplicate(res.data.exists);
      } catch (err) {
        console.error('Duplicate check failed', err);
        setIsDuplicate(false);
      }
    };

    checkDuplicate();
  }, [form.name, form.subject, form.grade]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRawMarkChange = (learnerId, value) => {
    const raw = value === '' ? '' : Math.min(parseFloat(form.total_mark) || Infinity, Math.max(0, parseFloat(value) || 0));
    setForm(prev => ({
      ...prev,
      raw_marks: { ...prev.raw_marks, [learnerId]: raw }
    }));
  };

  const calculatePercentage = (learnerId) => {
    const raw = form.raw_marks[learnerId] || 0;
    const total = parseFloat(form.total_mark) || 1;
    return ((raw / total) * 100).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (isDuplicate) {
      setError('An assessment with this name already exists for this grade and subject');
      return;
    }

    const required = ['name', 'subject', 'date_written', 'grade', 'total_mark'];
    if (required.some(f => !form[f]?.trim())) {
      setError('Please fill all required fields');
      return;
    }

    const marksArray = Object.entries(form.raw_marks)
      .filter(([_, raw]) => raw !== '' && raw !== null)
      .map(([learner_id, raw_mark]) => ({
        learner_id: parseInt(learner_id),
        percentage: parseFloat(calculatePercentage(learner_id))
      }));

    if (marksArray.length === 0) {
      setError('At least one learner mark is required');
      return;
    }

    setSubmitLoading(true);

    try {
      await api.post('/api/staff/assessments', {
        name: form.name.trim(),
        subject: form.subject.trim(),
        date_written: form.date_written,
        grade: parseInt(form.grade),
        total_mark: parseInt(form.total_mark),
        marks: marksArray
      });

      setSuccess('Assessment results captured successfully!');
      // Reset form
      setForm({
        name: '',
        subject: '',
        date_written: '',
        grade: '',
        total_mark: '',
        raw_marks: {}
      });
      setLearners([]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save assessment');
    } finally {
      setSubmitLoading(false);
    }
  };

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
        <i className="bi bi-journal-check me-2"></i>
        Capture Assessment Results
      </h2>

      <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">New Assessment</h4>
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

          {isDuplicate && form.name && form.subject && form.grade && (
            <div className="alert alert-warning mb-4">
              Warning: An assessment named <strong>"{form.name}"</strong> already exists for Grade {form.grade} - {form.subject}.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Assessment Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-lg border-primary shadow-sm"
                  placeholder="e.g. Test 1 - Algebra, Midterm Exam"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
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
                <label className="form-label fw-bold text-primary">Grade</label>
                <select
                  name="grade"
                  className="form-select form-select-lg border-primary shadow-sm"
                  value={form.grade}
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
                <label className="form-label fw-bold text-primary">Date Written</label>
                <input
                  type="date"
                  name="date_written"
                  className="form-control form-control-lg border-primary shadow-sm"
                  value={form.date_written}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-primary">Total Mark (out of)</label>
                <input
                  type="number"
                  name="total_mark"
                  className="form-control form-control-lg border-primary shadow-sm"
                  placeholder="e.g. 50, 100"
                  value={form.total_mark}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              {/* Learner Marks Table */}
              {learners.length > 0 && (
                <div className="col-12 mt-5">
                  <h5 className="fw-bold text-primary mb-3">
                    Learner Marks ({learners.length} learners)
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover table-bordered">
                      <thead className="table-primary">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>School</th>
                          <th>Raw Mark</th>
                          <th>Percentage (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learners.map((learner, index) => (
                          <tr key={learner.id}>
                            <td>{index + 1}</td>
                            <td className="align-middle">{learner.full_names}</td>
                            <td className="align-middle">{learner.school}</td>
                            <td style={{ width: '150px' }}>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="e.g. 45"
                                value={form.raw_marks[learner.id] ?? ''}
                                onChange={(e) => handleRawMarkChange(learner.id, e.target.value)}
                                min="0"
                                max={form.total_mark || Infinity}
                                step="0.5"
                              />
                            </td>
                            <td className="align-middle fw-bold text-success">
                              {calculatePercentage(learner.id)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {learners.length === 0 && form.grade && (
                <div className="col-12 mt-4">
                  <div className="alert alert-info text-center">
                    No learners found in Grade {form.grade}
                  </div>
                </div>
              )}

              <div className="col-12 text-center mt-5">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                  disabled={submitLoading || learners.length === 0 || isDuplicate}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      Submit Assessment Results
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaptureAssessments;