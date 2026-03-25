import React, { useState } from 'react';
import { 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle, 
  Play,
  ChevronRight,
  Search,
  Filter,
  GraduationCap,
  Shield,
  Stethoscope,
  Users,
  Monitor,
  Activity
} from 'lucide-react';

interface Academy {
  id: string;
  academy_code: string;
  academy_name: string;
  description: string;
  target_audience: string;
  module_count: number;
  is_required: boolean;
  color: string;
  icon: React.ReactNode;
}

interface Module {
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

// Mock academies data
const academies: Academy[] = [
  {
    id: '1',
    academy_code: 'SCHOOL1',
    academy_name: 'Welcome to AIM',
    description: 'Company orientation, culture, service standards, and org structure',
    target_audience: 'All employees and contractors',
    module_count: 3,
    is_required: true,
    color: 'blue',
    icon: <GraduationCap size={24} />
  },
  {
    id: '2',
    academy_code: 'SCHOOL2',
    academy_name: 'Safe Practice & Compliance',
    description: 'Privacy, OHS, infection control, boundaries, emergency response',
    target_audience: 'All employees',
    module_count: 8,
    is_required: true,
    color: 'green',
    icon: <Shield size={24} />
  },
  {
    id: '3',
    academy_code: 'SCHOOL3',
    academy_name: 'Clinical Excellence',
    description: 'Clinical skills, documentation, care pathways, outcome measures',
    target_audience: 'Clinicians and clinical support',
    module_count: 12,
    is_required: true,
    color: 'purple',
    icon: <Stethoscope size={24} />
  },
  {
    id: '4',
    academy_code: 'SCHOOL4',
    academy_name: 'Patient Access & Revenue',
    description: 'Front desk, intake, billing, call center, patient experience',
    target_audience: 'Operations staff',
    module_count: 10,
    is_required: true,
    color: 'orange',
    icon: <Users size={24} />
  },
  {
    id: '5',
    academy_code: 'SCHOOL5',
    academy_name: 'Leadership Academy',
    description: 'Management, KPI dashboards, coaching, audits, incident response',
    target_audience: 'Managers and directors',
    module_count: 8,
    is_required: true,
    color: 'indigo',
    icon: <Award size={24} />
  },
  {
    id: '6',
    academy_code: 'SCHOOL6',
    academy_name: 'Digital Operations',
    description: 'AIM OS, EMR, scheduling, reporting, cybersecurity',
    target_audience: 'All system users',
    module_count: 5,
    is_required: true,
    color: 'cyan',
    icon: <Monitor size={24} />
  },
  {
    id: '7',
    academy_code: 'SCHOOL7',
    academy_name: 'Specialty Pathways',
    description: 'Concussion, vestibular, pelvic health, chronic pain, sports, pediatrics',
    target_audience: 'Specialist clinicians',
    module_count: 6,
    is_required: false,
    color: 'pink',
    icon: <Activity size={24} />
  }
];

// Mock modules for School 2 (Safe Practice & Compliance)
const sampleModules: Module[] = [
  {
    id: '1',
    module_code: 'CORE003',
    module_name: 'Privacy & Confidentiality Basics',
    description: 'PIPA, HIA, need-to-know, breach reporting, verbal/screen/document privacy',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS',
    duration_hours: 1.5,
    is_required: true,
    assessment_type: 'Quiz (80% to pass)'
  },
  {
    id: '2',
    module_code: 'CORE004',
    module_name: 'Alberta OHS Orientation',
    description: 'Worker rights, hazard awareness, safe work practices, incident reporting',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'Live',
    duration_hours: 2,
    is_required: true,
    assessment_type: 'Checklist sign-off'
  },
  {
    id: '3',
    module_code: 'CORE005',
    module_name: 'Workplace Violence & Harassment',
    description: 'Prevention, recognition, reporting, response procedures',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS + Scenario',
    duration_hours: 1,
    is_required: true,
    assessment_type: 'Quiz + Scenario'
  },
  {
    id: '4',
    module_code: 'CORE006',
    module_name: 'Emergency Procedures',
    description: 'Fire, evacuation, medical emergencies, code responses, muster points',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'Live + Drill',
    duration_hours: 1.5,
    is_required: true,
    assessment_type: 'Drill participation'
  },
  {
    id: '5',
    module_code: 'CORE007',
    module_name: 'Infection Prevention & Control',
    description: 'Hand hygiene, cleaning, PPE, blood/body fluid exposure response',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS + Demo',
    duration_hours: 2,
    is_required: true,
    assessment_type: 'Observed demo'
  },
  {
    id: '6',
    module_code: 'CORE012',
    module_name: 'Professional Boundaries',
    description: 'Gifts, social media, chaperones, conflicts of interest',
    training_category: 'Safe Practice & Compliance',
    delivery_method: 'LMS',
    duration_hours: 1,
    is_required: true,
    assessment_type: 'Quiz (80% to pass)'
  }
];

const colorMap: Record<string, { bg: string; border: string; text: string; light: string }> = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
  green: { bg: 'bg-green-600', border: 'border-green-600', text: 'text-green-600', light: 'bg-green-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-600', text: 'text-orange-600', light: 'bg-orange-50' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50' },
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-600', text: 'text-pink-600', light: 'bg-pink-50' }
};

export const TrainingAcademiesView: React.FC = () => {
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAcademies = academies.filter(academy =>
    academy.academy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academy.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="text-purple-600" />
          AIM Training University
        </h1>
        <p className="text-gray-600">Explore training academies and modules</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search academies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedAcademy && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setSelectedAcademy(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            All Academies
          </button>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{selectedAcademy.academy_name}</span>
        </div>
      )}

      {/* Academy Cards */}
      {!selectedAcademy ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAcademies.map((academy) => {
            const colors = colorMap[academy.color];
            return (
              <button
                key={academy.id}
                onClick={() => setSelectedAcademy(academy)}
                className={`p-5 rounded-lg border-2 ${colors.light} ${colors.border} hover:shadow-lg transition-all text-left`}
              >
                <div className={`w-12 h-12 rounded-lg ${colors.bg} text-white flex items-center justify-center mb-3`}>
                  {academy.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{academy.academy_name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{academy.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {academy.module_count} modules
                  </span>
                  {academy.is_required && (
                    <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} text-white`}>
                      Required
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Modules for selected academy */
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${colorMap[selectedAcademy.color].bg} text-white flex items-center justify-center`}>
                {selectedAcademy.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedAcademy.academy_name}</h2>
                <p className="text-sm text-gray-600">{selectedAcademy.description}</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sampleModules.map((module) => (
              <div key={module.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{module.module_code}</span>
                      {module.is_required && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">{module.module_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                      <Play size={14} />
                      Start
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {module.duration_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {module.delivery_method}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    {module.assessment_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredAcademies.length === 0 && (
        <div className="text-center py-12">
          <Award size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No academies found matching your search</p>
        </div>
      )}
    </div>
  );
};

export default TrainingAcademiesView;
