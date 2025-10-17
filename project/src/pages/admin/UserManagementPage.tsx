import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { User } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LicenseBadge } from '../../components/common/LicenseBadge';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const user = state.user;
  const schoolId = user?.schoolId;


  useEffect(() => {
    const fetchUsers = async () => {
      if (schoolId) {
        try {
          const userData = await api.getUsers(schoolId);
          setUsers(userData);
        } catch (error) {
          addNotification({
            message: 'Error loading users',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [schoolId, addNotification]);

  const handleAddUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async (id?: string) => {
    try {
      if (id) {
        await api.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        addNotification({
          message: 'User deleted successfully',
          type: 'success'
        });
      }
    } catch (error) {
      addNotification({
        message: 'Error deleting user',
        type: 'error'
      });
    }
    setDeleteConfirm(null);
  };

  const handleSaveUser = async (userData: Omit<User, 'id'>) => {
    try {
      if (editingUser) {
        const updatedUser = await api.updateUser(editingUser.id, userData);
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        addNotification({
          message: 'User updated successfully',
          type: 'success'
        });
      } else {
        const newUser = await api.createUser(userData);
        setUsers([...users, newUser]);
        addNotification({
          message: 'User created successfully',
          type: 'success'
        });
      }
      setModalOpen(false);
    } catch (error) {
      addNotification({
        message: 'Error saving user',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users in your school</p>
        </div>
        <Button onClick={handleAddUser} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add New User</span>
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wins
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {user.role === 'AD' ? 'Admin' : user.role === 'TC' ? 'Teacher' : user.role === 'SA' ? 'System Admin' : 'Student'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={user.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <LicenseBadge isLicensed={user.is_licensed} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        schoolId={schoolId || ''}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteUser}
        userId={deleteConfirm || undefined}
        userName={users.find(u => u.id === deleteConfirm)?.name || ''}
      />
    </div>
  );
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'>) => void;
  user: User | null;
  schoolId: string;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, schoolId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ST' as 'AD' | 'TC' | 'ST' | 'SA',
    schoolId: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: schoolId
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'ST',
        schoolId: ''
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      schoolId: schoolId,
      // provide frontend defaults to satisfy the User type
      status: 'green',
      isLicensed: false,
      wins: 0,
    } as Omit<User, 'id'>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ST">Student</option>
            <option value="TC">Teacher</option>
            <option value="AD">Admin</option>
            <option value="SA">System Admin</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id?: string) => void;
  userName: string;
  userId?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, userName, userId }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete user <strong>{userName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(userId)}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};