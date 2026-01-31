import React, { useEffect, useState } from 'react';
import { ChevronDown, Shield, Globe, Calendar } from 'lucide-react';
import {
  evidenceAuthorityService,
  ClinicalDomain,
  EvidenceAuthority
} from '../../services/evidenceAuthorityService';

interface DomainSwitcherProps {
  selectedDomain: ClinicalDomain | null;
  onDomainChange: (domain: ClinicalDomain) => void;
  showAuthorities?: boolean;
  className?: string;
}

export function DomainSwitcher({
  selectedDomain,
  onDomainChange,
  showAuthorities = true,
  className = ''
}: DomainSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authorities, setAuthorities] = useState<EvidenceAuthority[]>([]);
  const [loading, setLoading] = useState(false);

  const domains: ClinicalDomain[] = [
    'spine_mdt',
    'acl',
    'concussion',
    'chronic_pain',
    'neuro',
    'tendon',
    'shoulder',
    'hip_groin',
    'pediatric_msk',
    'general_msk'
  ];

  useEffect(() => {
    if (selectedDomain && showAuthorities) {
      loadAuthorities();
    }
  }, [selectedDomain, showAuthorities]);

  const loadAuthorities = async () => {
    if (!selectedDomain) return;

    setLoading(true);
    try {
      const data = await evidenceAuthorityService.getAuthoritiesByDomain(selectedDomain);
      setAuthorities(data);
    } catch (error) {
      console.error('Error loading authorities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSelect = (domain: ClinicalDomain) => {
    onDomainChange(domain);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {selectedDomain
                ? evidenceAuthorityService.getDomainDisplayName(selectedDomain)
                : 'Select Domain'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {domains.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => handleDomainSelect(domain)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedDomain === domain
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {evidenceAuthorityService.getDomainDisplayName(domain)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {showAuthorities && selectedDomain && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-sm text-blue-900">
              {loading ? 'Loading...' : `${authorities.length} Authorities`}
            </span>
          </div>
        )}
      </div>

      {showAuthorities && selectedDomain && authorities.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Authoritative Sources</h4>
          <div className="space-y-2">
            {authorities.map((authority) => (
              <AuthorityCard key={authority.authority_id} authority={authority} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AuthorityCard({ authority }: { authority: EvidenceAuthority }) {
  const typeColors: Record<string, string> = {
    institute: 'bg-purple-100 text-purple-800',
    consensus_group: 'bg-green-100 text-green-800',
    guideline_body: 'bg-blue-100 text-blue-800',
    journal: 'bg-orange-100 text-orange-800'
  };

  const credibilityStars = Array(authority.credibility_level).fill('★').join('');

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-gray-900 truncate">
              {authority.authority_name}
            </h5>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                typeColors[authority.authority_type] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {authority.authority_type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{authority.primary_scope}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="capitalize">{authority.geographic_scope}</span>
            </div>
            {authority.update_cycle_months && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Updates every {authority.update_cycle_months}mo</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">{credibilityStars}</span>
            </div>
          </div>
        </div>
      </div>

      {authority.website_url && (
        <a
          href={authority.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
        >
          Visit Website →
        </a>
      )}
    </div>
  );
}
