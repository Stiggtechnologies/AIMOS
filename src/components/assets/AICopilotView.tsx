import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Building2,
  Package,
  Lightbulb,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';

// Types
interface AIPrompt {
  id: string;
  text: string;
  category: string;
}

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

// Mock data
const suggestedPrompts: AIPrompt[] = [
  { id: '1', text: 'What should I replace in the next 12 months?', category: 'capex' },
  { id: '2', text: 'Which clinic has the weakest asset base?', category: 'health' },
  { id: '3', text: 'Show high-risk inherited assets from recent acquisitions', category: 'acquisition' },
  { id: '4', text: 'What is our total capex exposure?', category: 'capex' },
  { id: '5', text: 'Which assets should be standardized?', category: 'standardization' },
  { id: '6', text: 'Show assets with poor maintenance economics', category: 'maintenance' }
];

const mockRecommendations: AIRecommendation[] = [
  {
    id: '1',
    type: 'replace',
    title: 'Replace Treatment Table - Red Deer',
    description: 'Treatment Table (AIM-RD-001-T001) has reached end of useful life with high criticality.',
    reasoning: 'Age 90% of useful life + maintenance costs exceed 20% of replacement cost + repeated failures in last 90 days',
    urgency: 'critical',
    financial_impact: 12000,
    affected_assets: ['AIM-RD-001-T001'],
    next_action: 'Approve replacement order',
    clinic: 'Red Deer'
  },
  {
    id: '2',
    type: 'inspect',
    title: 'Inspect Laptop Fleet - Calgary South',
    description: '3 laptops approaching end of useful life with no warranty coverage.',
    reasoning: 'Warranty expired + age > 36 months + criticality medium',
    urgency: 'medium',
    financial_impact: 4500,
    affected_assets: ['AIM-YYC-001-L001', 'AIM-YYC-001-L002', 'AIM-YYC-001-L003'],
    next_action: 'Schedule inspection',
    clinic: 'Calgary South'
  },
  {
    id: '3',
    type: 'standardize',
    title: 'Standardize Treatment Tables',
    description: '3 different vendors across 12 units - consolidation opportunity identified.',
    reasoning: 'Standardization score 42% + replacement wave in next 18 months',
    urgency: 'low',
    financial_impact: 24000,
    affected_assets: ['Multiple'],
    next_action: 'Review standardization proposal',
    clinic: 'Network-wide'
  }
];

const mockChatHistory: ChatMessage[] = [];

// Components
const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[urgency] || styles.low}`}>
      {urgency.toUpperCase()} PRIORITY
    </span>
  );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    replace: <AlertTriangle size={18} className="text-red-500" />,
    inspect: <Package size={18} className="text-blue-500" />,
    standardize: <Lightbulb size={18} className="text-purple-500" />,
    maintain: <Clock size={18} className="text-green-500" />,
    acquisition: <Building2 size={18} className="text-orange-500" />
  };
  return icons[type] || icons.replace;
};

const RecommendationCard: React.FC<{ rec: AIRecommendation }> = ({ rec }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <TypeIcon type={rec.type} />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{rec.title}</h4>
          <p className="text-xs text-gray-500">{rec.clinic}</p>
        </div>
      </div>
      <UrgencyBadge urgency={rec.urgency} />
    </div>
    
    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
    
    <div className="bg-gray-50 rounded p-3 mb-3">
      <p className="text-xs font-medium text-gray-500 mb-1">Reasoning</p>
      <p className="text-sm text-gray-700">{rec.reasoning}</p>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-gray-500">
          <DollarSign size={14} />
          ${rec.financial_impact.toLocaleString()} impact
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <Package size={14} />
          {rec.affected_assets.length} assets
        </span>
      </div>
      <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
        {rec.next_action}
        <ArrowRight size={14} />
      </button>
    </div>
  </div>
);

// Main Component
export const AICopilotView: React.FC = () => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory([...chatHistory, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Based on your asset data, here are my recommendations for "${input}"`,
        timestamp: new Date().toLocaleTimeString(),
        recommendations: mockRecommendations
      };
      setChatHistory(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex">
      {/* Left Panel - Chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 bg-white border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Asset Copilot</h1>
              <p className="text-sm text-gray-500">Ask questions about your asset portfolio</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-purple-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">How can I help with your assets today?</h3>
              <p className="text-gray-500 mb-6">Try one of these prompts or ask your own question</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt.text)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-purple-600 text-white rounded-lg rounded-br-none p-3">
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-purple-200 mt-1">{msg.timestamp}</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg rounded-bl-none border shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <Sparkles className="text-purple-600" size={14} />
                        </div>
                        <span className="text-xs text-gray-500">AI Assistant • {msg.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{msg.content}</p>
                      
                      {msg.recommendations && (
                        <div className="space-y-3">
                          {msg.recommendations.map(rec => (
                            <RecommendationCard key={rec.id} rec={rec} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-bl-none border shadow-sm p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="text-purple-600" size={14} />
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about assets, replacements, acquisitions..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Context */}
      <div className="w-80 bg-white border-l hidden lg:block">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Context</h2>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Selected Clinic */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Selected Clinic</p>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Building2 size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">All Clinics</span>
              <ChevronRight size={14} className="text-gray-400 ml-auto" />
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Network Overview</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Assets</span>
                <span className="font-medium">428</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Health</span>
                <span className="font-medium">7.8/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">12M Capex</span>
                <span className="font-medium text-purple-600">$312K</span>
              </div>
            </div>
          </div>

          {/* Active Recommendations */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Active Recommendations</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-red-700">3 Critical</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                <Clock size={14} className="text-yellow-500" />
                <span className="text-yellow-700">5 Medium</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-green-700">8 Resolved</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Quick Actions</p>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 text-sm text-left bg-gray-50 rounded hover:bg-gray-100">
                Create Capex Plan →
              </button>
              <button className="w-full px-3 py-2 text-sm text-left bg-gray-50 rounded hover:bg-gray-100">
                Generate Report →
              </button>
              <button className="w-full px-3 py-2 text-sm text-left bg-gray-50 rounded hover:bg-gray-100">
                Export Asset List →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICopilotView;
