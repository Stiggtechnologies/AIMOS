import React, { useState } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Target,
  Users,
  FileText,
  Calendar,
  Award
} from 'lucide-react';

interface Competency {
  id: string;
  text: string;
  completed: boolean;
}

interface Milestone {
  id: string;
  role_code: string;
  role_name: string;
  milestone_day: number;
  milestone_name: string;
  description: string;
  competencies: Competency[];
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date: string;
  completed_date?: string;
  sign_off_by?: string;
}

interface RoleMilestoneData {
  role_code: string;
  role_name: string;
  milestones: Milestone[];
}

// Mock data
const roleMilestones: RoleMilestoneData[] = [
  {
    role_code: 'PT',
    role_name: 'Physiotherapist',
    milestones: [
      {
        id: '1',
        role_code: 'PT',
        milestone_day: 30,
        milestone_name: 'Safe with Supervision',
        description: 'Can perform routine duties with support',
        competencies: [
          { id: '1', text: 'Charting meets standards', completed: true },
          { id: '2', text: 'Understands consent process', completed: true },
          { id: '3', text: 'Follows care pathways', completed: false },
          { id: '4', text: 'Privacy compliant', completed: true },
          { id: '5', text: 'IPC awareness demonstrated', completed: false }
        ],
        status: 'In Progress',
        due_date: '2026-04-15',
        sign_off_by: 'Clinical Director'
      },
      {
        id: '2',
        role_code: 'PT',
        milestone_day: 60,
        milestone_name: 'Increasing Autonomy',
        description: 'Can manage normal caseload with moderate oversight',
        competencies: [
          { id: '1', text: 'Independent documentation', completed: false },
          { id: '2', text: 'Appropriate escalation', completed: false },
          { id: '3', text: 'Handles common presentations', completed: false },
          { id: '4', text: 'Utilization meeting targets', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-05-15',
        sign_off_by: 'Clinical Director'
      },
      {
        id: '3',
        role_code: 'PT',
        milestone_day: 90,
        milestone_name: 'Fully Integrated',
        description: 'Independent practice, meets KPIs',
        competencies: [
          { id: '1', text: 'Normal caseload independent', completed: false },
          { id: '2', text: 'Documentation audit pass', completed: false },
          { id: '3', text: 'Patient experience good', completed: false },
          { id: '4', text: 'Billing accurate', completed: false },
          { id: '5', text: 'Met all productivity targets', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-06-14',
        sign_off_by: 'Clinic Manager'
      }
    ]
  },
  {
    role_code: 'CLINIC_MGR',
    role_name: 'Clinic Manager',
    milestones: [
      {
        id: '4',
        role_code: 'CLINIC_MGR',
        milestone_day: 30,
        milestone_name: 'Managing Daily Flow',
        description: 'Runs clinic with support',
        competencies: [
          { id: '1', text: 'Opening/closing procedures mastered', completed: true },
          { id: '2', text: 'Daily huddles running', completed: true },
          { id: '3', text: 'Staff scheduling understood', completed: false },
          { id: '4', text: 'Basic KPI dashboard reading', completed: false }
        ],
        status: 'In Progress',
        due_date: '2026-04-20',
        sign_off_by: 'Regional Manager'
      },
      {
        id: '5',
        role_code: 'CLINIC_MGR',
        milestone_day: 60,
        milestone_name: 'Independent Management',
        description: 'Manages clinic independently',
        competencies: [
          { id: '1', text: 'Full scheduling autonomy', completed: false },
          { id: '2', text: 'Staff coaching started', completed: false },
          { id: '3', text: 'Incident management', completed: false },
          { id: '4', text: 'Budget awareness', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-05-20',
        sign_off_by: 'Regional Manager'
      },
      {
        id: '6',
        role_code: 'CLINIC_MGR',
        milestone_day: 90,
        milestone_name: 'KPI Ownership',
        description: 'Owns KPI cadence, coaching, escalation',
        competencies: [
          { id: '1', text: 'Full P&L awareness', completed: false },
          { id: '2', text: 'Staff performance management', completed: false },
          { id: '3', text: 'Quality/audit ownership', completed: false },
          { id: '4', text: 'Escalation mastery', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-06-19',
        sign_off_by: 'Director of Operations'
      }
    ]
  },
  {
    role_code: 'FRONT_DESK',
    role_name: 'Front Desk / Patient Coordinator',
    milestones: [
      {
        id: '7',
        role_code: 'FRONT_DESK',
        milestone_day: 30,
        milestone_name: 'Safe and Functional',
        description: 'Accurate in routine workflows',
        competencies: [
          { id: '1', text: 'Booking flow independent', completed: true },
          { id: '2', text: 'Complete intake data', completed: true },
          { id: '3', text: 'Privacy consistent', completed: false },
          { id: '4', text: 'Payment accurate', completed: false }
        ],
        status: 'In Progress',
        due_date: '2026-04-10',
        sign_off_by: 'Clinic Manager'
      },
      {
        id: '8',
        role_code: 'FRONT_DESK',
        milestone_day: 60,
        milestone_name: 'Strong Performer',
        description: 'Handles exceptions well',
        competencies: [
          { id: '1', text: 'Manages upset patients', completed: false },
          { id: '2', text: 'Complex scheduling', completed: false },
          { id: '3', text: 'Insurance questions', completed: false },
          { id: '4', text: 'Service recovery', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-05-10',
        sign_off_by: 'Clinic Manager'
      },
      {
        id: '9',
        role_code: 'FRONT_DESK',
        milestone_day: 90,
        milestone_name: 'Fully Independent',
        description: 'Owns front desk metrics',
        competencies: [
          { id: '1', text: 'Conversion rate targets met', completed: false },
          { id: '2', text: 'Collection rate targets met', completed: false },
          { id: '3', text: 'Patient satisfaction scores good', completed: false },
          { id: '4', text: 'Can train new hires', completed: false }
        ],
        status: 'Pending',
        due_date: '2026-06-09',
        sign_off_by: 'Clinic Manager'
      }
    ]
  }
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

export const MilestonesView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const filteredData = selectedRole === 'all' 
    ? roleMilestones 
    : roleMilestones.filter(r => r.role_code === selectedRole);

  const getProgress = (competencies: Competency[]) => {
    const completed = competencies.filter(c => c.completed).length;
    return Math.round((completed / competencies.length) * 100);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          30-60-90 Day Onboarding
        </h1>
        <p className="text-gray-600">Track competency milestones during your onboarding journey</p>
      </div>

      {/* Role Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by role:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedRole === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Roles
          </button>
          {roleMilestones.map(role => (
            <button
              key={role.role_code}
              onClick={() => setSelectedRole(role.role_code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role.role_code
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {role.role_name}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {filteredData.map(roleData => (
          <div key={roleData.role_code} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{roleData.role_name}</h2>
                  <p className="text-sm text-gray-500">{roleData.milestones.length} milestones</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {roleData.milestones.filter(m => m.status === 'Completed').length}
                    </p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {roleData.milestones.filter(m => m.status === 'In Progress').length}
                    </p>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">
                      {roleData.milestones.filter(m => m.status === 'Pending').length}
                    </p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {roleData.milestones.map((milestone, idx) => {
                const progress = getProgress(milestone.competencies);
                const isExpanded = expandedMilestone === milestone.id;

                return (
                  <div key={milestone.id} className="p-4">
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                          ${milestone.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                            milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 
                            'bg-gray-100 text-gray-600'}
                        `}>
                          {milestone.milestone_day}
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{milestone.milestone_name}</h3>
                          <p className="text-sm text-gray-500">{milestone.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                milestone.status === 'Completed' ? 'bg-green-500' : 
                                milestone.status === 'In Progress' ? 'bg-blue-500' : 
                                'bg-gray-300'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
                        </div>
                        <StatusBadge status={milestone.status} />
                        <ChevronRight 
                          size={20} 
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-14">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} />
                              <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                              {milestone.completed_date && (
                                <>
                                  <CheckCircle size={14} className="text-green-500" />
                                  <span className="text-green-600">
                                    Completed: {new Date(milestone.completed_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                            {milestone.sign_off_by && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award size={14} />
                                <span>Sign-off: {milestone.sign_off_by}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">Competencies:</p>
                            {milestone.competencies.map(comp => (
                              <div key={comp.id} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  comp.completed ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {comp.completed && <CheckCircle size={12} className="text-white" />}
                                </div>
                                <span className={comp.completed ? 'text-gray-700' : 'text-gray-500'}>
                                  {comp.text}
                                </span>
                              </div>
                            ))}
                          </div>

                          {milestone.status !== 'Completed' && (
                            <div className="mt-4 flex justify-end">
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                                Request Sign-off
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No milestone data for this role</p>
        </div>
      )}
    </div>
  );
};

export default MilestonesView;
