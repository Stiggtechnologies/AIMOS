import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, User, Bot, Phone, Mail, CircleCheck as CheckCircle, ChevronRight, X, Plus, RefreshCw } from 'lucide-react';
import { growthEngineService } from '../../services/growthEngineService';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  options?: { key: string; label: string }[];
  timestamp: Date;
}

interface IntakeState {
  step: 'greeting' | 'service' | 'name' | 'phone' | 'email' | 'notes' | 'complete';
  service?: string;
  funnel?: string;
  name?: string;
  phone?: string;
  email?: string;
  channel_source: string;
}

const SERVICE_OPTIONS = [
  { key: 'physio',    label: '1. Physiotherapy',             funnel: 'physio' },
  { key: 'orthotics', label: '2. Custom Orthotics',          funnel: 'orthotics' },
  { key: 'existing',  label: '3. Existing Appointment',      funnel: 'general' },
  { key: 'employer',  label: '4. Employer / WCB / Insurance',funnel: 'employer' },
  { key: 'careers',   label: '5. Careers',                   funnel: 'general' },
];

const CHANNEL_OPTIONS = [
  { key: 'facebook-ads',  label: 'Facebook Messenger' },
  { key: 'instagram',     label: 'Instagram DM' },
  { key: 'tiktok',        label: 'TikTok Bio Link' },
  { key: 'linkedin',      label: 'LinkedIn Message' },
  { key: 'website-organic', label: 'Website Chat' },
];

const BOT_DELAY = 600;

const makeId = () => Math.random().toString(36).slice(2);

export const MessengerIntakeFlow: React.FC = () => {
  const [sessions, setSessions] = useState<{ id: string; channel: string; leadId?: string; complete: boolean }[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [intakeState, setIntakeState] = useState<Record<string, IntakeState>>({});
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('facebook-ads');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSession]);

  const addMessage = (sessionId: string, msg: Omit<Message, 'id' | 'timestamp'>) => {
    const full: Message = { ...msg, id: makeId(), timestamp: new Date() };
    setMessages(prev => ({ ...prev, [sessionId]: [...(prev[sessionId] ?? []), full] }));
    return full;
  };

  const botSay = (sessionId: string, text: string, options?: Message['options']) => {
    setTyping(true);
    return new Promise<void>(res => setTimeout(() => {
      setTyping(false);
      addMessage(sessionId, { role: 'bot', text, options });
      res();
    }, BOT_DELAY));
  };

  const startSession = async (channel: string) => {
    const id = makeId();
    const state: IntakeState = { step: 'greeting', channel_source: channel };
    setSessions(prev => [...prev, { id, channel, complete: false }]);
    setMessages(prev => ({ ...prev, [id]: [] }));
    setIntakeState(prev => ({ ...prev, [id]: state }));
    setActiveSession(id);
    setShowNew(false);

    await botSay(id,
      "Hi! Welcome to AIM — Alberta Injury Management. What are you looking for today?",
      SERVICE_OPTIONS.map(o => ({ key: o.key, label: o.label }))
    );
    setIntakeState(prev => ({ ...prev, [id]: { ...state, step: 'service' } }));
  };

  const handleOption = async (sessionId: string, optionKey: string) => {
    const state = intakeState[sessionId];
    if (!state) return;

    const opt = SERVICE_OPTIONS.find(o => o.key === optionKey);
    if (!opt) return;

    addMessage(sessionId, { role: 'user', text: opt.label });
    setIntakeState(prev => ({ ...prev, [sessionId]: { ...state, service: opt.key, funnel: opt.funnel, step: 'name' } }));

    if (opt.key === 'careers') {
      await botSay(sessionId, "Great! We'd love to learn more about you. Can you start with your full name?");
    } else if (opt.key === 'existing') {
      await botSay(sessionId, "Of course! To pull up your file, what's your full name?");
    } else {
      await botSay(sessionId, `Perfect. To get you started with ${opt.label.split('.')[1].trim()}, can I get your full name?`);
    }
  };

  const handleUserInput = async (sessionId: string, text: string) => {
    if (!text.trim()) return;
    const state = intakeState[sessionId];
    if (!state) return;

    addMessage(sessionId, { role: 'user', text });
    setInput('');

    if (state.step === 'name') {
      setIntakeState(prev => ({ ...prev, [sessionId]: { ...state, name: text, step: 'phone' } }));
      await botSay(sessionId, `Thanks ${text.split(' ')[0]}! What's the best phone number to reach you?`);

    } else if (state.step === 'phone') {
      setIntakeState(prev => ({ ...prev, [sessionId]: { ...state, phone: text, step: 'email' } }));
      await botSay(sessionId, "And do you have an email address? (You can skip this by typing 'skip')");

    } else if (state.step === 'email') {
      const email = text.toLowerCase() === 'skip' ? undefined : text;
      setIntakeState(prev => ({ ...prev, [sessionId]: { ...state, email, step: 'notes' } }));
      await botSay(sessionId, "Anything else you'd like us to know? (e.g. how you were injured, urgency, or type 'none')");

    } else if (state.step === 'notes') {
      const notes = text.toLowerCase() === 'none' ? undefined : text;
      const newState = { ...state, step: 'complete' as const };
      setIntakeState(prev => ({ ...prev, [sessionId]: newState }));

      const [fn, ...rest] = (state.name ?? '').split(' ');
      try {
        await growthEngineService.createLead({
          first_name: fn || 'Unknown',
          last_name:  rest.join(' ') || '',
          phone: state.phone ?? '',
          email: state.email,
          channel_source: state.channel_source,
          funnel_type: state.funnel ?? 'general',
          urgency_level: 'medium',
          intent_confidence: 'medium',
          lead_value_estimate: state.funnel === 'orthotics' ? 650 : state.funnel === 'employer' ? 900 : 450,
          notes: notes ?? '',
        });
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, complete: true } : s));
        await botSay(sessionId, `Thanks ${fn}! Your inquiry has been received. A member of our team will reach out shortly. You can also call us directly at (780) 469-4IM.`);
        await botSay(sessionId, "Is there anything else I can help you with?");
      } catch {
        await botSay(sessionId, "Thanks! We've noted your inquiry and will be in touch shortly.");
      }
    }
  };

  const currentMessages = activeSession ? (messages[activeSession] ?? []) : [];
  const currentState = activeSession ? intakeState[activeSession] : null;
  const lastBot = [...currentMessages].reverse().find(m => m.role === 'bot');

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Messenger Intake</h1>
              <p className="text-xs text-gray-500">Simulate or manage inbound DM / chat lead flows</p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Session List */}
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations ({sessions.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                <button
                  onClick={() => setShowNew(true)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start one
                </button>
              </div>
            ) : (
              sessions.map(s => {
                const chLabel = CHANNEL_OPTIONS.find(c => c.key === s.channel)?.label ?? s.channel;
                const lastMsg = (messages[s.id] ?? []).slice(-1)[0];
                const isActive = activeSession === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-medium text-gray-800 truncate">{chLabel}</p>
                          {s.complete && <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {lastMsg?.text ?? 'Awaiting response…'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {!activeSession ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400">Select a conversation</h3>
              <p className="text-sm text-gray-300 mt-1">or start a new one to simulate an intake</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {CHANNEL_OPTIONS.find(c => c.key === intakeState[activeSession]?.channel_source)?.label ?? 'Lead'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {currentState?.step === 'complete' ? 'Lead created' : `Step: ${currentState?.step ?? '—'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentState?.step === 'complete' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Lead Captured
                    </span>
                  )}
                  <button
                    onClick={() => { setSessions(prev => prev.filter(s => s.id !== activeSession)); setActiveSession(null); }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/30">
                {currentMessages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'bot' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      {msg.role === 'bot' ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-gray-600" />
                      )}
                    </div>
                    <div className="max-w-xs space-y-2">
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'bot'
                          ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.options && (
                        <div className="space-y-1.5">
                          {msg.options.map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => handleOption(activeSession, opt.key)}
                              className="w-full text-left flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm group"
                            >
                              <span>{opt.label}</span>
                              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex items-end gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {currentState?.step !== 'complete' && currentState?.step !== 'service' && (
                <div className="px-6 py-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUserInput(activeSession, input)}
                      placeholder="Type your reply…"
                      className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                      onClick={() => handleUserInput(activeSession, input)}
                      disabled={!input.trim()}
                      className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">New Conversation</h3>
              <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Select the inbound channel for this lead intake:</p>
            <div className="space-y-2 mb-5">
              {CHANNEL_OPTIONS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setSelectedChannel(c.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    selectedChannel === c.key
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {c.label}
                  {selectedChannel === c.key && <CheckCircle className="h-4 w-4 text-blue-500" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => startSession(selectedChannel)}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Start Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
