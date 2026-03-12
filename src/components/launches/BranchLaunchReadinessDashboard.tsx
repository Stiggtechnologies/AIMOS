import React, { useState, useEffect } from 'react';
import { Rocket, CircleCheck as CheckCircle2, Circle, TriangleAlert as AlertTriangle, Calendar, MapPin, Users, Building2, Package, Wifi, FileText, TrendingUp, Phone, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  metadata: any;
}

interface ReadinessItem {
  id: string;
  category: string;
  item_name: string;
  description: string;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  target_completion_date: string;
  display_order: number;
}

interface Room {
  id: string;
  name: string;
  room_type: string;
  capacity: number;
}

interface Service {
  id: string;
  name: string;
  estimated_duration_minutes: number;
  base_price: number;
}

interface Product {
  product_name: string;
  product_category: string;
  retail_price: number;
}

export default function BranchLaunchReadinessDashboard() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [clinicData, readinessData, roomsData, servicesData, inventoryData] = await Promise.all([
        supabase.from('clinics').select('*').eq('code', 'AIM-SC-001').maybeSingle(),
        supabase.from('clinic_launch_readiness').select('*').eq('clinic_id',
          supabase.from('clinics').select('id').eq('code', 'AIM-SC-001').maybeSingle().then(r => r.data?.id)
        ).order('display_order'),
        supabase.from('rooms').select('*').eq('clinic_id',
          supabase.from('clinics').select('id').eq('code', 'AIM-SC-001').maybeSingle().then(r => r.data?.id)
        ),
        supabase.from('services').select('*').eq('clinic_id',
          supabase.from('clinics').select('id').eq('code', 'AIM-SC-001').maybeSingle().then(r => r.data?.id)
        ),
        supabase.from('product_inventory')
          .select('*, product_catalog(*)')
          .eq('clinic_id', supabase.from('clinics').select('id').eq('code', 'AIM-SC-001').maybeSingle().then(r => r.data?.id))
      ]);

      if (clinicData.data) setClinic(clinicData.data);
      if (readinessData.data) setReadinessItems(readinessData.data);
      if (roomsData.data) setRooms(roomsData.data);
      if (servicesData.data) setServices(servicesData.data);
      if (inventoryData.data) {
        setInventory(inventoryData.data.map((inv: any) => inv.product_catalog));
      }
    } catch (error) {
      console.error('Failed to load launch readiness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCompletion = async (itemId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('clinic_launch_readiness')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      await loadData();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const categorizeItems = () => {
    const categories = readinessItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ReadinessItem[]>);
    return categories;
  };

  const calculateProgress = () => {
    const total = readinessItems.filter(i => i.is_required).length;
    const completed = readinessItems.filter(i => i.is_required && i.is_completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Compliance': Shield,
      'Staffing': Users,
      'Rooms & Equipment': Building2,
      'Systems': Wifi,
      'Clinical Ops': FileText,
      'Marketing': TrendingUp,
      'Go-Live': Rocket
    };
    return icons[category] || Circle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Clinic not found</p>
      </div>
    );
  }

  const categories = categorizeItems();
  const overallProgress = calculateProgress();
  const daysUntilTarget = clinic.metadata?.opening_target
    ? Math.ceil((new Date(clinic.metadata.opening_target).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-8 h-8" />
              <h1 className="text-3xl font-bold">{clinic.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-blue-100 mt-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{clinic.address}, {clinic.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{clinic.phone}</span>
              </div>
              {clinic.metadata?.opening_target && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Target: {new Date(clinic.metadata.opening_target).toLocaleDateString()}</span>
                  {daysUntilTarget !== null && (
                    <span className="ml-2 px-2 py-1 bg-white/20 rounded text-sm font-medium">
                      {daysUntilTarget > 0 ? `${daysUntilTarget} days` : 'Overdue'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{overallProgress}%</div>
            <div className="text-blue-100 mt-1">Launch Ready</div>
          </div>
        </div>
        <div className="mt-6 bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{rooms.length}</span>
          </div>
          <div className="text-sm text-gray-600">Configured Rooms</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{services.length}</span>
          </div>
          <div className="text-sm text-gray-600">Services Activated</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{inventory.length}</span>
          </div>
          <div className="text-sm text-gray-600">Retail Products</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {readinessItems.filter(i => i.is_completed).length}/{readinessItems.length}
            </span>
          </div>
          <div className="text-sm text-gray-600">Tasks Complete</div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(categories).map(([category, items]) => {
          const Icon = getCategoryIcon(category);
          const categoryTotal = items.filter(i => i.is_required).length;
          const categoryComplete = items.filter(i => i.is_required && i.is_completed).length;
          const categoryProgress = categoryTotal > 0 ? Math.round((categoryComplete / categoryTotal) * 100) : 0;

          return (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-500">
                        {categoryComplete} of {categoryTotal} required items complete
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{categoryProgress}%</div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${categoryProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleItemCompletion(item.id, item.is_completed)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {item.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.item_name}
                          </h4>
                          {item.is_required && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.target_completion_date && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Target: {new Date(item.target_completion_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {overallProgress === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Launch Ready!</h3>
          <p className="text-green-700">
            All required tasks are complete. AIM South Commons is ready for go-live.
          </p>
        </div>
      )}
    </div>
  );
}
