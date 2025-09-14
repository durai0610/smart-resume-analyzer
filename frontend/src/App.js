import React, { useState } from 'react';
import UploadTab from './components/UploadTab';
import HistoryTab from './components/HistoryTab';
import './App.css'; // Import the new CSS file

function App() {
    const [activeTab, setActiveTab] = useState('upload');

    return (
        <div className="container">
            <div className="main-card">
                <header className="header">
                    <h1>Smart Resume Analyzer 🧠</h1>
                    <p>Analyze, optimize, and improve your resume with AI</p>
                </header>
                <div className="tab-buttons">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
                    >
                        New Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    >
                        History
                    </button>
                </div>
                <main>
                    {activeTab === 'upload' ? <UploadTab /> : <HistoryTab />}
                </main>
            </div>
        </div>
    );
}

export default App;