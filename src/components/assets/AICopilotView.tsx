import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, ArrowRight, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, DollarSign, Package, Lightbulb, Clock, ChevronRight, Building2 } from 'lucide-react';

interface AIPrompt { id: string; text: string; category: string; }

interface AIRecommendation {
  id: string;
  type: 'replace' | 'inspect' | 'standardize' | 'maintain' | 'acquisition';
  title: string;
  description: string;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  financial_impact: number;
  affected_assets: string[];
  next_action: string;
  clinic?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  recommendations?: AIRecommendation[];
}

const suggestedPrompts: AIPrompt[] = [
  { id: '1', text: 'What should I replace in the next 12 months?', category: 'capex' },
  { id: '2', text: 'Which clinic has the weakest asset base?', category: 'health' },
  { id: '3', text: 'Show high-risk inherited assets from recent acquisitions', category: 'acquisition' },
  { id: '4', text: 'What is our total capex exposure?', category: 'capex' },
  { id: '5', text: 'Which assets should be standardized?', category: 'standardization' },
  { id: '6', text: 'Show assets with poor maintenance economics', category: 'maintenance' },
];

const mockRecs: AIRecommendation[] = [
  {
    id: '1', type: 'replace', title: 'Replace Treatment Table — Red Deer',
    description: 'Treatment Table (AIM-RD-001-T001) has reached end of useful life with high criticality.',
    reasoning: 'Age 90% of useful life + maintenance costs exceed 20% of replacement cost + repeated failures in last 90 days',
    urgency: 'critical', financial_impact: 12000, affected_assets: ['AIM-RD-001-T001'],
    next_action: 'Approve replacement order', clinic: 'Red Deer'
  },
  {
    id: '2', type: 'inspect', title: 'Inspect Laptop Fleet — Calgary South',
    description: '3 laptops approaching end of useful life with no warranty coverage.',
    reasoning: 'Warranty expired + age > 36 months + criticality medium',
    urgency: 'medium', financial_impact: 4500,
    affected_assets: ['AIM-YYC-001-L001', 'AIM-YYC-001-L002', 'AIM-YYC-001-L003'],
    next_action: 'Schedule inspection', clinic: 'Calgary South'
  },
  {
    id: '3', type: 'standardize', title: 'Standardize Treatment Tables',
    description: '3 different vendors across 12 units — consolidation opportunity identified.',
    reasoning: 'Standardization score 42% + replacement wave in next 18 months',
    urgency: 'low', financial_impact: 24000, affected_assets: ['Multiple'],
    next_action: 'Review standardization proposal', clinic: 'Network-wide'
  },
];

const urgencyConfig: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/25',
  high:     'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  medium:   'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  low:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
};

const typeIcon: Record<string, React.ReactNode> = {
  replace:     <AlertTriangle className="w-4 h-4 text-red-400" />,
  inspect:     <Package className="w-4 h-4 text-blue-400" />,
  standardize: <Lightbulb className="w-4 h-4 text-amber-400" />,
  maintain:    <Clock className="w-4 h-4 text-emerald-400" />,
  acquisition: <Building2 className="w-4 h-4 text-sky-400" />,
};

const RecCard: React.FC<{ rec: AIRecommendation }> = ({ rec }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
          {typeIcon[rec.type]}
        </div>
        <div>
          <p className="font-medium text-slate-100 text-sm leading-tight">{rec.title}</p>
          {rec.clinic && <p className="text-xs text-slate-500 mt-0.5">{rec.clinic}</p>}
        </div>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 capitalize ${urgencyConfig[rec.urgency] || urgencyConfig.low}`}>
        {rec.urgency}
      </span>
    </div>
    <p className="text-sm text-slate-300 mb-3">{rec.description}</p>
    <div className="bg-slate-900/60 rounded-lg p-3 mb-3">
      <p className="text-xs font-medium text-slate-500 mb-1">Reasoning</p>
      <p className="text-xs text-slate-400">{rec.reasoning}</p>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${rec.financial_impact.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{rec.affected_assets.length} asset{rec.affected_assets.length !== 1 ? 's' : ''}</span>
      </div>
      <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
        {rec.next_action}<ArrowRight className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export const AICopilotView: React.FC = () => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: ts };
    const q = input;
    setChatHistory(p => [...p, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'ai',
        content: `Based on your current asset portfolio, here are my recommendations for "${q}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: mockRecs,
      };
      setChatHistory(p => [...p, aiMsg]);
      setIsTyping(false);
    }, 1400);
  };

  return (
    <div className="h-full flex bg-slate-950">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">AI Asset Copilot</h1>
              <p className="text-xs text-slate-400 mt-0.5">Ask questions about your asset portfolio</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">How can I help with your assets today?</h3>
              <p className="text-slate-500 text-sm mb-8">Try one of these prompts or ask your own question</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                {suggestedPrompts.map(p => (
                  <button key={p.id} onClick={() => setInput(p.text)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-700 rounded-full text-sm text-slate-300 hover:text-slate-100 transition-colors">
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          ) : chatHistory.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                {msg.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-blue-200 mt-1.5">{msg.timestamp}</p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-xs text-slate-500">AI Copilot · {msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">{msg.content}</p>
                    {msg.recommendations && (
                      <div className="space-y-3">
                        {msg.recommendations.map(r => <RecCard key={r.id} rec={r} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about assets, replacements, acquisitions..."
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm outline-none transition-colors" />
            <button onClick={handleSend} disabled={!input.trim() || isTyping}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 flex-shrink-0 border-l border-slate-800 bg-slate-900/40 hidden lg:flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Context</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Selected Clinic</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300 flex-1">All Clinics</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Network Overview</p>
            <div className="space-y-2.5">
              {([['Total Assets', '428', false], ['Avg Health Score', '7.8 / 10', false], ['12M Capex Est.', '$312K', true]] as [string, string, boolean][]).map(([label, value, hi]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={`text-sm font-medium ${hi ? 'text-blue-400' : 'text-slate-200'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Active Recommendations</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /><span className="text-sm text-red-400">3 Critical</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-sm text-amber-400">5 Medium</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-sm text-emerald-400">8 Resolved</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
            <div className="space-y-2">
              {['Create Capex Plan', 'Generate Report', 'Export Asset List'].map(label => (
                <button key={label}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-sm text-slate-300 hover:text-slate-100 transition-colors">
                  {label}<ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICopilotView;
