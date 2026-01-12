import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, AlertTriangle, TrendingUp, Target, Zap, Users } from 'lucide-react';
import { excellenceDemoService } from '../../services/excellenceDemoService';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  result?: any;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function ExcellenceDemoView() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [systemState, setSystemState] = useState<any>(null);

  const scenarios: DemoScenario[] = [
    {
      id: 'utilization-crisis',
      name: 'Utilization Crisis Chain Reaction',
      description: 'Watch the system detect a utilization drop, perform root cause analysis, and auto-trigger corrective playbooks',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'red'
    },
    {
      id: 'credential-gap',
      name: 'Credential Compliance Gap',
      description: 'See automatic detection and immediate playbook activation when credentials fall below 100%',
      icon: <Target className="w-6 h-6" />,
      color: 'yellow'
    },
    {
      id: 'comparative-learning',
      name: 'Cross-Clinic Pattern Recognition',
      description: 'Discover how the system learns from top performers and pushes insights to underperformers',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green'
    },
    {
      id: 'management-enforcement',
      name: 'Management Cadence Enforcement',
      description: 'Experience automatic escalation when managers miss mandatory operating rhythms',
      icon: <Users className="w-6 h-6" />,
      color: 'blue'
    }
  ];

  const runScenario = async (scenarioId: string) => {
    setIsRunning(true);
    setActiveScenario(scenarioId);
    setCurrentStep(0);
    setDemoSteps([]);

    try {
      let result;
      switch (scenarioId) {
        case 'utilization-crisis':
          result = await excellenceDemoService.runUtilizationCrisisDemo();
          break;
        case 'credential-gap':
          result = await excellenceDemoService.runCredentialGapDemo();
          break;
        case 'comparative-learning':
          result = await excellenceDemoService.runComparativeLearningDemo();
          break;
        case 'management-enforcement':
          result = await excellenceDemoService.runManagementEnforcementDemo();
          break;
      }

      if (result) {
        setDemoSteps(result.steps);

        // Animate through steps
        for (let i = 0; i < result.steps.length; i++) {
          setCurrentStep(i);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setCurrentStep(result.steps.length);

        // Refresh system state
        const state = await excellenceDemoService.getSystemState();
        setSystemState(state);
      }
    } catch (error) {
      console.error('Demo error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const loadSystemState = async () => {
    const state = await excellenceDemoService.getSystemState();
    setSystemState(state);
  };

  React.useEffect(() => {
    loadSystemState();
  }, []);

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-500/10 text-red-600 border-red-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      green: 'bg-green-500/10 text-green-600 border-green-500/20',
      blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold">Operational Excellence Demo</h1>
            <p className="text-indigo-100 mt-1">
              Interactive workflows showing self-correcting operations in action
            </p>
          </div>
        </div>

        {systemState && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemState.activeDeviations}</div>
              <div className="text-sm text-indigo-100">Active Deviations</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemState.activePlaybooks}</div>
              <div className="text-sm text-indigo-100">Running Playbooks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemState.pendingCadences}</div>
              <div className="text-sm text-indigo-100">Pending Cadences</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemState.recentPatterns}</div>
              <div className="text-sm text-indigo-100">Recent Patterns</div>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`border-2 rounded-lg p-6 transition-all ${
              activeScenario === scenario.id
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${getColorClasses(scenario.color)}`}>
                {scenario.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                <button
                  onClick={() => runScenario(scenario.id)}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {isRunning && activeScenario === scenario.id ? 'Running...' : 'Run Demo'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demo Execution View */}
      {activeScenario && demoSteps.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-indigo-200 p-6">
          <h2 className="text-xl font-bold mb-6">
            {scenarios.find(s => s.id === activeScenario)?.name}
          </h2>

          <div className="space-y-4">
            {demoSteps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    isComplete
                      ? 'bg-green-50 border-green-200'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-300 shadow-md'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : isCurrent ? (
                      <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                    {isComplete && step.result && (
                      <div className="mt-3 bg-white rounded p-3 border border-gray-200">
                        <div className="text-xs font-mono text-gray-700">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep >= demoSteps.length && (
            <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Demo Complete!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All steps executed successfully. Check the system state above to see the live results.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live System State Details */}
      {systemState && activeScenario && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Deviations */}
          {systemState.deviations && systemState.deviations.length > 0 && (
            <div className="bg-white rounded-lg border-2 border-red-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Active Deviations
              </h3>
              <div className="space-y-3">
                {systemState.deviations.map((deviation: any) => (
                  <div key={deviation.id} className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{deviation.baseline_id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        deviation.deviation_severity === 'red'
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {deviation.deviation_severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Value: {deviation.metric_value} | Target: {deviation.baseline_target}
                    </div>
                    <div className="text-sm text-red-600 font-medium mt-1">
                      {deviation.deviation_percentage}% deviation
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Playbooks */}
          {systemState.playbooks && systemState.playbooks.length > 0 && (
            <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Active Playbooks
              </h3>
              <div className="space-y-3">
                {systemState.playbooks.map((playbook: any) => (
                  <div key={playbook.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-medium mb-1">{playbook.playbook_id}</div>
                    <div className="text-sm text-gray-600 mb-2">{playbook.trigger_reason}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-600 text-white rounded">
                        {playbook.status}
                      </span>
                      <span className="text-gray-500">
                        Due: {new Date(playbook.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold mb-3">How It Works</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2" />
            <span>Select a scenario to see the complete workflow from detection to resolution</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2" />
            <span>Watch real database records being created as the system responds</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2" />
            <span>Each step shows the actual data created in the system</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2" />
            <span>System state updates in real-time as demos execute</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
