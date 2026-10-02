import { useState, useRef } from 'react';
import {
  MicIcon,
  GlobeIcon,
  RefreshCwIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  AlertCircleIcon,
} from './icons';

export default function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [chatHistory, setChatHistory] = useState([]);
  const [region, setRegion] = useState('US'); // US, PH, ID
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const getLanguageTag = () => {
    if (region === 'PH') return 'fil-PH';
    if (region === 'ID') return 'id-ID';
    return 'en-US';
  };

  const getRegionDetails = () => {
    switch (region) {
      case 'PH':
        return { name: 'Philippines (Taglish)', useCase: 'Payment & Policy Reminders', flag: '🇵🇭' };
      case 'ID':
        return { name: 'Indonesia (Bahasa)', useCase: 'Renewal & Premium Notices', flag: '🇮🇩' };
      default:
        return { name: 'United States (English)', useCase: 'Loan Qualification & FAQ', flag: '🇺🇸' };
    }
  };

  const startInteraction = () => {
    if (!speechSupported) {
      alert(
        'Speech Recognition is not supported by your current browser. Please use Google Chrome or type in the message box below.'
      );
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = getLanguageTag();

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setStatus(`Listening (${getLanguageTag()})...`);
    };

    recognitionRef.current.onresult = async (event) => {
      const userMessage = event.results[0][0].transcript;
      setStatus('Processing with Jin AI...');
      setIsRecording(false);

      const updatedHistory = [...chatHistory, { role: 'user', content: userMessage }];
      setChatHistory(updatedHistory);

      await sendToBackend(updatedHistory, userMessage);
    };

    recognitionRef.current.onerror = () => {
      setStatus('Speech error. Please try again or use text input.');
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const handleTextSend = async () => {
    if (!textInput.trim()) return;
    const userMessage = textInput.trim();
    setTextInput('');
    setStatus('Processing with Jin AI...');

    const updatedHistory = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(updatedHistory);

    await sendToBackend(updatedHistory, userMessage);
  };

  const sendToBackend = async (history, userMessage) => {
    try {
      const endpoint = region === 'US' ? '/api/voice/chat' : '/api/voice/localized-chat';

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, userMessage, region }),
      });
      const data = await response.json();

      const newHistory = [...history, { role: 'agent', content: data.answer }];
      setChatHistory(newHistory);

      speakResponse(data.answer);

      if (data.end_call) {
        setStatus(data.escalate ? 'Call Ended (Escalated to Agent)' : 'Call Ended (Completed)');
        saveTranscript(newHistory, data.escalate, data.lead_qualified);
      } else {
        setStatus('Ready');
      }
    } catch (error) {
      console.error('Voice chat request error:', error);
      setStatus('Connection error with backend.');
    }
  };

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageTag();
    window.speechSynthesis.speak(utterance);
  };

  const saveTranscript = async (history, escalate, lead_qualified) => {
    try {
      await fetch('http://localhost:5000/api/voice/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: history,
          status: escalate ? 'escalated' : 'completed',
          qualification_result: lead_qualified,
          region: region,
        }),
      });
    } catch (e) {
      console.error('Error saving transcript:', e);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setStatus('Ready');
  };

  const currentRegion = getRegionDetails();

  return (
    <section className="module-card">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon-wrap" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <MicIcon size={20} />
          </div>
          <div>
            <h3>2. Jin Insurance Voice Agent</h3>
            <p>Interactive voice assistant powered by Gemini with localized regional support</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="voice-status-pill">
            Status: <strong style={{ color: 'var(--text-main)' }}>{status}</strong>
          </span>
        </div>
      </div>

      <div className="voice-agent-container">
        {/* Controls Bar */}
        <div className="voice-controls-bar">
          <div className="region-select-group">
            <GlobeIcon size={16} />
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Target Region:
            </label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                clearChat();
              }}
              className="region-dropdown"
            >
              <option value="US">🇺🇸 United States — Loan Qualification (en-US)</option>
              <option value="PH">🇵🇭 Philippines — Taglish Reminder (fil-PH)</option>
              <option value="ID">🇮🇩 Indonesia — Bahasa Reminder (id-ID)</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={clearChat}>
            <RefreshCwIcon size={14} />
            <span>Reset Call Session</span>
          </button>
        </div>

        {/* Hero Voice Interaction Box */}
        <div className="voice-hero-action">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Active Mode: <strong>{currentRegion.flag} {currentRegion.name}</strong> • <em>{currentRegion.useCase}</em>
          </div>

          {speechSupported ? (
            <button
              onClick={startInteraction}
              disabled={isRecording}
              className={`mic-action-btn ${isRecording ? 'recording' : ''}`}
            >
              <MicIcon size={20} />
              <span>{isRecording ? 'Listening (Speak Now)...' : 'Click to Speak'}</span>
            </button>
          ) : (
            <div className="alert-banner error" style={{ margin: 0 }}>
              <AlertCircleIcon size={16} />
              <span>Speech recognition not supported in this browser. Please type below or switch to Chrome.</span>
            </div>
          )}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Uses browser Web Speech API for low-latency ASR + Text-To-Speech playback
          </p>
        </div>

        {/* Text Input Fallback */}
        <div className="chat-input-bar">
          <input
            type="text"
            className="chat-input-field"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
            placeholder={
              speechSupported
                ? 'Or type your response here to test without microphone...'
                : 'Type your message to Jin Voice Agent...'
            }
          />
          <button
            className="btn-primary"
            onClick={handleTextSend}
            disabled={!textInput.trim()}
          >
            <SendIcon size={16} />
            <span>Send</span>
          </button>
        </div>

        {/* Conversation History Stream */}
        <div className="chat-thread-container" style={{ height: '320px', margin: 0 }}>
          <div className="chat-messages-area">
            {chatHistory.length === 0 ? (
              <div className="chat-empty-state">
                <MicIcon size={32} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>
                  No voice messages yet
                </p>
                <p style={{ fontSize: '0.8125rem' }}>
                  Click &quot;Click to Speak&quot; or type above to start a conversation with the Jin Insurance agent.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                  <div className={`avatar-badge ${msg.role}`}>
                    {msg.role === 'user' ? <UserIcon size={16} /> : <BotIcon size={16} />}
                  </div>
                  <div className="chat-bubble-content">
                    <div className="bubble-text">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
