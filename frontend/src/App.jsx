import { useState } from 'react';
import './App.css';
import VoiceAgent from './VoiceAgent';
import AgentDashboard from './AgentDashboard';
import {
  ShieldIcon,
  SparklesIcon,
  BookOpenIcon,
  MicIcon,
  RadioIcon,
  UploadCloudIcon,
  FileTextIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from './icons';

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ text: '', type: '' });
  const [isUploading, setIsUploading] = useState(false);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'rag', 'voice', 'copilot'

  const sampleQuestions = [
    'What are the eligibility requirements for term life?',
    'What is the deductible for flood coverage?',
    'Explain the policy cancellation process and notice period.',
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus({ text: '', type: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus({ text: 'Processing and vectorizing document...', type: 'info' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'general');

    try {
      const response = await fetch('http://localhost:5000/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadStatus({
          text: `Document indexed successfully. Created ${data.chunks_created} vector chunks in LanceDB.`,
          type: 'success',
        });
      } else {
        setUploadStatus({
          text: data.error || 'Failed to index document.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Document upload error:', error);
      setUploadStatus({
        text: 'Failed to connect to backend server at http://localhost:5000.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async (queryText) => {
    const userQ = (queryText || question).trim();
    if (!userQ) return;
    setQuestion('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userQ }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ }),
      });
      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          content: data.answer || 'No answer generated.',
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      console.error('RAG query error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          content: 'Unable to connect to the backend server. Please check that the backend is running.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="header-wrapper">
        <div className="top-navbar">
          <div className="brand-section">
            <div className="brand-logo-badge">
              <ShieldIcon size={24} />
            </div>
            <div className="brand-text">
              <h1>Jin Insurance</h1>
              <p>Enterprise AI Suite & Conversational Copilot</p>
            </div>
          </div>

          <div className="header-status-group">
            <div className="status-pill">
              <span className="status-dot pulse"></span>
              <span>AI Engine Ready</span>
            </div>
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <nav className="nav-tabs-bar" aria-label="Module Tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <SparklesIcon size={16} />
            <span>All Modules</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
            onClick={() => setActiveTab('rag')}
          >
            <BookOpenIcon size={16} />
            <span>Policy Knowledge Base (RAG)</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            <MicIcon size={16} />
            <span>Voice Agent</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`}
            onClick={() => setActiveTab('copilot')}
          >
            <RadioIcon size={16} />
            <span>Agent Copilot (Q4)</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Hero Banner for Overview */}
        {activeTab === 'all' && (
          <div className="hero-banner">
            <div className="hero-content">
              <h2>Jin Insurance AI Control Center</h2>
              <p>
                Unified intelligence platform featuring semantic policy retrieval with PII redaction, 
                multi-lingual voice agents (US English, Taglish, Bahasa), and real-time live call nudges.
              </p>
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <span className="stat-value">LanceDB</span>
                  <span className="stat-label">Vector Storage</span>
                </div>
                <div className="hero-stat-card">
                  <span className="stat-value">Gemini 1.5</span>
                  <span className="stat-label">LLM Intelligence</span>
                </div>
                <div className="hero-stat-card">
                  <span className="stat-value">3 Regions</span>
                  <span className="stat-label">Voice Bot Localization</span>
                </div>
                <div className="hero-stat-card">
                  <span className="stat-value">&lt; 120ms</span>
                  <span className="stat-label">Real-time ASR Pipeline</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules Grid */}
        <div className="modules-grid">
          {/* Module 1: RAG Knowledge Base */}
          {(activeTab === 'all' || activeTab === 'rag') && (
            <section className="module-card">
              <div className="module-header">
                <div className="module-title-group">
                  <div className="module-icon-wrap">
                    <BookOpenIcon size={20} />
                  </div>
                  <div>
                    <h3>1. Policy Knowledge Base (RAG)</h3>
                    <p>Ingest policy PDFs/text and query with grounded vector citations</p>
                  </div>
                </div>
              </div>

              {/* Ingestion Sub-Card */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--secondary)' }}>
                  Document Ingestion
                </h4>
                <div className="upload-dropzone" onClick={() => document.getElementById('file-upload-input').click()}>
                  <input
                    id="file-upload-input"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".pdf,.txt,.md"
                  />
                  <div className="upload-dropzone-inner">
                    <div className="upload-icon-circle">
                      <UploadCloudIcon size={24} />
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Click to browse or drag policy documents</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Supports PDF, TXT files (PII like phone numbers & emails are automatically redacted)
                      </p>
                    </div>
                    {file && (
                      <div className="upload-file-details">
                        <FileTextIcon size={16} />
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="upload-actions">
                  <button
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                  >
                    <UploadCloudIcon size={16} />
                    {isUploading ? 'Vectorizing Document...' : 'Upload to Jin Knowledge Base'}
                  </button>
                  {file && (
                    <button
                      className="btn-secondary"
                      onClick={() => setFile(null)}
                      disabled={isUploading}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {uploadStatus.text && (
                  <div className={`alert-banner ${uploadStatus.type}`}>
                    {uploadStatus.type === 'success' && <CheckCircleIcon size={18} />}
                    {uploadStatus.type === 'error' && <AlertCircleIcon size={18} />}
                    {uploadStatus.type === 'info' && <SparklesIcon size={18} />}
                    <span>{uploadStatus.text}</span>
                  </div>
                )}
              </div>

              {/* Retrieval & Generation Sub-Card */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--secondary)' }}>
                  Retrieval & Semantic Q&A
                </h4>

                <div className="chat-thread-container">
                  <div className="chat-messages-area">
                    {chatHistory.length === 0 ? (
                      <div className="chat-empty-state">
                        <BookOpenIcon size={32} />
                        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                          Ask Jin Insurance Assistant
                        </p>
                        <p style={{ fontSize: '0.8125rem' }}>
                          Type a coverage question or select a suggested topic below:
                        </p>
                        <div className="sample-prompts-group">
                          {sampleQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              className="prompt-chip"
                              onClick={() => handleAsk(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                          <div className={`avatar-badge ${msg.role}`}>
                            {msg.role === 'user' ? <UserIcon size={16} /> : <BotIcon size={16} />}
                          </div>
                          <div className="chat-bubble-content">
                            <div className="bubble-text">{msg.content}</div>

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="sources-box">
                                <div className="sources-box-header">
                                  <FileTextIcon size={12} />
                                  <span>Verified Policy Sources</span>
                                </div>
                                {msg.sources.map((s, i) => (
                                  <div key={i} className="source-item">
                                    <span style={{ fontWeight: 500 }}>{s.document || `Chunk #${i + 1}`}</span>
                                    {s.distance !== undefined && (
                                      <span className="source-distance-badge">
                                        Dist: {s.distance.toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {loading && (
                      <div className="chat-bubble-row agent">
                        <div className="avatar-badge agent">
                          <BotIcon size={16} />
                        </div>
                        <div className="chat-bubble-content">
                          <div className="bubble-text" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            Jin AI is querying vector database and generating answer...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="chat-input-bar">
                  <input
                    type="text"
                    className="chat-input-field"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="Ask a question about coverage, policy exclusions, or claim process..."
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleAsk()}
                    disabled={!question.trim() || loading}
                  >
                    <SendIcon size={16} />
                    <span>Ask</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Module 2: Voice Agent */}
          {(activeTab === 'all' || activeTab === 'voice') && (
            <VoiceAgent />
          )}

          {/* Module 3: Agent Dashboard (Live Copilot) */}
          {(activeTab === 'all' || activeTab === 'copilot') && (
            <AgentDashboard />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldIcon size={16} />
          <strong>Jin Insurance</strong>
          <span>• Enterprise Conversational AI & Policy RAG</span>
        </div>
        <div>
          <span>Local Vector DB (LanceDB) & Real-time WebSockets</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
