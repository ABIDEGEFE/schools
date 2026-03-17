import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { Announcement } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Megaphone, AlertTriangle } from 'lucide-react';

export const SAannouncementPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    urgent: false,
    is_public: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user) return;

    setSubmitting(true);

    try {
        const newAnnouncement = await api.createAnnouncement({
        title: formData.title,
        content: formData.content,
        urgent: formData.urgent,
        authorId: state.user.id,
        schoolId: formData.is_public ? null : state.user.school.id || null,
      } as any);

      setFormData({ title: '', content: '', urgent: false, is_public: false });
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
            <label className="ml-6 flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Make Public</span>
            </label>
          </div>

          <Button type="submit" loading={submitting}>
            Post Announcement
          </Button>
        </form>
      </div>
    </div>
  )
}