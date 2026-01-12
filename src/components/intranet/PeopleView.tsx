import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MapPin, Briefcase, Search } from 'lucide-react';
import { staffService } from '../../services/intranetService';
import type { StaffProfile } from '../../types/intranet';

export default function PeopleView() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = staff.filter(s =>
        s.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchQuery, staff]);

  const loadStaff = async () => {
    try {
      const data = await staffService.getAllStaff();
      setStaff(data);
      setFilteredStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">People</h1>
        <p className="mt-2 text-gray-600">Staff directory and contact information</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, or specialization..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredStaff.length} {filteredStaff.length === 1 ? 'Team Member' : 'Team Members'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(person => (
            <div key={person.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {person.user?.first_name} {person.user?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{person.job_title || 'Staff Member'}</p>
                  {person.specialization && (
                    <p className="text-xs text-gray-500 truncate">{person.specialization}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {person.user?.email && (
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{person.user.email}</span>
                  </div>
                )}
                {person.user?.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{person.user.phone}</span>
                  </div>
                )}
                {person.clinic && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{person.clinic.name}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-700">
                  <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">{person.employment_type?.replace('_', ' ')}</span>
                </div>
              </div>

              {person.skills && person.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {person.skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {person.skills.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">+{person.skills.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No staff members found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
