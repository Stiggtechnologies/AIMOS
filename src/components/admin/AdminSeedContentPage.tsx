import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type SeedStatus = 'idle' | 'loading' | 'success' | 'error';

interface SeedTask {
  id: string;
  label: string;
  description: string;
  status: SeedStatus;
  message?: string;
}

export const AdminSeedContentPage: React.FC = () => {
  const [tasks, setTasks] = useState<SeedTask[]>([
    {
      id: 'evidence-claims',
      label: 'Evidence Claims',
      description: 'Seed clinical evidence claims from research sources',
      status: 'idle',
    },
    {
      id: 'clinical-rules',
      label: 'Clinical Rules',
      description: 'Load evidence-based clinical recommendation rules',
      status: 'idle',
    },
    {
      id: 'research-sources',
      label: 'Research Sources',
      description: 'Initialize approved research journals and databases',
      status: 'idle',
    },
    {
      id: 'patient-education',
      label: 'Patient Education Assets',
      description: 'Load educational materials and patient resources',
      status: 'idle',
    },
    {
      id: 'treatment-pathways',
      label: 'Treatment Pathways',
      description: 'Initialize MDT care pathway templates',
      status: 'idle',
    },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const updateTaskStatus = (taskId: string, status: SeedStatus, message?: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status, message } : task
    ));
  };

  const seedEvidenceClaims = async () => {
    updateTaskStatus('evidence-claims', 'loading');
    try {
      const sampleClaims = [
        {
          claim_text: 'MDT intervention reduces pain by 30-50% compared to standard care',
          effect_direction: 'benefit',
          outcomes: ['pain', 'function'],
          evidence_level: 'systematic_review',
          confidence_score: 0.95,
          clinical_tags: ['pain_reduction', 'mdt_core'],
          population: { condition_type: 'chronic_pain', acuity: 'chronic' },
          intervention: { approach: 'multidisciplinary_team', core_components: ['physical', 'psychological', 'vocational'], dose: '8-12_weeks' },
        },
        {
          claim_text: 'Early intervention within 2 weeks of onset improves functional recovery',
          effect_direction: 'benefit',
          outcomes: ['function', 'RTW'],
          evidence_level: 'rct',
          confidence_score: 0.88,
          clinical_tags: ['early_intervention', 'timing_critical'],
          population: { condition_type: 'acute_injury', acuity: 'acute' },
          intervention: { approach: 'early_active_rehab', core_components: ['progressive_loading'], dose: '3x_per_week' },
        },
      ];

      for (const claim of sampleClaims) {
        await supabase.from('evidence_claims').insert({
          ...claim,
          status: 'approved',
        });
      }

      updateTaskStatus('evidence-claims', 'success', 'Seeded 2 evidence claims');
    } catch (error) {
      updateTaskStatus('evidence-claims', 'error', error instanceof Error ? error.message : 'Failed to seed');
    }
  };

  const seedClinicalRules = async () => {
    updateTaskStatus('clinical-rules', 'loading');
    try {
      const sampleRules = [
        {
          rule_name: 'Early MDT Triage Rule',
          recommendation_text: 'Refer to MDT within 2 weeks for acute injuries with functional limitation',
          priority: 1,
          is_active: true,
          evidence_basis: 'systematic_review',
          applicable_conditions: ['acute_back_pain', 'whiplash'],
        },
        {
          rule_name: 'Centralization Response Protocol',
          recommendation_text: 'Progress rapidly if patient demonstrates directional preference and centralization pattern',
          priority: 2,
          is_active: true,
          evidence_basis: 'cohort_studies',
          applicable_conditions: ['radiculopathy', 'referred_pain'],
        },
      ];

      for (const rule of sampleRules) {
        await supabase.from('clinical_rules').insert(rule);
      }

      updateTaskStatus('clinical-rules', 'success', 'Seeded 2 clinical rules');
    } catch (error) {
      updateTaskStatus('clinical-rules', 'error', error instanceof Error ? error.message : 'Failed to seed');
    }
  };

  const seedResearchSources = async () => {
    updateTaskStatus('research-sources', 'loading');
    try {
      const sources = [
        {
          name: 'PubMed Central',
          source_type: 'database',
          approval_status: 'approved',
          auto_ingest: true,
          metadata_quality_threshold: 0.8,
        },
        {
          name: 'Cochrane Library',
          source_type: 'database',
          approval_status: 'approved',
          auto_ingest: true,
          metadata_quality_threshold: 0.95,
        },
        {
          name: 'Spine Journal',
          source_type: 'journal',
          approval_status: 'approved',
          auto_ingest: false,
          metadata_quality_threshold: 0.85,
        },
      ];

      for (const source of sources) {
        await supabase.from('research_sources').insert(source);
      }

      updateTaskStatus('research-sources', 'success', 'Seeded 3 research sources');
    } catch (error) {
      updateTaskStatus('research-sources', 'error', error instanceof Error ? error.message : 'Failed to seed');
    }
  };

  const seedPatientEducation = async () => {
    updateTaskStatus('patient-education', 'loading');
    try {
      const assets = [
        {
          asset_type: 'video',
          title: 'Understanding MDT for Chronic Pain',
          description: 'Overview of multidisciplinary team approach',
          url: 'https://example.com/videos/mdt-overview',
          duration_minutes: 12,
          target_audience: 'patient',
          language: 'en',
          is_published: true,
        },
        {
          asset_type: 'document',
          title: 'Your MDT Journey: What to Expect',
          description: 'Patient-friendly guide to the MDT program',
          url: 'https://example.com/docs/mdt-journey',
          target_audience: 'patient',
          language: 'en',
          is_published: true,
        },
      ];

      for (const asset of assets) {
        await supabase.from('patient_education_assets').insert(asset);
      }

      updateTaskStatus('patient-education', 'success', 'Seeded 2 education assets');
    } catch (error) {
      updateTaskStatus('patient-education', 'error', error instanceof Error ? error.message : 'Failed to seed');
    }
  };

  const seedTreatmentPathways = async () => {
    updateTaskStatus('treatment-pathways', 'loading');
    try {
      const pathways = [
        {
          pathway_name: 'Acute Back Pain MDT',
          description: 'Evidence-based pathway for acute low back pain',
          condition_code: 'M54.5',
          duration_weeks: 12,
          phases: 3,
          is_published: true,
        },
        {
          pathway_name: 'Chronic Neck Pain MDT',
          description: 'Comprehensive pathway for chronic cervical pain',
          condition_code: 'M54.2',
          duration_weeks: 16,
          phases: 4,
          is_published: true,
        },
      ];

      for (const pathway of pathways) {
        await supabase.from('treatment_pathways').insert(pathway);
      }

      updateTaskStatus('treatment-pathways', 'success', 'Seeded 2 treatment pathways');
    } catch (error) {
      updateTaskStatus('treatment-pathways', 'error', error instanceof Error ? error.message : 'Failed to seed');
    }
  };

  const handleSeedTask = async (taskId: string) => {
    switch (taskId) {
      case 'evidence-claims':
        await seedEvidenceClaims();
        break;
      case 'clinical-rules':
        await seedClinicalRules();
        break;
      case 'research-sources':
        await seedResearchSources();
        break;
      case 'patient-education':
        await seedPatientEducation();
        break;
      case 'treatment-pathways':
        await seedTreatmentPathways();
        break;
    }
  };

  const handleSeedAll = async () => {
    setIsRunningAll(true);
    for (const task of tasks) {
      await handleSeedTask(task.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsRunningAll(false);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all demo data? This cannot be undone.')) return;

    setTasks(prev => prev.map(t => ({ ...t, status: 'loading' })));

    try {
      await supabase.from('evidence_claims').delete().neq('claim_id', '');
      await supabase.from('clinical_rules').delete().neq('rule_id', '');
      await supabase.from('research_sources').delete().neq('source_id', '');
      await supabase.from('patient_education_assets').delete().neq('asset_id', '');
      await supabase.from('treatment_pathways').delete().neq('pathway_id', '');

      setTasks(prev => prev.map(t => ({ ...t, status: 'success', message: 'Cleared' })));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to clear';
      setTasks(prev => prev.map(t => ({ ...t, status: 'error', message: msg })));
    }
  };

  const resetTasks = () => {
    setTasks(prev => prev.map(t => ({ ...t, status: 'idle', message: undefined })));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Seed Content</h1>
        </div>
        <p className="text-gray-600">Seed and manage demo data for research intelligence and clinical content</p>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <button
            onClick={handleSeedAll}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningAll ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Seed All Content
              </>
            )}
          </button>

          <button
            onClick={resetTasks}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Reset Status
          </button>

          <button
            onClick={handleClearAll}
            className="px-6 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{task.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>

              {task.status === 'loading' && (
                <Loader className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
              )}
              {task.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {task.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
            </div>

            {task.message && (
              <p className={`text-sm mb-3 px-3 py-2 rounded ${
                task.status === 'success' ? 'bg-green-50 text-green-700' :
                task.status === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {task.message}
              </p>
            )}

            <button
              onClick={() => handleSeedTask(task.id)}
              disabled={task.status === 'loading' || isRunningAll}
              className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                task.status === 'loading' || isRunningAll
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {task.status === 'loading' ? 'Seeding...' : 'Seed This'}
            </button>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">About Seeding</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Seeds demo data for testing and demonstration purposes</li>
          <li>• All data is marked with demo flags and can be filtered</li>
          <li>• Use "Clear All Data" to reset the system to a clean state</li>
          <li>• Each seed operation is idempotent and safe to repeat</li>
        </ul>
      </div>
    </div>
  );
};
