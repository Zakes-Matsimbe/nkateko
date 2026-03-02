// src/pages/parent_comp/SendApology.jsx
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const SendApology = () => {
  const { user } = useAuthStore();
  const childName = user?.childName || 'your child';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    type: 'success', // success | error
    message: '',
  });

  const dateRef = useRef(null);

  /* ================= DATE LIMITS ================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 6);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  /* =============================================== */

  useEffect(() => {
    checkCutoff();
    fetchHistory();
  }, []);

  const checkCutoff = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat
    const hour = now.getHours();
    const minute = now.getMinutes();

    const isClosed =
      day === 0 ||
      day === 6 ||
      (day === 5 && (hour > 23 || (hour === 23 && minute >= 59)));

    setIsOpen(!isClosed);
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/parent/apologies');
      setHistory(res.data || []);
    } catch {
      showModal('error', 'Failed to load apology history.');
    }
  };

  /* ========= WEEK CHECK (ISO WEEK) ========= */
  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    const temp = new Date(d);
    temp.setHours(0, 0, 0, 0);
    temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
    const week1 = new Date(temp.getFullYear(), 0, 4);
    return (
      temp.getFullYear() +
      '-W' +
      Math.ceil(((temp - week1) / 86400000 + 1) / 7)
    );
  };

  const alreadySubmittedThisWeek = () => {
    const selectedWeek = getWeekKey(absenceDate);
    return history.some(
      (h) => getWeekKey(h.absence_date) === selectedWeek
    );
  };
  /* ========================================= */

  const showModal = (type, message) => {
    setModal({ show: true, type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOpen) {
      showModal('error', 'Apologies are currently closed.');
      return;
    }

    if (!title.trim() || !message.trim() || !absenceDate) {
      showModal('error', 'All fields are required.');
      return;
    }

    if (alreadySubmittedThisWeek()) {
      showModal(
        'error',
        'You have already submitted an apology for this week. Only one apology per week is allowed.'
      );
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/parent/apologies', {
        title: title.trim(),
        message: message.trim(),
        absence_date: absenceDate,
      });

      showModal('success', 'Apology submitted successfully.');

      setTitle('');
      setMessage('');
      setAbsenceDate('');
      fetchHistory();
    } catch {
      showModal('error', 'Failed to submit apology. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">

          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="fw-bold text-primary mb-2">
              Send Apology for : {childName}
            </h2>
            <p className="text-muted fs-5">
              Apologies can only be submitted Monday 00:01 – Friday 23:59
            </p>
          </div>

          {!isOpen && (
            <div className="alert alert-warning text-center shadow-sm mb-4">
              Apologies are currently <strong>closed</strong>
            </div>
          )}

          {/* ================= FORM CARD ================= */}
          <div className="card border-0 shadow-lg rounded-4 mb-5">
            <div className="card-header bg-primary text-white text-center py-4">
              <h4 className="fw-bold mb-0">
                <i className="bi bi-envelope-paper-heart me-2"></i>
                New Apology
              </h4>
            </div>

            <div className="card-body p-5 bg-light">
              <form onSubmit={handleSubmit}>

                {/* Title */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-primary">Title</label>
                  <input
                    type="text"
                    className="form-control form-control-lg border-primary shadow-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isOpen || loading}
                    required
                  />
                </div>

                {/* Absence Date */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-primary">
                    Date of Absence (Tomorrow → Next Week)
                  </label>

                  <div
                    className="input-group input-group-lg"
                    onClick={() => {
                      dateRef.current?.focus();
                      dateRef.current?.showPicker?.();
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      ref={dateRef}
                      type="date"
                      className="form-control form-control-lg border-primary shadow-sm"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      min={tomorrowStr}
                      max={nextWeekStr}
                      disabled={!isOpen || loading}
                      required
                    />
                    <span className="input-group-text bg-white border-primary">
                      <i className="bi bi-calendar-event text-primary fs-4"></i>
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-primary">
                    Message / Reason
                  </label>
                  <textarea
                    className="form-control form-control-lg border-primary shadow-sm"
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!isOpen || loading}
                    required
                  />
                </div>

                {/* Submit */}
                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                    disabled={!isOpen || loading}
                  >
                    {loading ? 'Submitting…' : 'Submit Apology'}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* ================= HISTORY CARD ================= */}
          <div className="card border-0 shadow-lg rounded-4">
            <div className="card-header bg-primary text-white text-center py-4">
              <h4 className="fw-bold mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Apology History
              </h4>
            </div>

            <div className="card-body bg-light p-4">
              {history.length ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped table-hover">
                    <thead className="table-primary">
                      <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Absence Date</th>
                        <th>Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((a) => (
                        <tr key={a.id}>
                          <td>{a.title}</td>
                          <td>{a.message}</td>
                          <td>
                            {new Date(a.absence_date).toLocaleDateString('en-GB', { day : 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td>
                            {new Date(a.created_at).toLocaleString('en-GB', { day : 'numeric', month: 'long', year: 'numeric', hour:'2-digit', minute: '2-digit'})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info text-center mb-0">
                  No apologies submitted yet
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL ================= */}
            {modal.show && (
            <>
                <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                >
                <div
                    className="modal-dialog modal-dialog-centered"
                    role="document"
                >
                    <div className="modal-content rounded-4 shadow">
                    <div
                        className={`modal-header ${
                        modal.type === 'success' ? 'bg-success' : 'bg-danger'
                        } text-white`}
                    >
                        <h5 className="modal-title">
                        {modal.type === 'success' ? 'Success' : 'Error'}
                        </h5>

                        <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close"
                        onClick={() => setModal({ ...modal, show: false })}
                        />
                    </div>

                    <div className="modal-body fs-5">
                        {modal.message}
                    </div>

                    <div className="modal-footer">
                        <button
                        className="btn btn-primary px-4"
                        onClick={() => setModal({ ...modal, show: false })}
                        >
                        OK
                        </button>
                    </div>
                    </div>
                </div>
                </div>

                {/* Backdrop */}
                <div className="modal-backdrop fade show"></div>
            </>
            )}

    </div>
  );
};

export default SendApology;