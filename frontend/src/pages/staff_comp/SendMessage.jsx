// src/pages/staff_comp/SendMessage.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const SendMessage = () => {
  const [grades, setGrades] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previousMessages, setPreviousMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/api/staff/profile');
        const profile = profileRes.data;

        const gradeList = profile.grades?.toLowerCase().includes('all')
          ? ['10', '11', '12']
          : profile.grades?.split(',').map(g => g.trim()) || [];

        setGrades(gradeList);

        // Fetch previous sent messages
        const messagesRes = await api.get('/api/staff/notifications');
        setPreviousMessages(messagesRes.data || []);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group previous messages by month
  const groupedMessages = previousMessages.reduce((acc, msg) => {
    const date = new Date(msg.created_at);
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(msg);
    return acc;
  }, {});

    const toggleGrade = (grade) => {
    setSelectedGrades(prev =>
      prev.includes(grade)
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Title and message are required');
      return;
    }

    setSubmitLoading(true);

    try {
      // 1. Save notification
      if (selectedGrades.length === 0) {
      setError("Select at least one grade");
      return;
              }

    const target = selectedGrades;

      const notifRes = await api.post('/api/staff/messages', {
        grades: target,
        title: title.trim(),
        content: content.trim()
      });

      // Refresh previous messages
      const messagesRes = await api.get('/api/staff/notifications');
      setPreviousMessages(messagesRes.data || []);

      setSuccess('Message sent and emails delivered successfully!');
      setTitle('');
      setContent('');
      setSelectedGrade('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message/email');
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
        <i className="bi bi-chat-square-text me-2"></i>
        Send Message to Learners
      </h2>

      {/* Send Form */}
      <div className="card shadow-lg border-0 rounded-4 mb-5 overflow-hidden">
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0 fw-bold">New Message</h4>
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

            <div className="col-md-12">
              <label className="form-label fw-bold text-primary">Send To Grades</label>

              <div className="d-flex gap-4 flex-wrap mt-2">
                {grades.map((g) => (
                  <div className="form-check" key={g}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`grade-${g}`}
                      checked={selectedGrades.includes(g)}
                      onChange={() => toggleGrade(g)}
                    />
                    <label className="form-check-label fw-bold" htmlFor={`grade-${g}`}>
                      Grade {g}
                    </label>
                  </div>
                ))}
              </div>

              <small className="text-muted d-block mt-2">
                Message will be sent to learners in selected grades
              </small>
            </div>

              <div className="col-md-12">
                <label className="form-label fw-bold text-primary">Title</label>
                <input
                  className="form-control form-control-lg border-primary shadow-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Important Test Reminder"
                  required
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold text-primary">Message</label>
                <textarea
                  className="form-control form-control-lg border-primary shadow-sm"
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your message here... (will be sent as notification + email)"
                  required
                />
              </div>

              <div className="col-12 text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5 py-3 fw-bold"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i>
                      Send Message & Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Previous Messages */}
      <h3 className="mb-4 fw-bold text-primary">
        <i className="bi bi-clock-history me-2"></i>
        Previous Messages Sent (Current Year)
      </h3>

      {previousMessages.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          No messages sent yet this year.
        </div>
      ) : (
        Object.entries(groupedMessages).map(([month, msgs]) => (
          <div key={month} className="card shadow border-0 rounded-4 mb-4">
            <div className="card-header bg-info text-white fw-bold py-3">
              {month}
            </div>
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Message Preview</th>
                      <th>To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {msgs.map((m, i) => (
                      <tr key={i}>
                        <td>{new Date(m.created_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                              })}</td>
                        <td>{m.title}</td>
                        <td>{m.content.substring(0, 80)}{m.content.length > 80 ? '...' : ''}</td>
                        <td>
                          {m.target_grades === 'all' ? 'All Grades' : `Grade ${m.target_grades}`}
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

export default SendMessage;