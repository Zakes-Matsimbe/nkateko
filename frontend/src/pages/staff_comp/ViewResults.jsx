// src/pages/staff_comp/ViewResults.jsx
import { useState } from 'react';

const ViewResults = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    // TODO: GET /api/staff/assessments/results?grade=...&subject=...
    setResults([
      { learner: 'Thabo Johnson', assessment: 'Test 1', date: '2026-03-01', percentage: 78 },
      { learner: 'Lerato Mokoena', assessment: 'Test 1', date: '2026-03-01', percentage: 92 },
    ]);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">View Assessment Results</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <label className="form-label fw-bold">Grade</label>
          <select className="form-select" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">Select...</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
          </select>
        </div>

        <div className="col-md-5">
          <label className="form-label fw-bold">Subject</label>
          <select className="form-select" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Select...</option>
            <option>Mathematics</option>
            <option>Physical Sciences</option>
          </select>
        </div>

        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={handleSearch}>View</button>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-primary">
              <tr>
                <th>Learner</th>
                <th>Assessment</th>
                <th>Date</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.learner}</td>
                  <td>{r.assessment}</td>
                  <td>{r.date}</td>
                  <td>{r.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info text-center">Select grade & subject to view results</div>
      )}
    </div>
  );
};

export default ViewResults;