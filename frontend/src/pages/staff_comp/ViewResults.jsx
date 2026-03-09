// src/pages/staff_comp/ViewResults.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const ViewResults = () => {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [month, setMonth] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // ← new: track if user clicked "Load"

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
      }
    };

    fetchProfile();
  }, []);

  const handleSearch = async () => {
    if (!grade || !subject || !month) {
      setError('Please select grade, subject, and month');
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await api.get('/api/staff/assessments/results', {
        params: { grade: parseInt(grade), month: parseInt(month), subject }
      });

      const sorted = (res.data || []).sort((a, b) => b.monthly_average - a.monthly_average);
      setResults(sorted);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      <h2 className="mb-5 fw-bold text-center text-primary">
        <i className="bi bi-graph-up me-2"></i>
        View Assessment Results
      </h2>

      <div className="card shadow-lg border-0 rounded-4 overflow-hidden mb-5">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">Filter Results</h4>
        </div>

        <div className="card-body p-5 bg-light">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          <div className="row g-4">
            <div className="col-md-4">
              <label className="form-label fw-bold text-primary">Grade</label>
              <select
                className="form-select form-select-lg border-primary shadow-sm"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="">Select assigned grade...</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold text-primary">Subject</label>
              <select
                className="form-select form-select-lg border-primary shadow-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select assigned subject...</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold text-primary">Month</label>
              <select
                className="form-select form-select-lg border-primary shadow-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Select month...</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 text-center mt-4">
              <button
                className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                onClick={handleSearch}
                disabled={loading || !grade || !subject || !month}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Load Results
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="alert alert-warning text-center py-5 shadow rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
          <h5 className="mb-2">No Results Found</h5>
          <p className="mb-0">
            No assessments exist for Grade {grade} - {subject} in{' '}
            {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}.
          </p>
          <small className="text-muted">
            Try a different month, subject, or check if assessments have been captured.
          </small>
        </div>
      ) : results.length > 0 ? (
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-info text-white text-center py-3">
            <h5 className="mb-0 fw-bold">
              Results for Grade {grade} - {subject} (
              {new Date(0, month - 1).toLocaleString('default', { month: 'long' })})
            </h5>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-bordered mb-0">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Learner Name</th>
                    <th>School</th>
                    {/* Dynamic assessment columns */}
                    {results[0]?.assessments?.map((assess, i) => (
                      <th key={i}>
                        {assess.name}<br />
                        <small>({assess.average}%)</small>
                      </th>
                    ))}
                    <th>Monthly Avg (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((learner, index) => {
                    const rowClass =
                      learner.monthly_average >= 80 ? 'table-success' :
                      learner.monthly_average >= 70 ? 'table-warning' :
                      learner.monthly_average >= 60 ? 'table-info' :
                      learner.monthly_average >= 35 ? 'table-secondary' :
                      'table-danger';

                    return (
                      <tr key={learner.id} className={rowClass}>
                        <td>{index + 1}</td>
                        <td>{learner.full_names}</td>
                        <td>{learner.school || 'N/A'}</td>
                        {learner.assessments.map((assess, i) => (
                          <td key={i}>{assess.percentage ? `${assess.percentage}%` : '-'}</td>
                        ))}
                        <td className="fw-bold">{learner.monthly_average}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          Select grade, subject, and month, then click "Load Results"
        </div>
      )}
    </div>
  );
};

export default ViewResults;