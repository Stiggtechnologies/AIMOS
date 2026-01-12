import { useEffect, useState } from 'react';
import { Home, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { capacityService, TreatmentRoom } from '../../services/operationsService';

export default function CapacityView() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [utilization, setUtilization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile?.primary_clinic_id]);

  const loadData = async () => {
    if (!profile?.primary_clinic_id) return;

    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [roomsData, utilizationData] = await Promise.all([
        capacityService.getTreatmentRooms(profile.primary_clinic_id),
        capacityService.calculateUtilization(
          profile.primary_clinic_id,
          weekAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        )
      ]);

      setRooms(roomsData);
      setUtilization(utilizationData);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {utilization && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Home className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Total Rooms</span>
            </div>
            <div className="text-3xl font-bold">{utilization.totalRooms}</div>
            <div className="text-sm opacity-80 mt-1">Active Treatment Rooms</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Utilization</span>
            </div>
            <div className="text-3xl font-bold">{utilization.utilizationRate}%</div>
            <div className="text-sm opacity-80 mt-1">Last 7 Days</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Bookings</span>
            </div>
            <div className="text-3xl font-bold">{utilization.totalBookings}</div>
            <div className="text-sm opacity-80 mt-1">Total This Week</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Home className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-80">Room Hours</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(utilization.bookedHours)}</div>
            <div className="text-sm opacity-80 mt-1">of {Math.round(utilization.totalRoomHours)} available</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Treatment Rooms</h3>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{room.room_name}</div>
                    <div className="text-sm text-gray-600">Room {room.room_number}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    room.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {room.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{room.room_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium">{room.capacity} person(s)</span>
                  </div>
                  {room.floor_number && (
                    <div className="flex items-center justify-between">
                      <span>Floor:</span>
                      <span className="font-medium">{room.floor_number}</span>
                    </div>
                  )}
                  {room.is_accessible && (
                    <div className="text-xs text-green-600 mt-2">Wheelchair Accessible</div>
                  )}
                </div>

                {room.equipment && room.equipment.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Equipment:</div>
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.slice(0, 3).map((equip, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {equip}
                        </span>
                      ))}
                      {room.equipment.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{room.equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No treatment rooms configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
