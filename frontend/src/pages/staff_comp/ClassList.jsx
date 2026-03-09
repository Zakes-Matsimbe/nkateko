// src/pages/staff_comp/ClassList.jsx
import { useState } from 'react';

const ClassList = () => {
  const [selectedLearner, setSelectedLearner] = useState(null);

  // Placeholder data
  const classes = [
    {
      grade: 'Grade 11',
      learners: [
        { id: 1, full_names: 'Thabo', surname: 'Johnson', school: 'Bokamoso High' },
        { id: 2, full_names: 'Lerato', surname: 'Mokoena', school: 'Bokamoso High' },
      ]
    }
  ];

  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">Class List</h2>

      {classes.map(c => (
        <div key={c.grade} className="mb-5">
          <h4 className="fw-bold">{c.grade}</h4>
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>School</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {c.learners.map(l => (
                  <tr key={l.id}>
                    <td>{l.full_names}</td>
                    <td>{l.surname}</td>
                    <td>{l.school}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedLearner(l)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal Placeholder */}
      {selectedLearner && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedLearner.full_names} {selectedLearner.surname}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLearner(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>School:</strong> {selectedLearner.school}</p>
                <div className="alert alert-info mt-3">Learner assessments & attendance will appear here</div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLearner(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;