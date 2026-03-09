// src/pages/staff_comp/ClassList.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const ClassList = () => {
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [learners, setLearners] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState(null); // only store ID
  const [learnerData, setLearnerData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate months from Feb to current (current year)
  const getAvailableMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const months = [];

    for (let m = 2; m <= currentMonth; m++) {
      months.push({
        value: m,
        label: new Date(currentYear, m - 1).toLocaleString('default', { month: 'long' })
      });
    }

    return months;
  };

  const availableMonths = getAvailableMonths();

  // Fetch assigned grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await api.get('/api/staff/profile');
        const profile = res.data;

        const gradeList = profile.grades?.toLowerCase().includes('all')
          ? ['10', '11', '12']
          : profile.grades?.split(',').map(g => g.trim()) || [];

        setGrades(gradeList);
      } catch (err) {
        setError('Failed to load assigned grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // Fetch learners for selected grade
  useEffect(() => {
    if (!selectedGrade) {
      setLearners([]);
      return;
    }

    const fetchLearners = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get('/api/staff/learners', { params: { grade: selectedGrade } });
        setLearners(res.data || []);
      } catch (err) {
        setError('Failed to load learners for this grade');
      } finally {
        setLoading(false);
      }
    };

    fetchLearners();
  }, [selectedGrade]);

  // Fetch full learner data when row clicked
  useEffect(() => {
    if (!selectedLearnerId) {
      setLearnerData(null);
      setSelectedMonth('');
      return;
    }

    const fetchLearnerData = async () => {
      setModalLoading(true);
      setError(null);

      try {
        const res = await api.get(`/api/staff/learners/${selectedLearnerId}`);
        setLearnerData(res.data);

        // Auto-select current month
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1);
      } catch (err) {
        setError('Failed to load learner details');
      } finally {
        setModalLoading(false);
      }
    };

    fetchLearnerData();
  }, [selectedLearnerId]);

  // Filter attendance & assessments by selected month
  const filteredAttendance = learnerData?.attendance?.filter(a => {
    if (!selectedMonth) return true;
    const date = new Date(a.class_date);
    return date.getMonth() + 1 === parseInt(selectedMonth);
  }) || [];

  const filteredAssessments = learnerData?.assessments?.filter(assess => {
    if (!selectedMonth) return true;
    const date = new Date(assess.date_written);
    return date.getMonth() + 1 === parseInt(selectedMonth);
  }) || [];

  const groupedAssessments = filteredAssessments.reduce((acc, assess) => {
    const subj = assess.subject;
    if (!acc[subj]) acc[subj] = [];
    acc[subj].push(assess);
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
        <i className="bi bi-people me-2"></i>
        Class List
      </h2>

      <div className="card shadow-lg border-0 rounded-4 overflow-hidden mb-5">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">Select Grade</h4>
        </div>

        <div className="card-body p-5 bg-light">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <label className="form-label fw-bold text-primary">Grade</label>
              <select
                className="form-select form-select-lg border-primary shadow-sm"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="">Select a grade...</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      {selectedGrade && (
        <>
          <h4 className="mb-4 fw-bold text-primary">
            Learners in Grade {selectedGrade} ({learners.length} total)
          </h4>

          {learners.length === 0 ? (
            <div className="alert alert-info text-center py-4">
              No learners found in Grade {selectedGrade}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered shadow-sm">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>School</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((learner, index) => (
                    <tr
                      key={learner.id}
                      className="cursor-pointer hover-bg-light"
                      onClick={() => setSelectedLearnerId(learner.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{index + 1}</td>
                      <td>{learner.full_names}</td>
                      <td>{learner.school || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Learner Detail Modal */}
      {selectedLearnerId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {learnerData?.learner?.full_names || 'Loading...'} {learnerData?.learner?.surname || ''}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLearnerId(null)}></button>
              </div>

              <div className="modal-body p-4 p-md-5">
                {modalLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">{error}</div>
                ) : learnerData ? (
                  <>
                    {/* Basic Info */}
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-body">
                        <h5 className="fw-bold text-primary mb-3">Learner Information</h5>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <strong>Grade:</strong> {learnerData.learner.grade}
                          </div>
                          <div className="col-md-4">
                            <strong>School:</strong> {learnerData.learner.school || 'N/A'}
                          </div>
                          <div className="col-md-4">
                            <strong>ID:</strong> {learnerData.learner.id}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Month Selector */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-primary">Select Month</label>
                      <select
                        className="form-select form-select-lg border-primary shadow-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="">All Months (Feb - Current)</option>
                        {availableMonths.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Attendance */}
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-header bg-info text-white fw-bold">
                        Attendance ({selectedMonth ? availableMonths.find(m => m.value === parseInt(selectedMonth))?.label : 'All Months'})
                      </div>
                      <div className="card-body">
                        {filteredAttendance.length === 0 ? (
                          <div className="alert alert-info text-center mb-0">
                            No attendance records for this period.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-striped table-hover">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredAttendance.map((a, i) => (
                                  <tr key={i}>
                                    <td>{new Date(a.class_date).toLocaleDateString('en-GB')}</td>
                                    <td>
                                      <span className={`badge bg-${a.status === 'Attended' ? 'success' : a.status === 'Absent' ? 'danger' : 'secondary'}`}>
                                        {a.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assessments */}
                    <div className="card shadow-sm border-0">
                      <div className="card-header bg-success text-white fw-bold">
                        Assessments ({selectedMonth ? availableMonths.find(m => m.value === parseInt(selectedMonth))?.label : 'All Months'})
                      </div>
                      <div className="card-body">
                        {Object.keys(groupedAssessments).length === 0 ? (
                          <div className="alert alert-info text-center mb-0">
                            No assessment results for this period.
                          </div>
                        ) : (
                          Object.entries(groupedAssessments).map(([subj, assessList]) => {
                            const subjAvg = assessList.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessList.length;

                            return (
                              <div key={subj} className="mb-4">
                                <h6 className="fw-bold text-primary mb-2">
                                  {subj} - Monthly Avg: {subjAvg.toFixed(1)}%
                                </h6>
                                <div className="table-responsive">
                                  <table className="table table-sm table-bordered">
                                    <thead>
                                      <tr>
                                        <th>Assessment</th>
                                        <th>Date</th>
                                        <th>Percentage</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assessList.map((a, i) => (
                                        <tr key={i}>
                                          <td>{a.name}</td>
                                          <td>{new Date(a.date_written).toLocaleDateString('en-GB')}</td>
                                          <td>{a.percentage ? `${a.percentage}%` : '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary px-5" onClick={() => setSelectedLearnerId(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;