import { useState } from 'react';
import { Brain, Sparkles, TrendingUp, AlertCircle, X } from 'lucide-react';
import { schedulerService } from '../../services/schedulerService';

interface AIScheduleInsightsProps {
  clinicId: string;
  date: string;
}

export default function AIScheduleInsights({ clinicId, date }: AIScheduleInsightsProps) {
  const [analysis, setAnalysis] = useState<{ analysis: string; recommendations: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function loadAIAnalysis() {
    try {
      setLoading(true);
      setError(null);
      const result = await schedulerService.getAIScheduleAnalysis(clinicId, date);
      if (result) {
        setAnalysis(result);
        setIsOpen(true);
      } else {
        setError('AI analysis unavailable. Please check OpenAI API key configuration.');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen && !analysis) {
    return (
      <button
        onClick={loadAIAnalysis}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Analyzing Schedule...</span>
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            <span>Get AI Insights</span>
            <Sparkles className="h-3 w-3" />
          </>
        )}
      </button>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">AI Analysis Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Brain className="h-5 w-5" />
          <h3 className="font-semibold">AI Schedule Intelligence</h3>
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-purple-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Analysis</h4>
          </div>
          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-purple-100">
            {analysis.analysis}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Recommendations</h4>
          </div>
          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-blue-100">
            {analysis.recommendations}
          </div>
        </div>

        <button
          onClick={loadAIAnalysis}
          disabled={loading}
          className="w-full py-2 text-sm text-purple-700 hover:text-purple-900 font-medium transition-colors"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
}
