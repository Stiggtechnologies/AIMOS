import { useState } from 'react';
import { MessageSquare, Plus, RefreshCw, Send, X, ChevronRight } from 'lucide-react';
import type { PatientSecureMessage } from '../../services/patientExperienceService';

interface PatientMessagesViewProps {
  messages: PatientSecureMessage[];
  patientId: string;
  patientName: string;
  loading: boolean;
  onSend: (msg: { subject: string; body: string; priority: string; thread_id?: string }) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-gray-50 text-gray-500',
};

export default function PatientMessagesView({
  messages,
  patientId,
  patientName,
  loading,
  onSend,
  onMarkRead,
  onRefresh,
}: PatientMessagesViewProps) {
  const [showCompose, setShowCompose] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const threads = Array.from(new Map(
    messages.map(m => [m.thread_id || m.id, m])
  ).values());

  const threadMessages = activeThread
    ? messages.filter(m => m.thread_id === activeThread || m.id === activeThread)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const activeThreadMsg = threadMessages[0];

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError('Subject and message are required'); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onSend({ subject, body, priority });
      setShowCompose(false);
      setSubject(''); setBody(''); setPriority('normal');
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !activeThreadMsg) return;
    try {
      setReplySubmitting(true);
      await onSend({
        subject: `Re: ${activeThreadMsg.subject}`,
        body: replyBody,
        priority: 'normal',
        thread_id: activeThread || undefined,
      });
      setReplyBody('');
    } finally {
      setReplySubmitting(false);
    }
  };

  const openThread = async (threadId: string) => {
    setActiveThread(threadId);
    const unread = messages.filter(m => (m.thread_id === threadId || m.id === threadId) && !m.is_read && m.sender_type === 'staff');
    for (const msg of unread) await onMarkRead(msg.id);
  };

  if (activeThread) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveThread(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 flex-1 truncate">
            {activeThreadMsg?.subject}
          </h2>
        </div>

        <div className="space-y-3">
          {threadMessages.map(msg => (
            <div
              key={msg.id}
              className={`rounded-2xl px-4 py-3 max-w-sm ${
                msg.sender_type === 'patient'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className={`text-xs font-semibold mb-1 ${msg.sender_type === 'patient' ? 'text-blue-100' : 'text-gray-500'}`}>
                {msg.sender_name}
              </p>
              <p className={`text-sm leading-relaxed ${msg.sender_type === 'patient' ? 'text-white' : 'text-gray-800'}`}>
                {msg.body}
              </p>
              <p className={`text-xs mt-1.5 ${msg.sender_type === 'patient' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3 flex gap-2 items-end">
          <textarea
            className="flex-1 text-sm border-none outline-none resize-none min-h-[60px] text-gray-800 placeholder-gray-400"
            placeholder="Type your reply..."
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
          />
          <button
            onClick={handleReply}
            disabled={!replyBody.trim() || replySubmitting}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {replySubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCompose(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">New Message to Clinic</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g. Question about my exercises..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={4} placeholder="Write your message here..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['normal', 'urgent', 'low'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    priority === p ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={submitting}
              className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No messages yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap "New Message" to contact your clinic</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => {
            const threadId = thread.thread_id || thread.id;
            const unreadCount = messages.filter(m => (m.thread_id === threadId || m.id === threadId) && !m.is_read && m.sender_type === 'staff').length;
            return (
              <button
                key={thread.id}
                onClick={() => openThread(threadId)}
                className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${unreadCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  <MessageSquare className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{thread.subject}</p>
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{thread.body}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{new Date(thread.created_at).toLocaleDateString()}</span>
                    {thread.priority !== 'normal' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_STYLES[thread.priority]}`}>{thread.priority}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
