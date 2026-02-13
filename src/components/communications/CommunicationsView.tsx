import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Phone, MessageSquare, User } from 'lucide-react';

type Conversation = {
  id: string;
  channel: 'sms' | 'voice';
  customer_phone_e164: string;
  twilio_number_e164: string;
  status: 'open' | 'closed';
  assigned_to_user_id: string | null;
  last_activity_at: string | null;
  last_message_preview: string | null;
};

export default function CommunicationsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Conversation[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('comm_conversations')
          .select('*')
          .order('last_activity_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setRows((data as Conversation[]) || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">Shared inbox for clinic SMS + call activity</p>
        </div>
      </div>

      {loading && (
        <div className="text-gray-600">Loading conversations…</div>
      )}

      {error && (
        <div className="p-4 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600">
            <div className="col-span-2">Channel</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-3">Clinic #</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Last activity</div>
          </div>

          {rows.length === 0 ? (
            <div className="p-6 text-gray-600">No conversations yet.</div>
          ) : (
            rows.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-100 hover:bg-gray-50">
                <div className="col-span-2 flex items-center gap-2 text-gray-800">
                  {c.channel === 'sms' ? <MessageSquare size={16} /> : <Phone size={16} />}
                  <span className="uppercase text-xs">{c.channel}</span>
                </div>
                <div className="col-span-3 text-gray-900 font-medium">{c.customer_phone_e164}</div>
                <div className="col-span-3 text-gray-700">{c.twilio_number_e164}</div>
                <div className="col-span-2">
                  <span className={
                    c.status === 'open'
                      ? 'text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded text-xs'
                      : 'text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded text-xs'
                  }>
                    {c.status}
                  </span>
                </div>
                <div className="col-span-2 text-gray-600 text-sm">
                  {c.last_activity_at ? new Date(c.last_activity_at).toLocaleString() : '—'}
                </div>
                {c.last_message_preview ? (
                  <div className="col-span-12 text-gray-600 text-sm mt-1 truncate">
                    {c.last_message_preview}
                  </div>
                ) : null}
                {c.assigned_to_user_id ? (
                  <div className="col-span-12 text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <User size={12} /> Assigned
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
