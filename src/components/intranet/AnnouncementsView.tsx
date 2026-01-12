import { useEffect, useState } from 'react';
import { Megaphone, Pin, Calendar } from 'lucide-react';
import { announcementService } from '../../services/intranetService';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement } from '../../types/intranet';

export default function AnnouncementsView() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (announcement: Announcement) => {
    if (!user) return;
    setSelectedAnnouncement(announcement);
    try {
      await announcementService.markAsRead(user.id, announcement.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (selectedAnnouncement) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedAnnouncement(null)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Announcements
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{selectedAnnouncement.title}</h1>
              {selectedAnnouncement.is_pinned && (
                <Pin className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(selectedAnnouncement.published_at!).toLocaleDateString()}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedAnnouncement.priority)}`}>
                {selectedAnnouncement.priority}
              </span>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedAnnouncement.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-gray-600">Company news and updates</p>
      </div>

      <div className="space-y-4">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            onClick={() => handleRead(announcement)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  announcement.priority === 'urgent' || announcement.priority === 'high'
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  <Megaphone className={`h-5 w-5 ${
                    announcement.priority === 'urgent' || announcement.priority === 'high'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    {announcement.is_pinned && (
                      <Pin className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {announcement.content.substring(0, 150)}...
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                {announcement.priority}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(announcement.published_at!).toLocaleDateString()}</span>
              </div>
              {announcement.author && (
                <span>By {announcement.author.first_name} {announcement.author.last_name}</span>
              )}
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No announcements at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
