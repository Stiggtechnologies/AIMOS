import { useEffect, useState } from 'react';
import { LayoutGrid, Plus, Settings, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService, DashboardWidget, UserDashboardLayout } from '../../services/dashboardService';

export default function DashboardsView() {
  const { profile } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [currentLayout, setCurrentLayout] = useState<UserDashboardLayout | null>(null);
  const [layouts, setLayouts] = useState<UserDashboardLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;

    try {
      const [widgetsData, layoutsData, defaultLayout] = await Promise.all([
        dashboardService.getAvailableWidgets(),
        dashboardService.getUserLayouts(profile.id),
        dashboardService.getUserLayout(profile.id, 'default')
      ]);

      setWidgets(widgetsData);
      setLayouts(layoutsData);
      setCurrentLayout(defaultLayout || null);
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    if (!profile?.id || !currentLayout) return;

    try {
      await dashboardService.saveUserLayout(currentLayout);
      setEditMode(false);
      loadData();
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const addWidgetToLayout = (widgetId: string) => {
    if (!currentLayout) {
      const newLayout: Partial<UserDashboardLayout> = {
        user_id: profile!.id,
        layout_name: 'default',
        widgets: [{ widget_id: widgetId, position: { x: 0, y: 0, w: 2, h: 2 } }],
        layout_config: {},
        is_default: true
      };
      setCurrentLayout(newLayout as UserDashboardLayout);
    } else {
      const updatedWidgets = [
        ...currentLayout.widgets,
        { widget_id: widgetId, position: { x: 0, y: currentLayout.widgets.length * 2, w: 2, h: 2 } }
      ];
      setCurrentLayout({ ...currentLayout, widgets: updatedWidgets });
    }
  };

  const removeWidgetFromLayout = (widgetId: string) => {
    if (!currentLayout) return;

    const updatedWidgets = currentLayout.widgets.filter(w => w.widget_id !== widgetId);
    setCurrentLayout({ ...currentLayout, widgets: updatedWidgets });
  };

  const getWidgetById = (widgetId: string) => {
    return widgets.find(w => w.id === widgetId);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-gray-600">Customize your personal dashboard</p>
        </div>
        <div className="flex space-x-3">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLayout}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Layout
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-5 w-5 mr-2" />
              Edit Dashboard
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Available Widgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {widgets.map(widget => {
              const isAdded = currentLayout?.widgets.some(w => w.widget_id === widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => !isAdded && addWidgetToLayout(widget.id)}
                  disabled={isAdded}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isAdded
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-medium text-sm">{widget.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{widget.widget_type}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentLayout && currentLayout.widgets.length > 0 ? (
          currentLayout.widgets.map(widgetConfig => {
            const widget = getWidgetById(widgetConfig.widget_id);
            if (!widget) return null;

            return (
              <div
                key={widgetConfig.widget_id}
                className="bg-white rounded-lg shadow-md p-6 relative"
              >
                {editMode && (
                  <button
                    onClick={() => removeWidgetFromLayout(widget.id)}
                    className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="flex items-center mb-4">
                  <LayoutGrid className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                    {widget.description && (
                      <p className="text-sm text-gray-600">{widget.description}</p>
                    )}
                  </div>
                </div>

                <div className="text-gray-600">
                  <p className="text-sm">Widget Type: {widget.widget_type}</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Widget content will be displayed here</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-gray-50 rounded-lg p-12 text-center">
            <LayoutGrid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Widgets Added</h3>
            <p className="text-gray-600 mb-6">
              Click "Edit Dashboard" to add widgets and customize your view
            </p>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        )}
      </div>

      {layouts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Saved Layouts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {layouts.map(layout => (
              <button
                key={layout.id}
                onClick={() => setCurrentLayout(layout)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  currentLayout?.id === layout.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{layout.layout_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {layout.widgets.length} widgets
                  {layout.is_default && ' (Default)'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
