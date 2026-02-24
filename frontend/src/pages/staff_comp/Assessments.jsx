// src/pages/learner_comp/Assessments.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Assessments = () => {
  const [rawAssessments, setRawAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/assessments');
        setRawAssessments(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load assessments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group by month + subject for summary
  const groupedAssessments = rawAssessments.reduce((acc, item) => {
    const month = new Date(item.date_written).toLocaleString('default', { month: 'long', year: 'numeric' });
    const subject = item.subject;
    const key = `${month} - ${subject}`;
    if (!acc[key]) {
      acc[key] = { month, subject, marks: [] };
    }
    acc[key].marks.push(parseFloat(item.mark));
    return acc;
  }, {});

  const getAssessmentComment = (avg) => {
    if (avg < 60) return 'Not doing well';
    if (avg < 70) return 'Trying';
    if (avg < 85) return 'Good';
    return 'Excellent';
  };

  const getOutcome = (perc) => {
    if (perc < 45) return 'Failed';
    if (perc < 60) return 'Below expectation';
    if (perc < 85) return 'Passed';
    return 'Excellent';
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
      <h2 className="mb-4 fw-bold">Assessments</h2>

      {/* Detailed Table */}
      <div className="card shadow border-0 rounded-4 mb-5 overflow-hidden">
        <div className="card-body p-4 p-md-5">
          <h4 className="mb-4">Detailed Assessments</h4>
          <div className="table-responsive">
            <table className="table table-striped table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Assessment Name</th>
                  <th>Date Written</th>
                  <th>%</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rawAssessments.length > 0 ? (
                  rawAssessments.map((a, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{a.subject}</td>
                      <td>{a.assessment_name}</td>
                      <td>{new Date(a.date_written).toLocaleDateString()}</td>
                      <td>{a.mark}%</td>
                      <td>{getOutcome(a.mark)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No assessments recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card shadow border-0 rounded-4 overflow-hidden">
        <div className="card-body p-4 p-md-5">
          <h4 className="mb-4">Summary by Month & Subject</h4>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Month</th>
                  <th>Subject</th>
                  <th>Average</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedAssessments).length > 0 ? (
                  Object.values(groupedAssessments).map((item, i) => {
                    const avg = item.marks.reduce((a, b) => a + b, 0) / item.marks.length;
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.month}</td>
                        <td>{item.subject}</td>
                        <td>{avg.toFixed(0)}%</td>
                        <td>{getAssessmentComment(avg)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No summary data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessments;