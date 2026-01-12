import { useEffect, useState } from 'react';
import { BookOpen, Play, FileText, CheckCircle, Clock } from 'lucide-react';
import { academyService } from '../../services/intranetService';
import { useAuth } from '../../contexts/AuthContext';
import type { AcademyContent, AcademyCategory } from '../../types/intranet';

export default function AcademyView() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [content, setContent] = useState<AcademyContent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<AcademyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadContent(selectedCategory);
    } else {
      loadContent();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const cats = await academyService.getCategories();
      setCategories(cats);
      await loadContent();
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (categoryId?: string) => {
    try {
      const data = await academyService.getContent(categoryId || undefined);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'document': return FileText;
      default: return BookOpen;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (selectedContent) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedContent(null)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Academy
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedContent.title}</h1>
            {selectedContent.description && (
              <p className="text-gray-600">{selectedContent.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
              {selectedContent.duration_minutes && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{selectedContent.duration_minutes} min</span>
                </div>
              )}
              {selectedContent.is_required && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                  Required
                </span>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            {selectedContent.content_text && (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {selectedContent.content_text}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academy</h1>
        <p className="mt-2 text-gray-600">Training materials and professional development</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Content
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map(item => {
          const Icon = getContentIcon(item.content_type);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedContent(item)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  item.content_type === 'video' ? 'bg-red-100' :
                  item.content_type === 'document' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    item.content_type === 'video' ? 'text-red-600' :
                    item.content_type === 'document' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                {item.is_required && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    Required
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                {item.duration_minutes && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{item.duration_minutes} min</span>
                  </div>
                )}
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.content_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {content.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No content available in this category</p>
        </div>
      )}
    </div>
  );
}
