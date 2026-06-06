import { Settings, Zap, Globe, Clock, Bell, Shield, BookOpen } from 'lucide-react';
import type { AimLocation } from '../../services/aimAutomationService';

interface SettingsViewProps {
  locations: AimLocation[];
}

export default function SettingsView({ locations }: SettingsViewProps) {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Configure system-wide automation preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Bell className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Notification Preferences</h3>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Critical review alerts', sub: 'Get notified immediately for 1-star reviews with risk flags', on: true },
            { label: 'Campaign health alerts', sub: 'Weekly digest of underperforming campaigns', on: true },
            { label: 'Pending approval reminders', sub: 'Daily reminder when posts are awaiting approval', on: true },
            { label: 'Failed post notifications', sub: 'Immediate alert when a post fails to publish', on: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <button className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${item.on ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Global Posting Schedule</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Default posting window start</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[6,7,8,9,10].map(h => <option key={h} value={h}>{h}:00 AM</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Default posting window end</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[18,19,20,21,22].map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Default timezone</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="America/Edmonton">America/Edmonton (Mountain Time)</option>
              <option value="America/Toronto">America/Toronto (Eastern Time)</option>
              <option value="America/Vancouver">America/Vancouver (Pacific Time)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Zap className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Automation Defaults</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Default approval timeout (hours)</label>
            <input
              type="number"
              defaultValue={24}
              className="w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Posts are auto-approved if no decision is made within this window</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Max post retries on failure</label>
            <input
              type="number"
              defaultValue={3}
              className="w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Compliance & Legal</h3>
        </div>
        <div className="p-5 space-y-3 text-sm text-gray-600">
          <p className="text-xs text-gray-500 leading-relaxed">
            All content published through this system is subject to AIM's brand standards, PIPEDA privacy requirements,
            and applicable CASL regulations. Review escalations for legal threats or privacy concerns are automatically
            routed to the Executive team.
          </p>
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Promotional pricing content (e.g., discounts, % off offers) requires compliance sign-off before publishing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
