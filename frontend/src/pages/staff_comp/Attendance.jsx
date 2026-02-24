// src/pages/learner_comp/Attendance.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const Attendance = () => {
  const [rawAttendance, setRawAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/learner/attendance');
        setRawAttendance(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load attendance');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group by month for summary
  const groupedAttendance = rawAttendance.reduce((acc, item) => {
    const month = new Date(item.class_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { total_days: 0, attended: 0 };
    }
    acc[month].total_days += 1;
    if (item.status === 'Attended') acc[month].attended += 1;
    return acc;
  }, {});

  const getAttendanceComment = (perc) => {
    if (perc < 60) return 'Bad';
    if (perc < 75) return 'Be careful';
    if (perc < 85) return 'Not so well';
    return 'Good';
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
      <h2 className="mb-4 fw-bold">Attendance</h2>

      {/* Detailed Table */}
      <div className="card shadow border-0 rounded-4 mb-5 overflow-hidden">
        <div className="card-body p-4 p-md-5">
          <h4 className="mb-4">Detailed Attendance Records</h4>
          <div className="table-responsive">
            <table className="table table-striped table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {rawAttendance.length > 0 ? (
                  rawAttendance.map((a, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{new Date(a.class_date).toLocaleDateString()}</td>
                      <td>{a.status}</td>
                      <td>{a.status === 'Apology' ? a.apology_message || 'No message provided' : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">No attendance records found</td>
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
          <h4 className="mb-4">Monthly Attendance Summary</h4>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Month</th>
                  <th>Total Days</th>
                  <th>Attended</th>
                  <th>%</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedAttendance).length > 0 ? (
                  Object.entries(groupedAttendance).map(([month, data], i) => {
                    const perc = (data.attended / data.total_days * 100).toFixed(0);
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{month}</td>
                        <td>{data.total_days}</td>
                        <td>{data.attended}</td>
                        <td>{perc}%</td>
                        <td>{getAttendanceComment(perc)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No summary data available</td>
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

export default Attendance;