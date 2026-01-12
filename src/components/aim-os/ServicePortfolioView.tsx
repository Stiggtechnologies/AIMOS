import { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Rocket,
  Sunset,
  Play,
  Pause,
  XCircle,
} from 'lucide-react';
import {
  getAllServiceLines,
  getServiceDemand,
  getServiceCapacity,
  getServicePerformance,
  getServiceLifecycleEvents,
  getUnmetDependencies,
  type ServiceLine,
  type ServiceDemand,
  type ServiceCapacity,
  type ServicePerformance,
  type ServiceLifecycleEvent,
  type ServiceDependency,
} from '../../services/servicePortfolioService';

export default function ServicePortfolioView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'demand' | 'capacity' | 'performance' | 'lifecycle'>('overview');

  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [demand, setDemand] = useState<ServiceDemand[]>([]);
  const [capacity, setCapacity] = useState<ServiceCapacity[]>([]);
  const [performance, setPerformance] = useState<ServicePerformance[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<ServiceLifecycleEvent[]>([]);
  const [dependencies, setDependencies] = useState<ServiceDependency[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [servicesData, demandData, capacityData, performanceData, eventsData, depsData] = await Promise.all([
        getAllServiceLines(),
        getServiceDemand(),
        getServiceCapacity(),
        getServicePerformance(),
        getServiceLifecycleEvents(),
        getUnmetDependencies(),
      ]);

      setServiceLines(servicesData);
      setDemand(demandData);
      setCapacity(capacityData);
      setPerformance(performanceData);
      setLifecycleEvents(eventsData);
      setDependencies(depsData);
    } catch (error) {
      console.error('Error loading service portfolio data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Service Portfolio...</p>
        </div>
      </div>
    );
  }

  const activeServices = serviceLines.filter(s => s.status === 'active');
  const pilotServices = serviceLines.filter(s => s.status === 'pilot');
  const planningServices = serviceLines.filter(s => s.status === 'planning');
  const retiringServices = serviceLines.filter(s => s.status === 'retiring');

  const totalRevenue = performance.reduce((sum, p) => sum + p.total_revenue, 0);
  const averageMargin = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.gross_margin_percentage, 0) / performance.length
    : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Target className="h-5 w-5" />;
      case 'growth': return <TrendingUp className="h-5 w-5" />;
      case 'emerging': return <Rocket className="h-5 w-5" />;
      case 'sunset': return <Sunset className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pilot': return <Play className="h-5 w-5 text-blue-600" />;
      case 'planning': return <Clock className="h-5 w-5 text-gray-600" />;
      case 'retiring': return <Pause className="h-5 w-5 text-yellow-600" />;
      case 'retired': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Service Line & Product Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Stop AIM from growing accidentally through strategic portfolio management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeServices.length}</p>
              <p className="text-xs text-gray-500 mt-1">{pilotServices.length} in pilot</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">Across portfolio</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Margin</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{averageMargin.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Portfolio average</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Action Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {planningServices.length + retiringServices.length + dependencies.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Requiring decisions</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              (planningServices.length + retiringServices.length + dependencies.length) > 0
                ? 'bg-yellow-100'
                : 'bg-green-100'
            }`}>
              <AlertCircle className={`h-6 w-6 ${
                (planningServices.length + retiringServices.length + dependencies.length) > 0
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'catalog', label: 'Service Catalog', icon: Package },
            { id: 'demand', label: 'Demand Analysis', icon: Users },
            { id: 'capacity', label: 'Capacity Planning', icon: Target },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'lifecycle', label: 'Lifecycle Management', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Core Services</span>
                    {getCategoryIcon('core')}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {serviceLines.filter(s => s.category === 'core').length}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Foundation of practice</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Growth Services</span>
                    {getCategoryIcon('growth')}
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {serviceLines.filter(s => s.category === 'growth').length}
                  </p>
                  <p className="text-xs text-green-700 mt-1">Scaling opportunities</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Emerging Services</span>
                    {getCategoryIcon('emerging')}
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {serviceLines.filter(s => s.category === 'emerging').length}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">Future bets</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-900">Sunset Services</span>
                    {getCategoryIcon('sunset')}
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {serviceLines.filter(s => s.category === 'sunset').length}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">Phasing out</p>
                </div>
              </div>
            </div>

            {(planningServices.length > 0 || retiringServices.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Requiring Action</h3>
                <div className="space-y-3">
                  {planningServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">Planning phase - ready to launch?</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          PLANNING
                        </span>
                      </div>
                    </div>
                  ))}

                  {retiringServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">Sunset process active</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                          RETIRING
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dependencies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unmet Dependencies</h3>
                <div className="space-y-2">
                  {dependencies.slice(0, 5).map((dep) => (
                    <div
                      key={dep.id}
                      className="p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dep.description}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Type: {dep.dependency_type.replace('_', ' ')}
                          {dep.target_completion_date && (
                            <span className="ml-2">
                              • Target: {new Date(dep.target_completion_date).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                        BLOCKED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lifecycleEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lifecycle Events</h3>
                <div className="space-y-2">
                  {lifecycleEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.service_line ? (event.service_line as any).name : 'Service'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.event_type.replace('_', ' ').toUpperCase()} on {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        {event.rationale && (
                          <p className="text-xs text-gray-500 mt-1">{event.rationale}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Service Catalog</h3>
              <p className="text-sm text-gray-600">All services across the portfolio</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Launch Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceLines.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(service.category)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-gray-500">{service.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          service.category === 'core' ? 'bg-blue-100 text-blue-800' :
                          service.category === 'growth' ? 'bg-green-100 text-green-800' :
                          service.category === 'emerging' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {service.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(service.status)}
                          <span className="text-sm text-gray-600">{service.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          service.strategic_priority === 'high' ? 'bg-red-100 text-red-800' :
                          service.strategic_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {service.strategic_priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {service.launch_date ? new Date(service.launch_date).toLocaleDateString() : 'TBD'}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {service.revenue_target_annual
                          ? `$${(service.revenue_target_annual / 1000).toFixed(0)}K`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-4">
                        {service.is_billable ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'demand' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Demand Analysis by Service</h3>
              <p className="text-sm text-gray-600">Track interest and conversion rates</p>
            </div>

            <div className="space-y-4">
              {demand.map((d) => (
                <div key={d.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900">
                        {d.service_line ? (d.service_line as any).name : 'Service'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(d.period_start).toLocaleDateString()} - {new Date(d.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      d.conversion_rate >= 75 ? 'bg-green-100 text-green-800' :
                      d.conversion_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {d.conversion_rate.toFixed(1)}% conversion
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700 font-medium">Requests</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">{d.requests_received}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-green-700 font-medium">Booked</p>
                      <p className="text-lg font-bold text-green-900 mt-1">{d.appointments_booked}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-700 font-medium">Completed</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">{d.appointments_completed}</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-yellow-700 font-medium">Waitlist</p>
                      <p className="text-lg font-bold text-yellow-900 mt-1">{d.waitlist_count}</p>
                    </div>
                  </div>

                  {d.average_wait_days > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded flex items-center justify-between">
                      <p className="text-sm text-gray-600">Average Wait Time</p>
                      <p className="text-sm font-semibold text-gray-900">{d.average_wait_days.toFixed(1)} days</p>
                    </div>
                  )}
                </div>
              ))}

              {demand.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No demand data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacity Planning</h3>
              <p className="text-sm text-gray-600">Resource allocation and utilization</p>
            </div>

            <div className="space-y-4">
              {capacity.map((c) => (
                <div key={c.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900">
                        {c.service_line ? (c.service_line as any).name : 'Service'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(c.period_start).toLocaleDateString()} - {new Date(c.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      c.utilization_percentage >= 90 ? 'bg-red-100 text-red-800' :
                      c.utilization_percentage >= 75 ? 'bg-green-100 text-green-800' :
                      c.utilization_percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {c.utilization_percentage.toFixed(1)}% utilized
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700 font-medium">Total Slots</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">{c.total_slots_available}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-green-700 font-medium">Booked</p>
                      <p className="text-lg font-bold text-green-900 mt-1">{c.slots_booked}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-700 font-medium">Completed</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">{c.slots_completed}</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-xs text-red-700 font-medium">Cancelled</p>
                      <p className="text-lg font-bold text-red-900 mt-1">{c.slots_cancelled}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Staff FTE Allocated</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{c.staff_fte_allocated.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Room Hours Allocated</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{c.room_hours_allocated.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {capacity.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No capacity data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Performance</h3>
              <p className="text-sm text-gray-600">Revenue, margins, and patient metrics</p>
            </div>

            <div className="space-y-4">
              {performance.map((p) => (
                <div key={p.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900">
                        {p.service_line ? (p.service_line as any).name : 'Service'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      p.gross_margin_percentage >= 70 ? 'bg-green-100 text-green-800' :
                      p.gross_margin_percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.gross_margin_percentage.toFixed(1)}% margin
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-green-700 font-medium">Revenue</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        ${(p.total_revenue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-xs text-red-700 font-medium">Direct Costs</p>
                      <p className="text-lg font-bold text-red-900 mt-1">
                        ${(p.direct_costs / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700 font-medium">Gross Margin</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        ${(p.gross_margin / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-700 font-medium">Patients</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">{p.patient_count}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Avg Revenue/Patient</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ${p.average_revenue_per_patient.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Patient Satisfaction</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {p.patient_satisfaction_score.toFixed(1)}/5.0
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {performance.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No performance data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lifecycle' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Lifecycle Management</h3>
              <p className="text-sm text-gray-600">Track launches, pivots, and retirements</p>
            </div>

            <div className="space-y-3">
              {lifecycleEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    event.event_type === 'full_launch' ? 'bg-green-50 border-green-500' :
                    event.event_type === 'pilot_launch' ? 'bg-blue-50 border-blue-500' :
                    event.event_type === 'retired' ? 'bg-gray-50 border-gray-500' :
                    event.event_type === 'sunset_announced' ? 'bg-orange-50 border-orange-500' :
                    'bg-purple-50 border-purple-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-semibold text-gray-900">
                          {event.service_line ? (event.service_line as any).name : 'Service'}
                        </p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          event.event_type === 'full_launch' ? 'bg-green-100 text-green-800' :
                          event.event_type === 'pilot_launch' ? 'bg-blue-100 text-blue-800' :
                          event.event_type === 'retired' ? 'bg-gray-100 text-gray-800' :
                          event.event_type === 'sunset_announced' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{new Date(event.event_date).toLocaleDateString()}</p>
                      {event.rationale && (
                        <p className="text-sm text-gray-700 mt-2">{event.rationale}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {lifecycleEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No lifecycle events recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
