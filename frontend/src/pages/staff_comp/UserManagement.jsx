// src/pages/staff_comp/UserManagement.jsx
import { useState } from 'react';

const UserManagement = () => {
  return (
    <div className="py-4">
      <h2 className="mb-4 fw-bold text-primary">User Management (Admin/Super)</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><a className="nav-link active" href="#">Learners</a></li>
        <li className="nav-item"><a className="nav-link" href="#">Parents</a></li>
        <li className="nav-item"><a className="nav-link" href="#">Staff</a></li>
      </ul>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="alert alert-info">
            Placeholder: Tables for adding/editing/deleting users will go here
          </div>
          <button className="btn btn-success">Add New Learner</button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
