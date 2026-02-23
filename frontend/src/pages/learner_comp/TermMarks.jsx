// src/pages/learner_comp/TermMarks.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const TermMarks = () => {
  const [termMarks, setTermMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming you have an API for term marks
        // Replace with your real endpoint when ready
        const mockData = [
          { term: 'Term 1 2025', subject: 'Mathematics', mark: 78, comment: 'Good progress' },
          { term: 'Term 1 2025', subject: 'English', mark: 65, comment: 'Needs improvement' },
          { term: 'Term 2 2025', subject: 'Physical Sciences', mark: 92, comment: 'Excellent' },
        ];
        setTermMarks(mockData);
        // Real fetch example:
        // const res = await api.get('/api/learner/term-marks');
        // setTermMarks(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load term marks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <h2 className="mb-4 fw-bold">Term Marks</h2>

      {termMarks.length > 0 ? (
        <div className="card shadow border-0 rounded-4 overflow-hidden">
          <div className="card-body p-4 p-md-5">
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>Term</th>
                    <th>Subject</th>
                    <th>Mark</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {termMarks.map((item, i) => (
                    <tr key={i}>
                      <td>{item.term}</td>
                      <td>{item.subject}</td>
                      <td>{item.mark}%</td>
                      <td>{item.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info text-center py-5">
          No term marks available yet
        </div>
      )}
    </div>
  );
};

export default TermMarks;