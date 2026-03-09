// src/pages/staff_comp/SendMessage.jsx
import { useState } from 'react';

const SendMessage = () => {
  const [grade, setGrade] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/staff/messages
    setSuccess('Message sent to class');
    setTitle('');
    setContent('');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Send Message to Class</h2>

      {success && <div className="alert alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4">
        <div className="mb-4">
          <label className="form-label fw-bold">Grade</label>
          <select className="form-select" value={grade} onChange={e => setGrade(e.target.value)} required>
            <option value="">Select grade...</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Title</label>
          <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Important Test Reminder" required />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Message</label>
          <textarea className="form-control" rows="5" value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message here..." required />
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100">Send to Class</button>
      </form>
    </div>
  );
};

export default SendMessage;