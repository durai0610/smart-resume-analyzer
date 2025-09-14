import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import ResumeDetailModal from './ResumeDetailModal';

const API_URL = process.env.REACT_APP_API_URL;

function HistoryTab() {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/resumes`);
                setResumes(response.data);
            } catch (err) {
                setError('Failed to fetch resume history.');
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchResumes();
    }, []);

    const openModal = (resume) => {
        setSelectedResume(resume);
    };

    const closeModal = () => {
        setSelectedResume(null);
    };

    if (loading) {
        return (
            <div className="content-box">
                <div className="loading-container">
                    <FaSpinner className="loading-spinner" size={32} />
                    <p className="loading-message">Loading history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="content-box">
            {resumes.length === 0 ? (
                <p className="text-center text-gray-500">No analysis history found.</p>
            ) : (
                <ul className="history-list">
                    {resumes.map(resume => (
                        <li key={resume.id} className="history-item">
                            <div>
                                <h4>{resume.name || 'Untitled Resume'}</h4>
                                <p>{resume.filename}</p>
                            </div>
                            <button
                                onClick={() => openModal(resume)}
                                className="view-details-btn"
                            >
                                View Details
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {selectedResume && (
                <ResumeDetailModal resumeId={selectedResume.id} onClose={closeModal} />
            )}
        </div>
    );
}

export default HistoryTab;