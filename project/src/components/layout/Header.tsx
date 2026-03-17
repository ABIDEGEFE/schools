import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../common/Button';
import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Check, Trash2 } from 'lucide-react'; 

export const Header: React.FC = () => {
  const { state, logout } = useAuth();
  const { state: notificationState, markRead, removeNotification } = useNotifications();
  const [bellClicked, setBellClicked] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Schools</h1>
            </Link>
          </div>

          {state.isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setBellClicked(!bellClicked)} />
                {notificationState.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationState.unreadCount}
                  </span>
                )}
              </div>

              {/* Profile Feature */}
              <div
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
                onClick={handleProfileClick}
                title="View Profile"
              >
                {state.user?.profilePicture ? (
                  <img
                    src={state.user.profilePicture}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-600" />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{state.user?.name}</p>
                  <p className="text-gray-500">
                    {state.user?.role === 'AD'
                      ? 'Admin'
                      : state.user?.role === 'TC'
                      ? 'Teacher'
                      : 'Student'}
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={bellClicked}
        onClose={() => setBellClicked(false)}
        title="Notifications"
        size="sm"
      >
        <div className="space-y-2">
          {notificationState.notifications.length === 0 ? (
            <p className="text-gray-600">No new notifications</p>
          ) : (
            notificationState.notifications.map((notif) => (
              <div key={notif.id} className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition">
                <p className="text-sm text-gray-800">{notif.message}</p>
                <p className="text-xs text-gray-500">{new Date(notif.timestamp).toLocaleString()}</p>
                {notif.read ? (
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    <Check className="h-3 w-3 mr-1" /> Read
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full"
                    onClick={() => markRead(notif.id)}
                  >
                    <Check className="h-3 w-3 mr-1" /> Mark as Unread
                  </span>
                )}
                <button
                  className="ml-4 text-red-500 hover:text-red-700"
                  onClick={() => {
                    removeNotification(notif.id);
                    if (!notif.read) {
                      // Adjust unread count if the removed notification was unread
                      markRead(notif.id);
                    } 
                  }}
                  title="Delete Notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </header>
  );
};