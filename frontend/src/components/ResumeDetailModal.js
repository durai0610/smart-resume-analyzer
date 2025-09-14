import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL;

function ResumeDetailModal({ resumeId, onClose }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/resumes/${resumeId}`);
                setDetails(response.data);
            } catch (err) {
                setError('Failed to load resume details.');
                console.error('Error fetching details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [resumeId]);

    const renderDetails = () => {
        if (!details) return null;

        const { extracted_data, llm_analysis } = details;

        return (
            <div className="analysis-section">
                <h2>Resume Details: {details.name || 'N/A'}</h2>
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
       <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onClose} className="close-btn">
                    <FaTimes />
                </button>
                {loading && (
                    <div className="loading-container">
                        <FaSpinner className="loading-spinner" size={32} />
                        <p className="loading-message">Fetching details...</p>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
                {details && renderDetails()}
            </div>
        </div>
    );
}

export default ResumeDetailModal;