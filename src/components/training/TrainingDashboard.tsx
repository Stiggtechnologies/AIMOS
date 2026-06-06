import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Award,
  FileText,
  Play,
  BarChart3,
  Calendar,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

// Types
interface TrainingModule {
  id: string;
  module_code: string;
  module_name: string;
  description: string;
  training_category: string;
  delivery_method: string;
  duration_hours: number;
  is_required: boolean;
  assessment_type: string;
}

interface TrainingEnrollment {
  id: string;
  module_id: string;
  module_name: string;
  module_code: string;
  training_category: string;
  due_date: string;
  completed_date: string | null;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  assessment_score: number | null;
}

interface CompetencyMilestone {
  id: string;
  milestone_day: number;
  milestone_name: string;
  description: string;
  competencies: string[];
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface TrainingStats {
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  upcomingDue: number;
  avgScore: number;
}

// Mock data - replace with API calls
const mockModules: TrainingModule[] = [
  {
    id: '1',
    module_code: 'CORE001',
    module_name: 'AIM Mission, Values & Culture',
    description: 'Company story, patient promise, growth plan',
    training_category: 'Welcome to AIM',
    delivery_method: 'Live',
    duration_hours: 2,
    is_required: true,
    assessment_type: 'Attendance'
  },
  {
    id: '2',
    module_code: 'CORE003',
    module_name: 'Privacy & Confidentiality Basics',
    description: 'PIPA, HIA, need-to-know, breach reporting',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS',
    duration_hours: 1.5,
    is_required: true,
    assessment_type: 'Quiz'
  },
  {
    id: '3',
    module_code: 'CORE004',
    module_name: 'Alberta OHS Orientation',
    description: 'Worker rights, hazard awareness, safe work',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'Live',
    duration_hours: 2,
    is_required: true,
    assessment_type: 'Checklist'
  },
  {
    id: '4',
    module_code: 'CORE007',
    module_name: 'Infection Prevention & Control',
    description: 'Hand hygiene, cleaning, PPE, blood exposure',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS + Demo',
    duration_hours: 2,
    is_required: true,
    assessment_type: 'Demo'
  },
  {
    id: '5',
    module_code: 'CORE008',
    module_name: 'Cybersecurity & System Access',
    description: 'Passwords, MFA, phishing, device security',
    training_category: 'Digital Operations',
    delivery_method: 'LMS',
    duration_hours: 1,
    is_required: true,
    assessment_type: 'Quiz'
  }
];

const mockEnrollments: TrainingEnrollment[] = [
  {
    id: '1',
    module_id: '1',
    module_name: 'AIM Mission, Values & Culture',
    module_code: 'CORE001',
    training_category: 'Welcome to AIM',
    due_date: '2026-03-25',
    completed_date: '2026-03-20',
    status: 'Completed',
    assessment_score: 100
  },
  {
    id: '2',
    module_id: '2',
    module_name: 'Privacy & Confidentiality Basics',
    module_code: 'CORE003',
    training_category: 'Safe Practice & Compliance',
    due_date: '2026-03-28',
    completed_date: null,
    status: 'In Progress',
    assessment_score: null
  },
  {
    id: '3',
    module_id: '3',
    module_name: 'Alberta OHS Orientation',
    module_code: 'CORE004',
    training_category: 'Safe Practice & Compliance',
    due_date: '2026-03-30',
    completed_date: null,
    status: 'Not Started',
    assessment_score: null
  },
  {
    id: '4',
    module_id: '4',
    module_name: 'Infection Prevention & Control',
    module_code: 'CORE007',
    training_category: 'Safe Practice & Compliance',
    due_date: '2026-04-01',
    completed_date: null,
    status: 'Not Started',
    assessment_score: null
  },
  {
    id: '5',
    module_id: '5',
    module_name: 'Cybersecurity & System Access',
    module_code: 'CORE008',
    training_category: 'Digital Operations',
    due_date: '2026-03-15',
    completed_date: null,
    status: 'Overdue',
    assessment_score: null
  }
];

const mockMilestones: CompetencyMilestone[] = [
  {
    id: '1',
    milestone_day: 30,
    milestone_name: 'Safe with Supervision',
    description: 'Can perform routine duties with support',
    competencies: ['Charting meets standards', 'Understands consent process', 'Follows care pathways'],
    status: 'In Progress'
  },
  {
    id: '2',
    milestone_day: 60,
    milestone_name: 'Increasing Autonomy',
    description: 'Can manage normal caseload with moderate oversight',
    competencies: ['Independent documentation', 'Appropriate escalation', 'Handles common presentations'],
    status: 'Pending'
  },
  {
    id: '3',
    milestone_day: 90,
    milestone_name: 'Fully Integrated',
    description: 'Independent practice, meets KPIs',
    competencies: ['Normal caseload independent', 'Documentation audit pass', 'Patient experience good'],
    status: 'Pending'
  }
];

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="text-2xl" style={{ color }}>{icon}</div>
    </div>
  </div>
);

// Status Badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Not Started': 'bg-gray-100 text-gray-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles['Not Started']}`}>
      {status}
    </span>
  );
};

// Module Card
const ModuleCard: React.FC<{
  module: TrainingEnrollment;
  onStart?: () => void;
}> = ({ module, onStart }) => {
  const getActionButton = () => {
    if (module.status === 'Completed') {
      return (
        <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
          <Award size={16} />
          View Certificate
        </button>
      );
    }
    if (module.status === 'Overdue') {
      return (
        <button 
          onClick={onStart}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <AlertTriangle size={16} />
          Complete Now
        </button>
      );
    }
    return (
      <button 
        onClick={onStart}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Play size={16} />
        {module.status === 'In Progress' ? 'Continue' : 'Start'}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-mono text-gray-500">{module.module_code}</span>
          <h3 className="font-medium text-gray-900">{module.module_name}</h3>
          <p className="text-sm text-gray-500">{module.training_category}</p>
        </div>
        <StatusBadge status={module.status} />
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            Due: {new Date(module.due_date).toLocaleDateString()}
          </span>
          {module.completed_date && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} />
              Completed: {new Date(module.completed_date).toLocaleDateString()}
            </span>
          )}
          {module.assessment_score !== null && (
            <span className="flex items-center gap-1">
              <BarChart3 size={14} />
              Score: {module.assessment_score}%
            </span>
          )}
        </div>
        {getActionButton()}
      </div>
    </div>
  );
};

// Competency Milestone Card
const MilestoneCard: React.FC<{
  milestone: CompetencyMilestone;
}> = ({ milestone }) => {
  const progressMap: Record<string, number> = {
    'Completed': 100,
    'In Progress': 50,
    'Pending': 0
  };
  
  const colorMap: Record<string, string> = {
    'Completed': 'bg-green-500',
    'In Progress': 'bg-blue-500',
    'Pending': 'bg-gray-300'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
            Day {milestone.milestone_day}
          </span>
          <h3 className="font-semibold text-gray-900">{milestone.milestone_name}</h3>
        </div>
        <StatusBadge status={milestone.status} />
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
      
      <div className="space-y-2">
        {milestone.competencies.map((comp, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${milestone.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={milestone.status === 'Completed' ? 'text-gray-700' : 'text-gray-500'}>
              {comp}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorMap[milestone.status]} transition-all`}
            style={{ width: `${progressMap[milestone.status]}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export const TrainingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-training' | 'academies' | 'milestones' | 'admin'>('my-training');
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  
  // Filter enrollments
  const filteredEnrollments = mockEnrollments.filter(enrollment => {
    if (filter !== 'all' && enrollment.status !== filter) return false;
    if (search && !enrollment.module_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  
  // Calculate stats
  const stats: TrainingStats = {
    totalAssigned: mockEnrollments.length,
    completed: mockEnrollments.filter(e => e.status === 'Completed').length,
    inProgress: mockEnrollments.filter(e => e.status === 'In Progress').length,
    overdue: mockEnrollments.filter(e => e.status === 'Overdue').length,
    upcomingDue: mockEnrollments.filter(e => e.status === 'Not Started').length,
    avgScore: 92
  };

  const completionRate = Math.round((stats.completed / stats.totalAssigned) * 100);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          AIM Training University
        </h1>
        <p className="text-gray-600">Complete your training to be fully onboarded</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard 
          title="Total Assigned" 
          value={stats.totalAssigned} 
          icon={<FileText size={20} />}
          color="#3B82F6"
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          icon={<CheckCircle size={20} />}
          color="#22C55E"
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={<Clock size={20} />}
          color="#3B82F6"
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdue} 
          icon={<AlertTriangle size={20} />}
          color="#EF4444"
        />
        <StatCard 
          title="Upcoming" 
          value={stats.upcomingDue} 
          icon={<Calendar size={20} />}
          color="#F59E0B"
        />
        <StatCard 
          title="Completion" 
          value={`${completionRate}%`} 
          subtitle="of assigned training"
          icon={<TrendingUp size={20} />}
          color="#8B5CF6"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'my-training', label: 'My Training', icon: BookOpen },
              { id: 'academies', label: 'Training Academies', icon: Award },
              { id: 'milestones', label: '30-60-90 Days', icon: TrendingUp },
              { id: 'admin', label: 'Admin', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'my-training' && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Module List */}
              <div className="space-y-3">
                {filteredEnrollments.map(module => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>

              {filteredEnrollments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No training modules found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'academies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Welcome to AIM', desc: 'Company orientation and culture', courses: 3, color: 'bg-blue-50 border-blue-200' },
                { name: 'Safe Practice & Compliance', desc: 'Privacy, OHS, infection control', courses: 8, color: 'bg-green-50 border-green-200' },
                { name: 'Clinical Excellence', desc: 'Clinical skills and documentation', courses: 12, color: 'bg-purple-50 border-purple-200' },
                { name: 'Patient Access & Revenue', desc: 'Front desk, billing, intake', courses: 10, color: 'bg-orange-50 border-orange-200' },
                { name: 'Leadership Academy', desc: 'Management and governance', courses: 8, color: 'bg-indigo-50 border-indigo-200' },
                { name: 'Digital Operations', desc: 'AIM OS, EMR, systems', courses: 5, color: 'bg-cyan-50 border-cyan-200' },
                { name: 'Specialty Pathways', desc: 'Concussion, pelvic health, pediatrics', courses: 6, color: 'bg-pink-50 border-pink-200' }
              ].map((academy, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${academy.color} hover:shadow-md transition-shadow cursor-pointer`}>
                  <h3 className="font-semibold text-gray-900 mb-1">{academy.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{academy.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{academy.courses} modules</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your 30-60-90 Day Journey</h2>
                <p className="text-gray-600">Track your progress through onboarding milestones</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockMilestones.map(milestone => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Training Administration</h2>
              <p className="text-gray-600 mb-4">Manage training assignments, track compliance, and generate reports</p>
              <div className="flex justify-center gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View All Enrollments
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Generate Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
