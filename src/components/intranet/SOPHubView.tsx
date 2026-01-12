import { useEffect, useState } from 'react';
import { BookOpen, Search, FileText, CheckCircle, Clock, Eye, Plus, Edit, Folder } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sopService, SOP, SOPCategory, SOPVersion } from '../../services/sopService';

export default function SOPHubView() {
  const { profile } = useAuth();
  const [sops, setSops] = useState<SOP[]>([]);
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [versions, setVersions] = useState<SOPVersion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const isManager = profile?.role === 'executive' || profile?.role === 'admin' || profile?.role === 'clinic_manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sopsData, categoriesData] = await Promise.all([
        sopService.getAllSOPs(),
        sopService.getCategories()
      ]);
      setSops(sopsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading SOPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSOPDetail = async (sop: SOP) => {
    setSelectedSOP(sop);
    setViewMode('detail');

    if (sop.id) {
      const versionsData = await sopService.getVersions(sop.id);
      setVersions(versionsData);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      const results = await sopService.searchSOPs(searchQuery);
      setSops(results);
    } catch (error) {
      console.error('Error searching SOPs:', error);
    }
  };

  const acknowledgeReview = async (sopId: string, versionId?: string) => {
    if (!profile?.id) return;

    try {
      await sopService.createReview({
        sop_id: sopId,
        version_id: versionId,
        reviewer_id: profile.id,
        acknowledged: true
      });
      alert('SOP acknowledged successfully');
    } catch (error) {
      console.error('Error acknowledging SOP:', error);
    }
  };

  const filteredSOPs = selectedCategory
    ? sops.filter(sop => sop.category_id === selectedCategory)
    : sops;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedSOP) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedSOP(null);
              setVersions([]);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to SOPs
          </button>
          {isManager && (
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Edit className="h-4 w-4 mr-2" />
              Edit SOP
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {selectedSOP.sop_number}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedSOP.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : selectedSOP.status === 'review'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedSOP.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSOP.title}</h1>
              {selectedSOP.category && (
                <p className="text-gray-600">Category: {selectedSOP.category.name}</p>
              )}
            </div>
          </div>

          {selectedSOP.purpose && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
              <p className="text-gray-700">{selectedSOP.purpose}</p>
            </div>
          )}

          {selectedSOP.scope && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Scope</h3>
              <p className="text-gray-700">{selectedSOP.scope}</p>
            </div>
          )}

          {selectedSOP.current_version && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Current Version Content</h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {selectedSOP.current_version.content}
              </div>
            </div>
          )}

          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => acknowledgeReview(selectedSOP.id, selectedSOP.current_version_id)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge Review
            </button>
          </div>

          {versions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Version History</h3>
              <div className="space-y-3">
                {versions.map(version => (
                  <div key={version.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">Version {version.version_number}</span>
                        {version.approved_at && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Approved
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {version.change_summary && (
                      <p className="text-sm text-gray-600">{version.change_summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SOP Hub</h1>
          <p className="mt-2 text-gray-600">Standard Operating Procedures</p>
        </div>
        {isManager && (
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            New SOP
          </button>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All SOPs ({sops.length})
              </button>
              {categories.map(category => {
                const count = sops.filter(sop => sop.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        {category.name}
                      </div>
                      <span className="text-sm text-gray-500">({count})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {filteredSOPs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSOPs.map(sop => (
                <div key={sop.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">{sop.sop_number}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sop.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : sop.status === 'review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sop.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{sop.title}</h3>
                  {sop.purpose && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{sop.purpose}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {sop.next_review_date && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Review: {new Date(sop.next_review_date).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      onClick={() => viewSOPDetail(sop)}
                      className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No SOPs Found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try a different search term' : 'No SOPs available in this category'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
