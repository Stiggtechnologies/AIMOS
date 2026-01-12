import { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, Building2, BookOpen, Shield, FileText, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clinicService, announcementService } from '../../services/intranetService';
import type { Announcement } from '../../types/intranet';

interface IntranetDashboardProps {
  onNavigate?: (view: string) => void;
}

export default function IntranetDashboard({ onNavigate }: IntranetDashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, announcementsData] = await Promise.all([
        clinicService.getClinicStats(),
        announcementService.getAnnouncements()
      ]);
      setStats(statsData);
      setAnnouncements(announcementsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  const isExecutive = profile?.role === 'executive';
  const isManager = profile?.role === 'clinic_manager';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="mt-2 text-gray-600">
          {isExecutive ? 'Executive Dashboard' :
           isManager ? 'Clinic Manager Dashboard' :
           'Your Dashboard'}
        </p>
      </div>

      {(isExecutive || isManager) && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Clinics</span>
            </div>
            <div className="text-3xl font-bold">{stats.total_clinics}</div>
            <div className="text-sm opacity-80 mt-1">Active Locations</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Revenue</span>
            </div>
            <div className="text-3xl font-bold">${Math.round(stats.weekly_revenue).toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-1">Last 7 Days</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Visits</span>
            </div>
            <div className="text-3xl font-bold">{stats.weekly_visits}</div>
            <div className="text-sm opacity-80 mt-1">Last 7 Days</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <LayoutDashboard className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Utilization</span>
            </div>
            <div className="text-3xl font-bold">{stats.avg_utilization.toFixed(1)}%</div>
            <div className="text-sm opacity-80 mt-1">Average</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate?.('dashboards')} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <Layers className="h-5 w-5 text-slate-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Dashboards</div>
              <div className="text-xs text-gray-600">Custom views</div>
            </button>
            <button onClick={() => onNavigate?.('sops')} className="p-3 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors text-left">
              <BookOpen className="h-5 w-5 text-violet-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">SOP Hub</div>
              <div className="text-xs text-gray-600">Procedures</div>
            </button>
            <button onClick={() => onNavigate?.('forms')} className="p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left">
              <FileText className="h-5 w-5 text-amber-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Forms</div>
              <div className="text-xs text-gray-600">Submit forms</div>
            </button>
            <button onClick={() => onNavigate?.('clinics')} className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <Building2 className="h-5 w-5 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Clinics</div>
              <div className="text-xs text-gray-600">Locations</div>
            </button>
            <button onClick={() => onNavigate?.('people')} className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <Users className="h-5 w-5 text-green-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">People</div>
              <div className="text-xs text-gray-600">Staff</div>
            </button>
            <button onClick={() => onNavigate?.('academy')} className="p-3 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors text-left">
              <BookOpen className="h-5 w-5 text-cyan-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Academy</div>
              <div className="text-xs text-gray-600">Training</div>
            </button>
            <button onClick={() => onNavigate?.('compliance')} className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <Shield className="h-5 w-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Compliance</div>
              <div className="text-xs text-gray-600">Policies</div>
            </button>
            <button onClick={() => onNavigate?.('documents')} className="p-3 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors text-left">
              <FileText className="h-5 w-5 text-rose-600 mb-2" />
              <div className="font-medium text-gray-900 text-sm">Documents</div>
              <div className="text-xs text-gray-600">Library</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements.map(announcement => (
              <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="font-medium text-gray-900 mb-1">{announcement.title}</div>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {announcement.content.substring(0, 80)}...
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(announcement.published_at!).toLocaleDateString()}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent announcements</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
        <p className="mb-4">Contact IT support for technical assistance or questions about AIM OS</p>
        <div className="flex space-x-4 text-sm">
          <span>📧 it@aimrehab.ca</span>
          <span>📞 1-888-AIM-HELP</span>
        </div>
      </div>
    </div>
  );
}
