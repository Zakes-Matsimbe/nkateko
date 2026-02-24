// src/pages/learner_comp/TermMarks.jsx
import { useEffect, useState } from "react";
import api from "../../lib/api";

const TERMS = [1, 2, 3, 4];

const TermMarks = () => {
  const [activeTerm, setActiveTerm] = useState(1);

  const [subjects, setSubjects] = useState([]);
  const [uploadedMarks, setUploadedMarks] = useState({});
  const [updateMarks, setUpdateMarks] = useState({});
  const [report, setReport] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!TERMS.includes(activeTerm)) return;
    loadTermData(activeTerm);
    // eslint-disable-next-line
  }, [activeTerm]);

  const loadTermData = async (term) => {
    try {
      setLoading(true);
      setError(null);
      //setSuccess(null);

      const res = await api.get(`/api/learner/term-marks/${term}`);

      const data = res.data;
      console.log("Loaded term data:", data);

      const subjectList = data.subjects ? Object.keys(data.subjects) : [];

      // Parse marks if string
      let parsedMarks = data.marks || {};
      if (typeof data.marks === "string") {
        try {
          parsedMarks = JSON.parse(data.marks);
        } catch (parseErr) {
          console.error("Failed to parse marks JSON:", parseErr);
          parsedMarks = {};
        }
      }

      setSubjects(subjectList);
      setUploadedMarks(parsedMarks);
      setUpdateMarks(parsedMarks);
      setExistingReport(data.report || null);
      setIsOpen(data.is_open || false);
      setReport(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to load term data"
      );
      setSubjects([]);
      setUploadedMarks({});
      setUpdateMarks({});
      setExistingReport(null);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (subject, value) => {
    setUpdateMarks((prev) => ({
      ...prev,
      [subject]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!isOpen) {
      setError("This term is closed.");
      return;
    }

    setError(null);
    setSuccess(null);

    // Validate update marks
    for (const sub of subjects) {
      const v = Number(updateMarks[sub]);
      if (isNaN(v) || v < 0 || v > 100) {
        setError(`Invalid mark for ${sub}`);
        return;
      }
    }

    const fd = new FormData();
    fd.append("marks", JSON.stringify(updateMarks));
    if (report) fd.append("report", report);

    try {
      setLoading(true);

      await api.post(`/api/learner/term-marks/${activeTerm}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Term marks submitted successfully");

      setTimeout(() => {
        loadTermData(activeTerm);
        setSuccess(null);
      }, 7000); 

    } catch (err) {
      console.error("Submission error:", err);
      setError(
        err.response?.data?.detail ||
        "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

const handleViewReport = () => {
  if (existingReport) {
    window.open(existingReport, "_blank", "noopener,noreferrer");
  }
};

const handleReplaceReport = async (e) => {
  const newFile = e.target.files[0];
  if (!newFile) return;

  // Basic client-side validation
  if (!newFile.type.includes("pdf")) {
    setError("Only PDF files are allowed");
    return;
  }
  if (newFile.size > 5 * 1024 * 1024) {
    setError("File size exceeds 5MB");
    return;
  }

    setReport(newFile); // for display/feedback if needed
    setLoading(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("report", newFile);

    try {
      const res = await api.post(`/api/learner/term-marks/${activeTerm}/replace-report`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update state silently
      setExistingReport(res.data.report);
      setReport(null); // clear input
      setSuccess("Report replaced successfully, reload page to view added report");

      // Auto-hide success after 10 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 10000); // 10 seconds = 10000 ms

    await loadTermData(activeTerm);


    } catch (err) {
      console.error("Replace error:", err);
      setError(
        err.response?.data?.detail ||
        "Failed to replace report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Term Marks Submission</h2>

      {/* Term Tabs */}
      <ul className="nav nav-tabs mb-4">
        {TERMS.map((t) => (
          <li key={t} className="nav-item">
            <button
              className={`nav-link ${activeTerm === t ? "active" : ""}`}
              onClick={() => setActiveTerm(t)}
            >
              Term {t}
            </button>
          </li>
        ))}
      </ul>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* SUCCESS right after error */}
      {success && (
        <div 
          className="alert alert-success d-flex align-items-center justify-content-between shadow-sm border-0 rounded-3 mt-3 mb-4" 
          role="alert"
          style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            color: '#155724',
            fontWeight: 500,
            transition: 'all 0.3s ease'
          }}
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle-fill me-3 fs-4"></i>
            <span>{success}</span>
          </div>

          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setSuccess(null)}
            aria-label="Close"
            style={{ filter: 'invert(1)' }} // Makes close button visible on green bg
          ></button>
        </div>
      )}

      {!loading && subjects.length > 0 && (
        <>
          {!isOpen && (
            <div className="alert alert-warning">
              This term is currently closed for mark submission
            </div>
          )}

        {isOpen && (
          <div 
            className="alert rounded-3 shadow-sm mt-3 mb-4 py-3"
            style={{
              backgroundColor: '#e6f0ff',           // very light blue
              border: '1px solid #b3d4fc',          // soft blue border
              color: '#004085',                     // dark blue text for contrast
              fontWeight: 500,
              textAlign: 'center',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}
            role="alert"
          >
            <i className="bi bi-info-circle-fill me-2 fs-5"></i>
            This term is currently open for mark submission
          </div>
        )}
        
          {/* Marks Table */}
          <div className="table-responsive mb-5">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Subject</th>
                  {Object.keys(uploadedMarks).length > 0 && <th>Uploaded Marks (%)</th>}
                  <th>{Object.keys(uploadedMarks).length > 0 ? "Update Marks (%)" : "Mark (%)"}</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub}>
                    <td className="fw-medium">{sub}</td>

                    {Object.keys(uploadedMarks).length > 0 && (
                      <td className="text-center">
                        <span className="badge bg-secondary fs-6">
                          {uploadedMarks[sub] ?? "—"}
                        </span>
                      </td>
                    )}

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={updateMarks[sub] ?? ""}
                        disabled={!isOpen}
                        onChange={(e) => updateMark(sub, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Section */}
          <div className="mt-4">
            <label className="form-label fw-bold">
              Term {activeTerm} Report (PDF, max 5MB)
            </label>

            {existingReport ? (
              <div className="card p-3 bg-light border">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-file-earmark-pdf text-danger me-2 fs-4"></i>
                    <span className="fw-medium">Report uploaded</span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleViewReport}
                      disabled={loading}
                    >
                      <i className="bi bi-eye me-1"></i> View
                    </button>

                    <label className={`btn btn-outline-warning btn-sm mb-0 ${loading ? 'disabled' : ''}`}>
                      <i className="bi bi-arrow-repeat me-1"></i> Replace
                      <input
                        type="file"
                        accept=".pdf"
                        className="d-none"
                        disabled={loading || !isOpen}
                        onChange={handleReplaceReport}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <input
                type="file"
                accept=".pdf"
                className="form-control"
                disabled={!isOpen || loading}
                onChange={(e) => setReport(e.target.files[0])}
              />
            )}
          </div>

          {/* Submit Button */}
          {isOpen && (
            <div className="text-center mt-5">
              <button
                className="btn btn-success btn-lg px-5"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Term Marks"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="alert alert-info text-center">
          No subjects found for this term.
        </div>
      )}
    </div>
  );
};

export default TermMarks;