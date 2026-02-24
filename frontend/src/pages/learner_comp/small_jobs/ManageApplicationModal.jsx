// src/pages/learner_comp/small_jobs/ManageApplicationModal.jsx
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import useAuthStore from '../../../stores/authStore';

const APPLICATION_CLOSING_DATE = new Date('2026-03-30T23:59:59');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_TERM4_MARK = 30;
const MIN_TOTAL_PERCENT = 40;
const MIN_AVERAGE_PERCENT = 42;

// Grade-specific configuration
const gradeConfig = {
  10: {
    fixed: ['Mathematics', 'Natural Science', 'Technology', 'EMS', 'Creative Arts', 'Social Sciences', 'Life Orientation'],
    electiveCount: 0
  },
  11: {
    fixed: ['Mathematics', 'Physical Sciences', 'Life Orientation'],
    electiveCount: 2
  },
  12: {
    fixed: ['Mathematics', 'Physical Sciences', 'Life Orientation'],
    electiveCount: 2
  }
};

const electivesList = [
  'Geography', 'Accounting', 'Business Studies', 'Life Sciences', 'History',
  'Economics', 'CAT', 'IT', 'Agricultural Sciences', 'Tourism', 'EGD',
  'Dramatic Arts', 'Visual Arts', 'Consumer Studies', 'Hospitality Studies', 'Other'
];

const ManageApplicationModal = ({ show, onHide, onSuccess }) => {
  const { user } = useAuthStore();
  const grade = Number(user?.grade) || 10;
  const config = gradeConfig[grade] || gradeConfig[10];

  const [step, setStep] = useState(1);
  const [mathType, setMathType] = useState(null);
  const [isDocUploaded, setIsDocUploaded] = useState(false);
  const [files, setFiles] = useState({ id: null, report: null });
  const [formData, setFormData] = useState({
    englishLevel: '',
    otherLanguage: '',
    otherLanguageSpecify: '',
    subjects: {},
    electives: ['', ''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (show) {
      checkDocUploadStatus();
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setStep(1);
    setMathType(null);
    setFiles({ id: null, report: null });
    setFormData({
      englishLevel: '',
      otherLanguage: '',
      otherLanguageSpecify: '',
      subjects: {},
      electives: ['', ''],
    });
    setError('');
    setValidationErrors({});
    setCanSubmit(false);
  };

  const isClosed = new Date() > APPLICATION_CLOSING_DATE;

  const checkDocUploadStatus = async () => {
    try {
      const res = await api.get('/api/learner/check-uploads');
      setIsDocUploaded(res.data.both_uploaded || false);
    } catch (err) {
      setIsDocUploaded(false);
    }
  };

  const handleMathsChoice = (type) => {
    if (type === 'Lit') {
      alert('Sorry, we do not accept applicants studying Mathematical Literacy.');
      return;
    }
    if (type !== 'Pure') {
      alert('Please select either "Pure" or "Lit".');
      return;
    }

    setMathType('Mathematics');
    setStep(isDocUploaded ? 3 : 2);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 5MB.');
      e.target.value = '';
      return;
    }
    if (!file.type.includes('pdf')) {
      alert('Only PDF files allowed.');
      e.target.value = '';
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const uploadDocuments = async () => {
    if (!files.id || !files.report) {
      alert('Please select both files.');
      return;
    }

    setLoading(true);
    setError('');

    const fd = new FormData();
    fd.append('id_file', files.id);
    fd.append('report_file', files.report);

    try {
      const res = await api.post('/api/learner/upload-documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setIsDocUploaded(true);
        alert('Documents uploaded successfully!');
        setStep(3);
      } else {
        setError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload error');
    } finally {
      setLoading(false);
    }
  };

const updateMark = (subject, term, value) => {
  setFormData(prev => ({
    ...prev,
    subjects: {
      ...prev.subjects,
      [subject]: {
        ...prev.subjects[subject],
        [term]: value,
      },
    },
  }));

  setValidationErrors(prev => {
    const copy = { ...prev };
    delete copy[`${subject}_${term}`];
    return copy;
  });
};

const selectElective = (index, value) => {
  setFormData(prev => {
    const newElectives = [...prev.electives];
    const old = newElectives[index];

    const newSubjects = { ...prev.subjects };

    if (old && old !== value) {
      delete newSubjects[old]; // ✅ safe now
    }

    newElectives[index] = value;

    if (value && !newSubjects[value]) {
      newSubjects[value] = { t2: '', t4: '' };
    }

    return {
      ...prev,
      electives: newElectives,
      subjects: newSubjects,
    };
  });
};

useEffect(() => {
  setFormData(prev => {
    const subjects = { ...prev.subjects };

    const core = ['English', ...config.fixed];
    core.forEach(sub => {
      if (!subjects[sub]) {
        subjects[sub] = { t2: '', t4: '' };
      }
    });

    return { ...prev, subjects };
  });
}, [grade]);

  const validateForm = () => {
    const errors = {};
    const subjectsData = formData.subjects || {};
    let totalT4 = 0;
    let subjectCount = 0;

    // English level
    if (!formData.englishLevel) {
      errors.englishLevel = 'English level is required';
    }

    // Additional language
    if (!formData.otherLanguage) {
      errors.otherLanguage = 'Additional language is required';
    } else if (formData.otherLanguage === 'Other' && !formData.otherLanguageSpecify.trim()) {
      errors.otherLanguageSpecify = 'Please specify the language';
    }

    // Core subjects marks
    const subjectList = getSubjectList(); // 👈 EXACTLY what user sees

    subjectList.forEach(sub => {
      const t2 = Number(subjectsData[sub]?.t2);
      const t4 = Number(subjectsData[sub]?.t4);

      if (!Number.isFinite(t2) || t2 < 10 || t2 > 100) {
        errors[sub + '_t2'] = `${sub} Term 2 mark must be between 10 and 100`;
      }

      if (!Number.isFinite(t4) || t4 < 10 || t4 > 100) {
        errors[sub + '_t4'] = `${sub} Term 4 mark must be between 10 and 100`;
      }

      if (t4 < MIN_TERM4_MARK) {
        errors[sub + '_t4'] =
          `Your Term 4 mark for ${sub} is too low (minimum ${MIN_TERM4_MARK}%)`;
      }

      totalT4 += t4;
      subjectCount++;
    });

    // Electives
    if (config.electiveCount > 0) {
      const selected = formData.electives.filter(Boolean);
      if (selected.length !== config.electiveCount) {
        errors.electives = `Please select exactly ${config.electiveCount} elective subjects`;
      }

      selected.forEach(sub => {
        const t2 = Number(subjectsData[sub]?.t2);
        if (!Number.isFinite(t2)) {
          errors[sub + '_t2'] = 'Invalid number';
        }


        const t4 = Number(subjectsData[sub]?.t4) || 0;

        if (t2 === 0 || isNaN(t2) || t2 < 10 || t2 > 100) {
          errors[sub + '_t2'] = `${sub} Term 2 mark must be between 10 and 100`;
        }
        if (t4 === 0 || isNaN(t4) || t4 < 10 || t4 > 100) {
          errors[sub + '_t4'] = `${sub} Term 4 mark must be between 10 and 100`;
        }
        if (t4 < MIN_TERM4_MARK) {
          errors[sub + '_t4'] = `Your Term 4 mark for ${sub} is too low (must be at least ${MIN_TERM4_MARK}%)`;
        }

        totalT4 += t4;
        subjectCount++;
      });
    }

    // Overall Term 4 summary
    const maxTotal = subjectCount * 100;
    const averageT4 = subjectCount ? (totalT4 / subjectCount) : 0;
    const totalPercentage = subjectCount ? (totalT4 / maxTotal * 100) : 0;

    if (totalPercentage < MIN_TOTAL_PERCENT) {
      errors.total = `Your total Term 4 marks are too low (${totalPercentage.toFixed(1)}%) — must be at least ${MIN_TOTAL_PERCENT}%`;
    }
    if (averageT4 < MIN_AVERAGE_PERCENT) {
      errors.average = `Your average Term 4 mark is too low (${averageT4.toFixed(1)}%) — must be at least ${MIN_AVERAGE_PERCENT}%`;
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setCanSubmit(isValid);
    return isValid;
  };

  const submitApplication = async () => {
    const isValid = validateForm();
    if (!isValid) {
      alert('Please fix all errors shown.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        grade,
        math_type: mathType,
        formData: formData,
      };
      const res = await api.post('/api/learner/applications/create', payload);
      if (res.data.success) {
        alert('Application submitted successfully!');
        onSuccess();
        onHide();
      } else {
        setError(res.data.message || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectList = () => {
    const core = ['English', ...config.fixed];
    const otherLang = formData.otherLanguage === 'Other' ? formData.otherLanguageSpecify.trim() || 'Other Language' : formData.otherLanguage;
    if (otherLang && otherLang !== '') core.push(otherLang);
    return core;
  };

  const calculateSummary = () => {
    const subjectsData = formData.subjects || {};
    let totalT4 = 0;
    let count = 0;

    const allSubjects = [...getSubjectList(), ...formData.electives.filter(Boolean)];
    allSubjects.forEach(sub => {
      const t4 = Number(subjectsData[sub]?.t4) || 0;
      totalT4 += t4;
      count++;
    });

    const maxTotal = count * 100;
    const averageT4 = count ? (totalT4 / count) : 0;
    const totalPercentage = count ? (totalT4 / maxTotal * 100) : 0;

    return { totalT4, maxTotal, averageT4, totalPercentage, count };
  };

  const summary = step === 3 ? calculateSummary() : null;

  return (
    <div
      className={`modal fade ${show ? 'show d-block' : ''}`}
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onHide}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New Application – Grade {grade}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>

          <div className="modal-body">
            {isClosed ? (
              <div className="alert alert-danger text-center">
                Applications are currently closed.
              </div>
            ) : (
              <>
                {/* Step 1 & 2 unchanged */}
                {step === 1 && (
                  <div className="text-center py-5">
                    <h4 className="mb-4">Which Mathematics are you taking?</h4>
                    <div className="d-flex justify-content-center gap-4">
                      <button className="btn btn-success btn-lg px-5" onClick={() => handleMathsChoice('Pure')}>
                        Pure Mathematics
                      </button>
                      <button className="btn btn-danger btn-lg px-5" onClick={() => handleMathsChoice('Lit')}>
                        Mathematical Literacy
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="py-4">
                    <h4 className="mb-4">Upload Required Documents</h4>
                    <p className="text-muted mb-4">PDF only, max 5MB each</p>

                    <div className="mb-3">
                      <label className="form-label fw-bold">ID / Birth Certificate</label>
                      <input type="file" accept=".pdf" className="form-control" onChange={e => handleFileChange(e, 'id')} />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Term 4 Report</label>
                      <input type="file" accept=".pdf" className="form-control" onChange={e => handleFileChange(e, 'report')} />
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="text-center">
                      <button className="btn btn-primary btn-lg px-5" onClick={uploadDocuments} disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload Documents'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Marks Form */}
                {step === 3 && (
                  <div className="py-4">
                    <h4 className="mb-4">Subject Marks – Grade {grade}</h4>

                    {/* English Level */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">English Level</label>
                      <select
                        className={`form-select ${validationErrors.englishLevel ? 'is-invalid' : ''}`}
                        value={formData.englishLevel}
                        onChange={e => setFormData({ ...formData, englishLevel: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Home Language">Home Language</option>
                        <option value="First Additional Language">First Additional Language</option>
                      </select>
                      {validationErrors.englishLevel && <div className="invalid-feedback">{validationErrors.englishLevel}</div>}
                    </div>

                    {/* Additional Language */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Additional Language</label>
                      <select
                        className={`form-select ${validationErrors.otherLanguage ? 'is-invalid' : ''}`}
                        value={formData.otherLanguage}
                        onChange={e => setFormData({ ...formData, otherLanguage: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Afrikaans">Afrikaans</option>
                        <option value="Sesotho">Sesotho</option>
                        <option value="Setswana">Setswana</option>
                        <option value="isiZulu">isiZulu</option>
                        <option value="isiXhosa">isiXhosa</option>
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.otherLanguage && <div className="invalid-feedback">{validationErrors.otherLanguage}</div>}

                      {formData.otherLanguage === 'Other' && (
                        <div className="mt-2">
                          <input
                            className={`form-control ${validationErrors.otherLanguageSpecify ? 'is-invalid' : ''}`}
                            placeholder="Specify language"
                            value={formData.otherLanguageSpecify}
                            onChange={e => setFormData({ ...formData, otherLanguageSpecify: e.target.value })}
                          />
                          {validationErrors.otherLanguageSpecify && <div className="invalid-feedback">{validationErrors.otherLanguageSpecify}</div>}
                        </div>
                      )}
                    </div>

                    {/* Subjects Table */}
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Subject</th>
                            <th>Term 2 (%)</th>
                            <th>Term 4 (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSubjectList().map(sub => (
                            <tr key={sub}>
                              <td className="fw-medium">{sub}</td>
                              <td>
                                <input
                                  type="number"
                                  min="10"
                                  max="100"
                                  className={`form-control ${validationErrors[sub + '_t2'] ? 'is-invalid' : ''}`}
                                  value={formData.subjects[sub]?.t2 || ''}
                                  onChange={e => updateMark(sub, 't2', e.target.value)}
                                />
                                {validationErrors[sub + '_t2'] && <div className="invalid-feedback">{validationErrors[sub + '_t2']}</div>}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="10"
                                  max="100"
                                  className={`form-control ${validationErrors[sub + '_t4'] ? 'is-invalid' : ''}`}
                                  value={formData.subjects[sub]?.t4 || ''}
                                  onChange={e => updateMark(sub, 't4', e.target.value)}
                                />
                                {validationErrors[sub + '_t4'] && <div className="invalid-feedback">{validationErrors[sub + '_t4']}</div>}
                              </td>
                            </tr>
                          ))}

                          {/* Electives */}
                          {config.electiveCount > 0 && (
                            <tr>
                              <td colSpan="3" className="bg-light fw-bold text-center">
                                Electives (Select exactly {config.electiveCount})
                                {validationErrors.electives && <div className="text-danger small mt-1">{validationErrors.electives}</div>}
                              </td>
                            </tr>
                          )}
                          {config.electiveCount > 0 && formData.electives.map((selected, index) => (
                            <tr key={index}>
                              <td>
                                <select
                                  className="form-select"
                                  value={selected}
                                  onChange={e => selectElective(index, e.target.value)}
                                >
                                  <option value="">Select Elective {index + 1}</option>
                                  {electivesList.map(opt => (
                                    <option
                                      key={opt}
                                      value={opt}
                                      disabled={formData.electives.includes(opt) && formData.electives[index] !== opt}
                                    >
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="10"
                                  max="100"
                                  className="form-control"
                                  disabled={!selected}
                                  value={formData.subjects[selected]?.t2 || ''}
                                  onChange={e => updateMark(selected, 't2', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="10"
                                  max="100"
                                  className="form-control"
                                  disabled={!selected}
                                  value={formData.subjects[selected]?.t4 || ''}
                                  onChange={e => updateMark(selected, 't4', e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {/* Summary */}
                        {summary && (
                          <tfoot>
                            <tr className="table-secondary fw-bold">
                              <td>Total Term 4</td>
                              <td colSpan="2">{summary.totalT4} / {summary.maxTotal}</td>
                            </tr>
                            <tr className="table-success fw-bold">
                              <td>Average Term 4 %</td>
                              <td colSpan="2">{summary.averageT4.toFixed(1)}%</td>
                            </tr>
                            {validationErrors.total && <tr className="table-danger"><td colSpan="3">{validationErrors.total}</td></tr>}
                            {validationErrors.average && <tr className="table-danger"><td colSpan="3">{validationErrors.average}</td></tr>}
                          </tfoot>
                        )}
                      </table>
                    </div>

                    {error && <div className="alert alert-danger mt-3">{error}</div>}

                    <div className="text-center mt-4">
                      <button
                        className="btn btn-outline-primary btn-lg px-4 me-3"
                        onClick={validateForm}
                        disabled={loading}
                      >
                        Validate Form
                      </button>

                      <button
                        className={`btn btn-lg px-5 ${canSubmit ? 'btn-success' : 'btn-secondary'}`}
                        onClick={submitApplication}
                        disabled={!canSubmit || loading}
                      >
                        {loading ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>

                    {/* Summary of all errors after Validate */}
                    {Object.keys(validationErrors).length > 0 && (
                      <div className="alert alert-warning mt-4">
                        <strong>Please fix the following before submitting:</strong>
                        <ul className="mb-0 mt-2">
                          {Object.values(validationErrors).map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageApplicationModal;