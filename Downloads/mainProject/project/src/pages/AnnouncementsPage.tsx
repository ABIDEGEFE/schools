import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../utils/api';
import { Announcement } from '../data/mockData';
import { Button } from '../components/common/Button';
import { Megaphone, AlertTriangle, Calendar } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification, markAllRead } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (state.user?.schoolId) {
        try {
          const announcementData = await api.getAnnouncements(state.user.schoolId);
          setAnnouncements(announcementData);
          markAllRead();
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
    
  }, [state.user?.schoolId, addNotification, markAllRead]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const urgentAnnouncements = announcements.filter(a => a.urgent);
  const regularAnnouncements = announcements.filter(a => !a.urgent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Announcements</h1>
        <p className="text-gray-600">Stay updated with the latest news from your school</p>
      </div>

      {/* Urgent Announcements */}
      {urgentAnnouncements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-800 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Urgent Announcements
          </h2>
          {urgentAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-red-800">{announcement.title}</h3>
                </div>
                <div className="flex items-center text-sm text-red-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(announcement.createdAt)}
                </div>
              </div>
              <p className="text-red-700">{announcement.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Regular Announcements */}
      <div className="space-y-4">
        {urgentAnnouncements.length > 0 && (
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Megaphone className="mr-2 h-5 w-5" />
            General Announcements
          </h2>
        )}
        
        {regularAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {regularAnnouncements.map((announcement) => (
              <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(announcement.createdAt)}
                  </div>
                </div>
                <p className="text-gray-700">{announcement.content}</p>
              </div>
            ))}
          </div>
        ) : urgentAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
            <p className="text-gray-600">Check back later for updates from your school</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};