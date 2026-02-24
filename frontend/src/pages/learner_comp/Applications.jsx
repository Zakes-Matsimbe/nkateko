// src/pages/learner_comp/Applications.jsx
import { useState, useEffect } from 'react';
import ManageApplicationModal from './small_jobs/ManageApplicationModal';
import api from '../../lib/api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/applications');
        setApplications(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load applications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ← NEW: Check if user can submit a new application
  const canSubmitNew = () => {
    if (applications.length === 0) return true;

    const now = new Date();
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(now.getMonth() - 5);

    // Check any application created or submitted in last 5 months
    return !applications.some(app => {
      const created = new Date(app.created_at);
      const submitted = app.date_submitted ? new Date(app.date_submitted) : null;

      return (
        created >= fiveMonthsAgo ||
        (submitted && submitted >= fiveMonthsAgo)
      );
    });
  };

  // Handle click with check
  const handleOpenModal = () => {
    if (!canSubmitNew()) {
        setShowBlockModal(true); // Show nice pop-up
      return;
    }

    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="py-4">
      <h2 className="mb-5 fw-bold text-center">My Applications </h2>

      {applications.length > 0 ? (
        <div className="list-group shadow-sm rounded mb-5">
          {applications.map((app, i) => (
            <div key={app.id || i} className="list-group-item list-group-item-action px-4 py-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0 fw-bold">
                  {app.app_id || `Application #${i + 1}`}
                </h5>
                <small className="text-muted">
                 Created Date : {app.created_at
                    ? new Date(app.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                    : 'N/A'}
                </small>
              </div>

              {/* Status & Grade */}
              <p className="mb-2">
                <strong>Date Submitted:</strong> {app.updated_at  ? new Date(app.updated_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }) : 'N/A'} 
                      
                      <br />
                <strong>Grade Applied For:</strong> {app.grade || 'N/A'} <br />
                <strong>Outcome Status:</strong>{' '}
                <span
                  className={`badge rounded-pill ms-2 ${
                    app.status === 'Accepted' ? 'bg-success' :
                    app.status === 'Rejected' ? 'bg-danger' :
                    app.status === 'Under Review' ? 'bg-warning' :
                    app.status === 'Draft' ? 'bg-secondary' :
                    'bg-info'
                  }`}
                >
                  {app.status || 'Pending'}
                </span>
              </p>

              <div className="mb-3">
                <strong>Notifications:</strong>
                {(() => {
                  let notes = app.notifications;
                  if (typeof notes === 'string') {
                    try {
                      notes = JSON.parse(notes);
                    } catch (e) {
                      notes = [];
                    }
                  }
                  return Array.isArray(notes) && notes.length > 0 ? (
                    <ul className="list-group list-group-flush mt-2 small">
                      {notes.map((note, idx) => (
                        <li
                          key={idx}
                          className={`list-group-item py-1 px-0 border-0 d-flex align-items-center text-dark`}
                        >
                          <i className="bi bi-info-circle-fill me-2 text-primary"></i>
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted ms-2">No notifications</span>
                  );
                })()}
              </div>

   
              <div className="mb-3">
                <strong>Application Results:</strong>
                {(() => {
                  let dataObj = app.data;
                  if (typeof dataObj === 'string') {
                    try {
                      dataObj = JSON.parse(dataObj);
                    } catch (e) {
                      dataObj = null;
                    }
                  }
                  const subjects = dataObj?.subjects || {};
                  return Object.keys(subjects).length > 0 ? (
                    <div className="table-responsive mt-3">
                      <table className="table table-sm table-bordered table-hover text-center">
                        <thead className="table-light">
                          <tr>
                            <th>Subject</th>
                            <th>Term 2</th>
                            <th>Term 4</th>
                            <th>Average</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(subjects).map(([subject, terms]) => {
                            const t2 = Number(terms.t2) || 0;
                            const t4 = Number(terms.t4) || 0;
                            const avg = ((t2 + t4) / 2).toFixed(1);
                            return (
                              <tr key={subject}>
                                <td className="fw-medium text-start">{subject}</td>
                                <td>{t2 || '-'}</td>
                                <td>{t4 || '-'}</td>
                                <td className="fw-bold">{avg !== '0.0' ? avg : '-'}</td>
                              </tr>
                            );
                          })}
                          {/* Totals */}
                          {(() => {
                            let totalT2 = 0, totalT4 = 0, count = 0;
                            Object.values(subjects).forEach(t => {
                              totalT2 += Number(t.t2) || 0;
                              totalT4 += Number(t.t4) || 0;
                              count++;
                            });
                            const max = count * 100;
                            const avgT2 = count ? ((totalT2 / max) * 100).toFixed(1) : '0';
                            const avgT4 = count ? ((totalT4 / max) * 100).toFixed(1) : '0';
                            return (
                              <>
                                <tr className="table-secondary fw-bold">
                                  <td>Total</td>
                                  <td>{totalT2} / {max}</td>
                                  <td>{totalT4} / {max}</td>
                                  <td>-</td>
                                </tr>
                                <tr className="table-success fw-bold">
                                  <td>Average %</td>
                                  <td>{avgT2}%</td>
                                  <td>{avgT4}%</td>
                                  <td>-</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-muted ms-2">No results uploaded yet</span>
                  );
                })()}
              </div>

              {/* Documents (optional) */}
              {app.data && app.data.documents && (
                <div className="small text-muted mt-2">
                  <strong>Documents:</strong> {app.data.documents.length} file(s) uploaded
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          No applications submitted yet
        </div>
      )}

          {/* Submit New Application Button */}
                <div className="text-center mt-5">
                  <button
                    className="btn btn-primary btn-lg px-5"
                    onClick={handleOpenModal}  // ← changed to new handler
                    disabled={loading}        // optional: disable while loading
                  >
                    {loading ? 'Loading...' : 'Submit New Application'}
                  </button>
                </div>


                {/* Nice Block Pop-up */}
                      <div
                        className={`modal fade ${showBlockModal ? 'show d-block' : ''}`}
                        tabIndex="-1"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setShowBlockModal(false)}
                      >
                        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                          <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header bg-warning text-dark">
                              <h5 className="modal-title fw-bold">Cannot Create New Application</h5>
                              <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowBlockModal(false)}
                              ></button>
                            </div>
                            <div className="modal-body text-center py-4">
                              <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
                              <p className="mt-3 fs-5 fw-medium">
                                You are not allowed to create another application for this cycle.
                              </p>
                              <p className="text-muted">
                                You can only apply once every 5 months.
                              </p>
                            </div>
                            <div className="modal-footer justify-content-center border-0 pb-4">
                              <button
                                type="button"
                                className="btn btn-warning btn-lg px-5"
                                onClick={() => setShowBlockModal(false)}
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                <ManageApplicationModal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  onSuccess={() => {
                    setShowModal(false);
                    // Refresh applications list after success
                    const fetchData = async () => {
                      try {
                        const res = await api.get('/api/learner/applications');
                        setApplications(res.data);
                      } catch (err) {
                        console.error(err);
                      }
                    };
                    fetchData();
                  }}
          />


    </div>
  );
};

export default Applications;