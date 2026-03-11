// src/pages/staff_comp/CaptureAttendance.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const CaptureAttendance = () => {
  const today = new Date().toISOString().split('T')[0]; // Moved to top

  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [learners, setLearners] = useState([]);
  const [attendance, setAttendance] = useState({}); // { learner_id: { status: '', apology: '' } }
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [learnerData, setLearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Tomorrow as max date (lock future)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = tomorrow.toISOString().split('T')[0];

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

  // Fetch learners when grade or date changes
  useEffect(() => {
    if (!selectedGrade || !selectedDate) {
      setLearners([]);
      setAttendance({});
      return;
    }

    const fetchLearners = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get('/api/staff/learners', { params: { grade: selectedGrade } });
        const learnerList = res.data || [];
        setLearners(learnerList);

        // Initialize attendance state
        const initialAttendance = {};
        learnerList.forEach(l => {
          initialAttendance[l.id] = { status: 'Absent', apology: '' };
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError('Failed to load learners');
      } finally {
        setLoading(false);
      }
    };

    fetchLearners();
  }, [selectedGrade, selectedDate]);

  // Fetch learner attendance history when row clicked
  useEffect(() => {
    if (!selectedLearnerId) {
      setLearnerData(null);
      return;
    }

    const fetchHistory = async () => {
      setModalLoading(true);
      setError(null);

      try {
        const res = await api.get(`/api/staff/learners/${selectedLearnerId}`);
        setLearnerData(res.data);
      } catch (err) {
        setError('Failed to load attendance history');
      } finally {
        setModalLoading(false);
      }
    };

    fetchHistory();
  }, [selectedLearnerId]);

  const handleStatusChange = (learnerId, status) => {
    setAttendance(prev => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        status,
        apology: status === 'Apology' ? prev[learnerId]?.apology || '' : ''
      }
    }));
  };

  const handleApologyChange = (learnerId, apology) => {
    setAttendance(prev => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        apology
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!selectedGrade || !selectedDate) {
      setError('Please select grade and date');
      return;
    }

    const attendanceData = Object.entries(attendance).map(([learner_id, data]) => ({
      learner_id: parseInt(learner_id),
      status: data.status,
      apology: data.status === 'Apology' ? data.apology.trim() : null
    }));

    setSubmitLoading(true);

    try {
      await api.post('/api/staff/attendance/capture', {
        grade: parseInt(selectedGrade),
        class_date: selectedDate,
        attendance: attendanceData
      });

      setSuccess(`Attendance saved successfully for ${new Date(selectedDate).toLocaleDateString('en-GB')}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Find selected learner for modal title (immediate feedback while fetching)
  const selectedLearner = learners.find(l => l.id === selectedLearnerId);
  const learnerAttendance = learnerData?.attendance || [];

  return (
    <div className="py-4">
      <h2 className="mb-5 fw-bold text-center text-primary">
        <i className="bi bi-calendar-check me-2"></i>
        Capture Attendance
      </h2>

      {/* Filters */}
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden mb-5">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">Select Grade & Date</h4>
        </div>

        <div className="card-body p-5 bg-light">
          <div className="row g-4 justify-content-center">
            <div className="col-md-5">
              <label className="form-label fw-bold text-primary">Grade</label>
              <select
                className="form-select form-select-lg border-primary shadow-sm"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="">Select assigned grade...</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-5">
              <label className="form-label fw-bold text-primary">Class Date</label>
              <input
                type="date"
                className="form-control form-control-lg border-primary shadow-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
                required
              />
              <small className="text-muted">Cannot select future dates</small>
            </div>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      {selectedGrade && selectedDate && (
        <form onSubmit={handleSubmit}>
          <h4 className="mb-4 fw-bold text-primary">
            Attendance for Grade {selectedGrade} for : {new Date(selectedDate).toLocaleDateString('en-GB', {
                                                                                      day: 'numeric',
                                                                                      month: 'long',
                                                                                      year: 'numeric'
                                                                                    })}
          </h4>

          {learners.length === 0 ? (
            <div className="alert alert-info text-center py-4">
              No learners found in Grade {selectedGrade}.
            </div>
          ) : (
            <div className="table-responsive mb-4">
              <table className="table table-hover table-bordered shadow-sm">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Apology Message</th>
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="form-select"
                          value={attendance[learner.id]?.status || 'Absent'}
                          onChange={(e) => handleStatusChange(learner.id, e.target.value)}
                        >
                          <option value="Attended">Attended</option>
                          <option value="Absent">Absent</option>
                          <option value="Apology">Apology</option>
                        </select>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {attendance[learner.id]?.status === 'Apology' ? (
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Reason for apology..."
                            value={attendance[learner.id]?.apology || ''}
                            onChange={(e) => handleApologyChange(learner.id, e.target.value)}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              className="btn btn-success btn-lg px-5 py-3 fw-bold"
              disabled={submitLoading || learners.length === 0}
            >
              {submitLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving Attendance...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  Save Attendance for : {new Date(selectedDate).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                          })}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Learner History Modal */}
      {selectedLearnerId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {selectedLearner?.full_names || 'Loading...'} Attendance History
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
                ) : learnerAttendance ? (
                  <>
                    {/* Basic Info */}
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-body">
                        <h5 className="fw-bold text-primary mb-3">Learner Details</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <strong>Name:</strong> {learnerData?.learner?.full_names || selectedLearner?.full_names || 'Loading...'}
                          </div>
                          <div className="col-md-6">
                            <strong>Grade:</strong> {learnerData?.learner?.grade || selectedGrade}
                          </div>
                          <div className="col-md-6">
                            <strong>School:</strong> {learnerData?.learner?.school || selectedLearner?.school || 'N/A'}
                          </div>
                          <div className="col-md-6">
                            <strong>ID:</strong> {selectedLearnerId}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance History */}
                    <div className="card shadow-sm border-0">
                      <div className="card-header bg-info text-white fw-bold">
                        Attendance History (Last {learnerAttendance.length} Records)
                      </div>
                      <div className="card-body">
                        {learnerAttendance.length === 0 ? (
                          <div className="alert alert-info text-center mb-0">
                            No attendance records found for this learner.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-striped table-hover">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Message</th>
                                </tr>
                              </thead>
                              <tbody>
                                {learnerAttendance.map((a, i) => (
                                  <tr key={i}>
                                    <td>{new Date(a.class_date).toLocaleDateString('en-GB', {
                                                                          day: 'numeric',
                                                                          month: 'long',
                                                                          year: 'numeric'
                                                                        })}</td>
                                    <td>
                                      <span className={`badge bg-${a.status === 'Attended' ? 'success' : a.status === 'Absent' ? 'danger' : 'warning'}`}>
                                        {a.status}
                                      </span>
                                    </td>
                                    <td>{a.apology_message}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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

export default CaptureAttendance;