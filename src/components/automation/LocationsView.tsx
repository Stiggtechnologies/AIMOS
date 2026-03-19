import { MapPin, Phone, Mail, Globe, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import type { AimLocation, SocialAccount, Platform } from '../../services/aimAutomationService';

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  google_business: 'Google Business',
  tiktok: 'TikTok',
};

interface LocationsViewProps {
  locations: AimLocation[];
  socialAccounts: SocialAccount[];
  loading: boolean;
}

export default function LocationsView({ locations, socialAccounts, loading }: LocationsViewProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{locations.length} Location{locations.length !== 1 ? 's' : ''}</h2>
          <p className="text-sm text-gray-500">Manage clinic locations and their connected accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {locations.map(location => {
          const locationAccounts = socialAccounts.filter(a => a.location_id === location.id);
          const allActive = locationAccounts.every(a => a.status === 'active');
          const hasError = locationAccounts.some(a => a.status === 'error');

          return (
            <div key={location.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`px-5 py-4 border-b ${hasError ? 'bg-red-50 border-red-200' : allActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{location.city}, {location.province}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${hasError ? 'text-red-600' : allActive ? 'text-green-600' : 'text-amber-600'}`}>
                    {hasError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {hasError ? 'Issues' : allActive ? 'All Connected' : 'Partial'}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{location.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs">{location.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs">{location.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Connected Accounts</p>
                  {locationAccounts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No accounts connected</p>
                  ) : (
                    <div className="space-y-1.5">
                      {locationAccounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              account.status === 'active' ? 'bg-green-500' :
                              account.status === 'error' ? 'bg-red-500' :
                              account.status === 'pending' ? 'bg-amber-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-xs text-gray-700">{PLATFORM_LABELS[account.platform] ?? account.platform}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 truncate max-w-28">{account.account_name}</p>
                            {account.last_synced_at && (
                              <p className="text-xs text-gray-400">
                                {new Date(account.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {locationAccounts.filter(a => a.error_message).map(account => (
                  <div key={account.id} className="p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
                    <span className="font-medium">{PLATFORM_LABELS[account.platform]}: </span>
                    {account.error_message}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
