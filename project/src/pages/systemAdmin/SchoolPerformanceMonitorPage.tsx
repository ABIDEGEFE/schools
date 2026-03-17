import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { School } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const SchoolPerformanceMonitorPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const handleStatusFilter = async (status: 'active' | 'inactive') => {
    setLoading(true);
    setSelectedStatus(status);
    try {
      const data = await api.getSchoolsByStatus(status);
      setSchools(data);
    } catch (error) {
      addNotification({ message: 'Error loading schools', type: 'error' });
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    active: { label: 'Active Schools', bgColor: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-800' },
    inactive: { label: 'Inactive Schools', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', textColor: 'text-gray-800' }
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">School Performance Monitor</h1>
        <p className="text-gray-600">Monitor registered schools by status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status as 'active' | 'inactive')}
            className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              selectedStatus === status ? `${config.bgColor} ${config.borderColor}` : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <StatusBadge status={(status === 'active' ? 'green' : 'red') as any} />
              </div>
              <h3 className={`font-semibold ${selectedStatus === status ? config.textColor : 'text-gray-900'}`}>
                {config.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">View all {status} schools</p>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && selectedStatus && schools.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{statusConfig[selectedStatus].label}</h3>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSchool(s)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{s.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{s.contact_email || s.address || 'No contact'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{s.number_of_students ?? '—'} students</span>
                  <span className="text-sm font-medium text-gray-900">{s.number_of_teachers ?? '—'} teachers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && selectedStatus && schools.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No schools found in {selectedStatus} status.</p>
        </div>
      )}

      <SchoolDetailModal school={selectedSchool} isOpen={!!selectedSchool} onClose={() => setSelectedSchool(null)} />
    </div>
  );
};

interface SchoolDetailModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
}

const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({ school, isOpen, onClose }) => {
  if (!school) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="School Details" size="md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
        <p className="text-sm text-gray-600">{school.address}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Contact Email</span>
            <p className="text-gray-600">{school.contact_email || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Contact Phone</span>
            <p className="text-gray-600">{school.contact_phone || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Students</span>
            <p className="text-gray-600">{school.number_of_students ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Teachers</span>
            <p className="text-gray-600">{school.number_of_teachers ?? '—'}</p>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};