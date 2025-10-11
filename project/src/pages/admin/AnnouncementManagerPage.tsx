import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { Announcement } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Megaphone, AlertTriangle } from 'lucide-react';

export const AnnouncementManagerPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    urgent: false
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (state.user?.schoolId) {
        try {
          const announcementData = await api.getAnnouncements(state.user.schoolId);
          setAnnouncements(announcementData);
        } catch (error) {
          addNotification({
            message: 'Error loading announcements',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAnnouncements();
  }, [state.user?.schoolId, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user) return;

    setSubmitting(true);

    try {
      const newAnnouncement = await api.createAnnouncement({
        title: formData.title,
        content: formData.content,
        urgent: formData.urgent,
        schoolId: state.user.schoolId,
        authorId: state.user.id
      });

      setAnnouncements([newAnnouncement, ...announcements]);
      setFormData({ title: '', content: '', urgent: false });
      addNotification({
        message: 'Announcement posted successfully!',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        message: 'Error posting announcement',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Announcement Manager</h1>
        <p className="text-gray-600">Create and manage school announcements</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Megaphone className="mr-2 h-5 w-5 text-blue-600" />
          Post New Announcement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              required
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgent"
              name="urgent"
              checked={formData.urgent}
              onChange={handleInputChange}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="urgent" className="ml-2 block text-sm text-gray-900 flex items-center">
              <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
              Mark as urgent
            </label>
          </div>

          <Button type="submit" loading={submitting}>
            Post Announcement
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-lg font-medium text-gray-900">{announcement.title}</h4>
                    {announcement.urgent && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600">{announcement.content}</p>
              </div>
            ))}
            
            {announcements.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No announcements yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};