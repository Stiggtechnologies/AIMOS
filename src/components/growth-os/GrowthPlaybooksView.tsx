import { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckSquare, Calendar, TrendingUp, Target, DollarSign, Clock, Users, Play, ChevronRight, Star, Award } from 'lucide-react';
import { getGrowthPlaybooksLibrary, GrowthPlaybooksLibrary, PlaybookTemplate, OutreachScript, EngagementChecklist, SeasonalDemandPlan } from '../../services/playbooksService';

type TabView = 'templates' | 'scripts' | 'checklists' | 'seasonal' | 'executions';

export default function GrowthPlaybooksView() {
  const [activeTab, setActiveTab] = useState<TabView>('templates');
  const [library, setLibrary] = useState<GrowthPlaybooksLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null);
  const [selectedScript, setSelectedScript] = useState<OutreachScript | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<EngagementChecklist | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    try {
      const data = await getGrowthPlaybooksLibrary();
      setLibrary(data);
    } catch (error) {
      console.error('Error loading playbooks library:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading playbooks library...</div>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load playbooks library</div>
      </div>
    );
  }

  const tabs = [
    { id: 'templates' as TabView, label: 'Playbook Templates', icon: BookOpen, count: library.stats.total_templates },
    { id: 'scripts' as TabView, label: 'Outreach Scripts', icon: FileText, count: library.stats.total_scripts },
    { id: 'checklists' as TabView, label: 'Engagement Checklists', icon: CheckSquare, count: library.stats.total_checklists },
    { id: 'seasonal' as TabView, label: 'Seasonal Plans', icon: Calendar, count: library.seasonal_plans.length },
    { id: 'executions' as TabView, label: 'Active Executions', icon: Play, count: library.stats.active_executions_count },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Growth Playbooks Library</h2>
        <p className="text-gray-600 mt-1">Ready-to-use templates, scripts, and strategies for local clinic growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Total Playbooks</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{library.stats.total_templates}</div>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">Active Campaigns</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{library.stats.active_executions_count}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600">Leads Generated</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{library.stats.total_leads_generated}</div>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-600">Revenue Generated</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">${(library.stats.total_revenue_generated / 1000).toFixed(0)}k</div>
            </div>
            <DollarSign className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'templates' && (
            <PlaybookTemplatesTab
              templates={library.playbook_templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          )}
          {activeTab === 'scripts' && (
            <OutreachScriptsTab
              scripts={library.outreach_scripts}
              selectedScript={selectedScript}
              onSelectScript={setSelectedScript}
            />
          )}
          {activeTab === 'checklists' && (
            <EngagementChecklistsTab
              checklists={library.engagement_checklists}
              selectedChecklist={selectedChecklist}
              onSelectChecklist={setSelectedChecklist}
            />
          )}
          {activeTab === 'seasonal' && (
            <SeasonalPlansTab plans={library.seasonal_plans} />
          )}
          {activeTab === 'executions' && (
            <ActiveExecutionsTab executions={library.active_executions} />
          )}
        </div>
      </div>
    </div>
  );
}

function PlaybookTemplatesTab({
  templates,
  selectedTemplate,
  onSelectTemplate
}: {
  templates: PlaybookTemplate[];
  selectedTemplate: PlaybookTemplate | null;
  onSelectTemplate: (template: PlaybookTemplate | null) => void;
}) {
  if (selectedTemplate) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSelectTemplate(null)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to templates
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-blue-100">{selectedTemplate.playbook_type}</div>
              <h3 className="text-2xl font-bold mt-1">{selectedTemplate.playbook_name}</h3>
              <p className="text-blue-100 mt-2">{selectedTemplate.short_description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span className="text-lg font-semibold">{selectedTemplate.avg_success_rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-blue-100">Difficulty</div>
              <div className="text-lg font-semibold mt-1">{selectedTemplate.difficulty || 'N/A'}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-blue-100">Time Required</div>
              <div className="text-lg font-semibold mt-1">{selectedTemplate.estimated_time_hours || 0}h</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-blue-100">Expected Leads</div>
              <div className="text-lg font-semibold mt-1">{selectedTemplate.expected_leads || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-blue-100">Expected ROI</div>
              <div className="text-lg font-semibold mt-1">{selectedTemplate.expected_roi ? `${selectedTemplate.expected_roi}%` : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Objectives</h4>
            <ul className="space-y-2">
              {selectedTemplate.objectives.map((obj, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Required Resources</h4>
            <ul className="space-y-2">
              {selectedTemplate.required_resources?.map((resource, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selectedTemplate.long_description && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Full Description</h4>
            <p className="text-sm text-gray-600">{selectedTemplate.long_description}</p>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Start Campaign
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Customize Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {templates.map(template => (
        <div
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-900">{template.playbook_name}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {template.playbook_type}
                </span>
                {template.avg_success_rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">{template.avg_success_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{template.short_description}</p>

              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{template.estimated_time_hours || 0}h</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{template.expected_leads || 0} leads</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{template.expected_roi ? `${template.expected_roi}% ROI` : 'ROI varies'}</span>
                </div>
                <div className="text-gray-400">
                  Used {template.times_used} times
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OutreachScriptsTab({
  scripts,
  selectedScript,
  onSelectScript
}: {
  scripts: OutreachScript[];
  selectedScript: OutreachScript | null;
  onSelectScript: (script: OutreachScript | null) => void;
}) {
  if (selectedScript) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSelectScript(null)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to scripts
        </button>

        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6">
          <div className="text-sm font-medium text-green-100">{selectedScript.script_type}</div>
          <h3 className="text-2xl font-bold mt-1">{selectedScript.script_name}</h3>
          <p className="text-green-100 mt-2">{selectedScript.use_case}</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-green-100">Success Rate</div>
              <div className="text-lg font-semibold mt-1">
                {selectedScript.avg_success_rate ? `${(selectedScript.avg_success_rate * 100).toFixed(0)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-green-100">Times Used</div>
              <div className="text-lg font-semibold mt-1">{selectedScript.times_used}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-green-100">Tone</div>
              <div className="text-lg font-semibold mt-1">{selectedScript.tone || 'Professional'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Opening</h4>
            <p className="text-sm text-blue-800">{selectedScript.opening}</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Body</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{selectedScript.body}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Closing</h4>
            <p className="text-sm text-green-800">{selectedScript.closing}</p>
          </div>

          {selectedScript.talking_points && selectedScript.talking_points.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Talking Points</h4>
              <ul className="space-y-2">
                {selectedScript.talking_points.map((point, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedScript.tips && selectedScript.tips.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tips for Success</h4>
              <ul className="space-y-2">
                {selectedScript.tips.map((tip, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Copy Script
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Customize
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {scripts.map(script => (
        <div
          key={script.id}
          onClick={() => onSelectScript(script)}
          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-900">{script.script_name}</h4>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  {script.script_type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{script.use_case}</p>

              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                {script.avg_success_rate && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{(script.avg_success_rate * 100).toFixed(0)}% success</span>
                  </div>
                )}
                <div className="text-gray-400">
                  Used {script.times_used} times
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EngagementChecklistsTab({
  checklists,
  selectedChecklist,
  onSelectChecklist
}: {
  checklists: EngagementChecklist[];
  selectedChecklist: EngagementChecklist | null;
  onSelectChecklist: (checklist: EngagementChecklist | null) => void;
}) {
  if (selectedChecklist) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSelectChecklist(null)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to checklists
        </button>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-6">
          <div className="text-sm font-medium text-purple-100">{selectedChecklist.checklist_type}</div>
          <h3 className="text-2xl font-bold mt-1">{selectedChecklist.checklist_name}</h3>
          {selectedChecklist.description && (
            <p className="text-purple-100 mt-2">{selectedChecklist.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-purple-100">Duration</div>
              <div className="text-lg font-semibold mt-1">{selectedChecklist.total_duration_weeks} weeks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-purple-100">Total Tasks</div>
              <div className="text-lg font-semibold mt-1">{selectedChecklist.tasks.length}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-purple-100">Completion Rate</div>
              <div className="text-lg font-semibold mt-1">
                {selectedChecklist.avg_completion_rate ? `${(selectedChecklist.avg_completion_rate * 100).toFixed(0)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Timeline & Tasks</h4>
          <div className="space-y-2">
            {selectedChecklist.tasks
              .sort((a, b) => a.week - b.week)
              .map((task, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckSquare className={`w-5 h-5 mt-0.5 flex-shrink-0 ${task.critical ? 'text-red-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{task.task}</span>
                      {task.critical && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Week {task.week}</span>
                      {task.owner && <span>Owner: {task.owner}</span>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {selectedChecklist.best_practices && selectedChecklist.best_practices.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
            <ul className="space-y-2">
              {selectedChecklist.best_practices.map((practice, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <Star className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            Start Checklist
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Download PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {checklists.map(checklist => (
        <div
          key={checklist.id}
          onClick={() => onSelectChecklist(checklist)}
          className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-900">{checklist.checklist_name}</h4>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {checklist.checklist_type}
                </span>
              </div>
              {checklist.description && (
                <p className="text-sm text-gray-600 mt-1">{checklist.description}</p>
              )}

              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{checklist.total_duration_weeks} weeks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckSquare className="w-4 h-4" />
                  <span>{checklist.tasks.length} tasks</span>
                </div>
                {checklist.avg_completion_rate && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{(checklist.avg_completion_rate * 100).toFixed(0)}% completion</span>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonalPlansTab({ plans }: { plans: SeasonalDemandPlan[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {plans.map(plan => (
        <div key={plan.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 text-lg">{plan.season} {plan.year}</h4>
              {plan.expected_demand_trend && (
                <p className="text-sm text-gray-600 mt-1">Trend: {plan.expected_demand_trend}</p>
              )}
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>

          {plan.demand_drivers && plan.demand_drivers.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Demand Drivers</h5>
              <div className="flex flex-wrap gap-2">
                {plan.demand_drivers.map((driver, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {driver}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plan.last_year_leads && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">Last Year Leads</div>
                <div className="font-semibold text-gray-900">{plan.last_year_leads}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">Conversion</div>
                <div className="font-semibold text-gray-900">
                  {plan.last_year_conversion_rate ? `${(plan.last_year_conversion_rate * 100).toFixed(0)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">Revenue</div>
                <div className="font-semibold text-gray-900">
                  {plan.last_year_revenue ? `$${(plan.last_year_revenue / 1000).toFixed(0)}k` : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {plan.recommended_playbooks && plan.recommended_playbooks.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Playbooks</h5>
              <ul className="space-y-1">
                {plan.recommended_playbooks.map((playbook, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center space-x-2">
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    <span>{playbook}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500">Recommended Hours</div>
              <div className="font-medium text-gray-900">{plan.recommended_clinician_hours || 0}h</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Marketing Budget</div>
              <div className="font-medium text-gray-900">
                ${plan.recommended_marketing_budget ? (plan.recommended_marketing_budget / 1000).toFixed(0) + 'k' : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveExecutionsTab({ executions }: { executions: any[] }) {
  return (
    <div className="space-y-4">
      {executions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No active playbook executions</p>
        </div>
      ) : (
        executions.map(execution => (
          <div key={execution.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{execution.execution_name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    execution.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {execution.status.replace('_', ' ')}
                  </span>
                </div>
                {execution.playbook && (
                  <p className="text-sm text-gray-600">Playbook: {execution.playbook.playbook_name}</p>
                )}
                {execution.owner && (
                  <p className="text-sm text-gray-500 mt-1">Owner: {execution.owner.display_name}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{execution.completion_percentage}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${execution.completion_percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-purple-50 rounded p-3">
                <div className="text-xs text-purple-600 font-medium">Leads Generated</div>
                <div className="text-lg font-bold text-purple-900 mt-1">{execution.leads_generated}</div>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="text-xs text-green-600 font-medium">Appointments</div>
                <div className="text-lg font-bold text-green-900 mt-1">{execution.appointments_booked}</div>
              </div>
              <div className="bg-amber-50 rounded p-3">
                <div className="text-xs text-amber-600 font-medium">Revenue</div>
                <div className="text-lg font-bold text-amber-900 mt-1">${(execution.revenue_generated / 1000).toFixed(1)}k</div>
              </div>
              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-blue-600 font-medium">Tasks</div>
                <div className="text-lg font-bold text-blue-900 mt-1">
                  {execution.tasks_completed}/{execution.tasks_total}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
              <div>
                <span className="font-medium">Started:</span> {new Date(execution.start_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Target End:</span> {new Date(execution.planned_end_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
