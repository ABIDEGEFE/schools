import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { User } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LicenseBadge } from '../../components/common/LicenseBadge';
import { Modal } from '../../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PerformanceMonitorPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [selectedStatus, setSelectedStatus] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { state } = useAuth();
  const schoolID = state?.selectedSchoolId;

  const handleStatusFilter = async (status: 'green' | 'yellow' | 'red') => {
    setLoading(true);
    setSelectedStatus(status);
    
    try {
      if (!schoolID) {
        addNotification({ message: 'No school selected', type: 'error' });
        setUsers([]);
        return;
      }

      const userData = await api.getUsersByStatus(status, schoolID);
      setUsers(userData);
    } catch (error) {
      addNotification({
        message: 'Error loading user data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    green: { 
      label: 'Green Status', 
      bgColor: 'bg-green-100', 
      borderColor: 'border-green-300',
      textColor: 'text-green-800'
    },
    yellow: { 
      label: 'Yellow Status', 
      bgColor: 'bg-yellow-100', 
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800'
    },
    red: { 
      label: 'Red Status', 
      bgColor: 'bg-red-100', 
      borderColor: 'border-red-300',
      textColor: 'text-red-800'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Performance Monitor</h1>
        <p className="text-gray-600">Monitor user performance by status levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status as 'green' | 'yellow' | 'red')}
            className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              selectedStatus === status 
                ? `${config.bgColor} ${config.borderColor}` 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <StatusBadge status={status as 'green' | 'yellow' | 'red'} />
              </div>
              <h3 className={`font-semibold ${selectedStatus === status ? config.textColor : 'text-gray-900'}`}>
                {config.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View all {status} status users
              </p>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && selectedStatus && users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Users with {statusConfig[selectedStatus].label}
            </h3>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <LicenseBadge isLicensed={user.isLicensed} size="sm" />
                </div>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {user.role === 'TC' ? 'Teacher' : 'Student'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.wins} wins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && selectedStatus && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found with {selectedStatus} status.</p>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const handleSendMessage = () => {
    navigate(`/messages?userId=${user.id}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <div className="flex items-center space-x-2">
            <StatusBadge status={user.status} />
            <LicenseBadge isLicensed={user.isLicensed} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Role:</span>
            <p className="text-gray-600">
              {user.role === 'AD' ? 'Admin' : user.role === 'TC' ? 'Teacher' : 'Student'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Competition Wins:</span>
            <p className="text-gray-600">{user.wins}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Licensed:</span>
            <p className="text-gray-600">{user.isLicensed ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSendMessage}>
            Message User
          </Button>
        </div>
      </div>
    </Modal>
  );
};