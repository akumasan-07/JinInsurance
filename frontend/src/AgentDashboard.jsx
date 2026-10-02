import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  RadioIcon,
  ZapIcon,
  AlertCircleIcon,
  UserIcon,
  BotIcon,
} from './icons';

export default function AgentDashboard() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [suppressions, setSuppressions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('new_nudge', (nudge) => {
      setNudges((prev) => [nudge, ...prev]);
    });

    socketRef.current.on('nudge_suppressed', (info) => {
      setSuppressions((prev) => [
        { ...info, timestamp: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const startCall = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser. Please switch to Google Chrome.');
      return;
    }

    setTranscript([]);
    setNudges([]);
    setSuppressions([]);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsCallActive(true);
    };

    recognitionRef.current.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.trim();

      const chunk = {
        text,
        isAgent: text.toLowerCase().includes('agent'),
        timestamp: Date.now(),
        timeStr: new Date().toLocaleTimeString(),
      };

      setTranscript((prev) => [...prev, chunk]);

      if (socketRef.current) {
        socketRef.current.emit('transcript_chunk', chunk);
      }
    };

    recognitionRef.current.onerror = (e) => {
      console.error('ASR Error:', e);
    };

    recognitionRef.current.start();
  };

  const endCall = () => {
    setIsCallActive(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <section className="module-card">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            <RadioIcon size={20} />
          </div>
          <div>
            <h3>3. Real-Time Agent Copilot (Q4)</h3>
            <p>Live call transcription, dynamic compliance alerts & latency tracking</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isCallActive ? (
            <div className="live-badge-recording">
              <span className="status-dot" style={{ backgroundColor: '#dc2626' }}></span>
              <span>LIVE CALL ACTIVE</span>
            </div>
          ) : (
            <div className="status-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderColor: 'var(--border-medium)' }}>
              <span className="status-dot" style={{ backgroundColor: isConnected ? '#10b981' : '#94a3b8' }}></span>
              <span>{isConnected ? 'Socket Connected' : 'Socket Standby'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructional helper */}
      <div className="alert-banner info" style={{ marginTop: 0, marginBottom: '20px' }}>
        <ZapIcon size={18} />
        <span style={{ fontSize: '0.8125rem' }}>
          <strong>Simulation Guide:</strong> Start the call and speak into your microphone. Say the word{' '}
          <code>&quot;agent&quot;</code> in your phrase to simulate the Jin Insurance Agent (e.g., &quot;Agent confirms your flood policy is active&quot;). 
          Otherwise, your speech is registered as the Customer to trigger live cross-sell and compliance nudges.
        </span>
      </div>

      {/* Call Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          {isCallActive ? (
            <button className="btn-danger" onClick={endCall}>
              <RadioIcon size={16} />
              <span>End Live Call</span>
            </button>
          ) : (
            <button className="btn-success" onClick={startCall}>
              <RadioIcon size={16} />
              <span>Start Live Call</span>
            </button>
          )}
        </div>

        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {transcript.length} turns captured • {nudges.length} nudges generated
        </span>
      </div>

      {/* Two Column Copilot Grid */}
      <div className="copilot-grid">
        {/* Left Column: Live Transcript */}
        <div className="copilot-panel">
          <div className="copilot-panel-header">
            <span>Live Transcript Stream</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isCallActive ? 'Streaming...' : 'Idle'}
            </span>
          </div>

          <div className="copilot-panel-body">
            {transcript.length === 0 ? (
              <div className="chat-empty-state">
                <RadioIcon size={28} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>
                  No live speech detected
                </p>
                <p style={{ fontSize: '0.8125rem' }}>
                  Click &quot;Start Live Call&quot; and speak into your microphone to view real-time speech tokens.
                </p>
              </div>
            ) : (
              transcript.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: t.isAgent ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    border: `1px solid ${t.isAgent ? 'var(--primary-border)' : 'var(--border-light)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: t.isAgent ? 'var(--primary)' : 'var(--secondary)',
                      }}
                    >
                      {t.isAgent ? <BotIcon size={14} /> : <UserIcon size={14} />}
                      {t.isAgent ? 'Jin Agent' : 'Customer'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      {t.timeStr}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{t.text}</div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Right Column: Nudges & Latency Feed */}
        <div className="copilot-panel">
          <div className="copilot-panel-header">
            <span>Active Nudges & Copilot Signals</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              60s Cooldown Active
            </span>
          </div>

          <div className="copilot-panel-body">
            {nudges.length === 0 ? (
              <div className="chat-empty-state">
                <ZapIcon size={28} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>
                  Awaiting Signals
                </p>
                <p style={{ fontSize: '0.8125rem' }}>
                  Copilot monitors transcript for cross-sell opportunities, disclosures, and compliance alerts.
                </p>
              </div>
            ) : (
              nudges.map((nudge, idx) => {
                const isCompliance = nudge.signal && nudge.signal.toLowerCase().includes('compliance');
                return (
                  <div
                    key={idx}
                    className={`nudge-card ${isCompliance ? 'alert-compliance' : 'alert-cross-sell'}`}
                  >
                    <div className="nudge-header-row">
                      <div className="nudge-signal-tag">
                        {isCompliance ? <AlertCircleIcon size={14} /> : <ZapIcon size={14} />}
                        <span>{nudge.signal}</span>
                      </div>
                      {nudge.confidence && (
                        <div className="nudge-confidence-tag">
                          Conf: {nudge.confidence}
                        </div>
                      )}
                    </div>

                    <div className="nudge-message-text">{nudge.message}</div>

                    {nudge.metrics && (
                      <div className="nudge-metrics-row">
                        <span className="metric-pill">
                          LLM: <strong>{nudge.metrics.llm_latency_ms}ms</strong>
                        </span>
                        <span className="metric-pill">
                          P50: <strong>{nudge.metrics.p50_e2e}ms</strong>
                        </span>
                        <span className="metric-pill">
                          P95: <strong>{nudge.metrics.p95_e2e}ms</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Suppressions Timeline */}
            {suppressions.length > 0 && (
              <div className="suppression-drawer">
                <div className="suppression-title">
                  Suppressed Signals (Anti-Spam Cooldown)
                </div>
                <ul className="suppression-list">
                  {suppressions.map((s, i) => (
                    <li key={i}>
                      <span>{s.type || 'Duplicate signal'}</span>
                      <span style={{ color: 'var(--text-subtle)' }}>{s.timestamp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
