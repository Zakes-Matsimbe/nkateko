// src/pages/learner_comp/Dashboard.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [rawAssessments, setRawAssessments] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, a, at] = await Promise.all([
          api.get('/api/learner/profile'),
          api.get('/api/learner/assessments'),
          api.get('/api/learner/attendance'),
        ]);
        setProfile(p.data);
        setRawAssessments(a.data);
        setRawAttendance(at.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Your grouping and comment functions go here (copy from previous)
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

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div >
      <h2 className="mb-5 fw-bold text-center">Dashboard</h2>

      {/* Profile */}
      <div className="card shadow-lg border-0 rounded-4 mb-5">
        <div className="card-body text-center p-5">
          <i className="bi bi-person-circle display-1 text-primary mb-4"></i>
          <h2 className="mb-3 fw-bold">Hi, {profile?.name || 'Learner'}!</h2>
          <p className="fs-5 text-muted mb-1">Bokamoso Number</p>
          <p className="fs-4 fw-bold text-dark">{profile?.bokamoso_number || 'N/A'}</p>
          {/* Other profile info */}
        </div>
      </div>

      {/* Summaries */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow border-0 rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              <h4 className="mb-4 fw-bold">Attendance Summary</h4>
              {/* Table */}

      {/* Summary Table Attendance */}
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
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow border-0 rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              <h4 className="mb-4 fw-bold">Assessments Summary</h4>
              {/* Table */}

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;