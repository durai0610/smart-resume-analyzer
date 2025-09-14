import React, { useState } from 'react';
import axios from 'axios';
import {  FaCloudUploadAlt } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL;

function UploadTab() {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setAnalysis(null);
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a PDF file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setAnalysis(null);
        setError(null);
        setSuccess(false);

        try {
            const response = await axios.post(`${API_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setAnalysis(response.data.analysis);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderAnalysis = () => {
        if (!analysis) return null;
        const { extracted_data, llm_analysis } = analysis;

        return (
            <div className="analysis-section">
                <h2>Analysis Results</h2>
                
                <div className="analysis-card">
                    <h3>Extracted Data</h3>
                    <div className="analysis-grid">
                        <div className="detail-item">
                            <h4>Name</h4>
                            <p>{extracted_data.name || 'N/A'}</p>
                        </div>
                        <div className="detail-item">
                            <h4>Email</h4>
                            <p>{extracted_data.email || 'N/A'}</p>
                        </div>
                        <div className="detail-item">
                            <h4>Phone</h4>
                            <p>{extracted_data.phone || 'N/A'}</p>
                        </div>
                        <div className="detail-item">
                            <h4>Core Skills</h4>
                            <ul>
                                {extracted_data.core_skills?.length > 0 ? extracted_data.core_skills.map((skill, index) => (
                                    <li key={index}>{skill}</li>
                                )) : <p>N/A</p>}
                            </ul>
                        </div>
                        <div className="detail-item">
                            <h4>Work Experience</h4>
                            <ul>
                                {extracted_data.work_experience?.length > 0 ? extracted_data.work_experience.map((job, index) => (
                                    <li key={index}>
                                        <strong>{job.title}</strong> at {job.company} ({job.years})
                                        <p>{job.description}</p>
                                    </li>
                                )) : <p>N/A</p>}
                            </ul>
                        </div>
                        <div className="detail-item">
                            <h4>Education</h4>
                            <ul>
                                {extracted_data.education?.length > 0 ? extracted_data.education.map((edu, index) => (
                                    <li key={index}>
                                        <strong>{edu.degree}</strong> from {edu.institution} ({edu.years})
                                    </li>
                                )) : <p>N/A</p>}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="analysis-card">
                    <h3>AI Feedback</h3>
                    <div className="analysis-grid">
                        <div className="detail-item">
                            <h4>Resume Rating</h4>
                            <p>{llm_analysis.resume_rating} / 10</p>
                        </div>
                        <div className="detail-item">
                            <h4>Improvement Areas</h4>
                            <p>{llm_analysis.improvement_areas}</p>
                        </div>
                        <div className="detail-item">
                            <h4>Upskill Suggestions</h4>
                            <ul>
                                {llm_analysis.upskill_suggestions?.length > 0 ? llm_analysis.upskill_suggestions.map((suggestion, index) => (
                                    <li key={index}>
                                        <strong>{suggestion.skill}</strong>: {suggestion.explanation}
                                    </li>
                                )) : <p>N/A</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="content-box">
            <form onSubmit={handleSubmit} className="upload-form">
                <label className="file-input-label">
                    <FaCloudUploadAlt size={48} className="icon" />
                    <span className="block mt-2 font-medium">
                        {file ? file.name : 'Click to select a PDF file'}
                    </span>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                </label>
                <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p className="loading-message">Analyzing resume...</p>
                        </div>
                    ) : (
                        'Analyze Resume'
                    )}
                </button>
            </form>

            {error && <div className="error-message mt-4">{error}</div>}
            {success && (
                <div className="success-message mt-4">
                    Analysis complete! See results below.
                </div>
            )}

            {renderAnalysis()}
        </div>
    );
}

export default UploadTab;