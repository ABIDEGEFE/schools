import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../utils/api';
import { School } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react';

export const SchoolManagementPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const list = await api.getSchools();
        setSchools(list);
      } catch (err) {
        addNotification({ message: 'Failed to load schools', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [addNotification]);

  const handleAdd = () => {
    setEditingSchool(null);
    setModalOpen(true);
  };

  const handleAdminAdd = async (adminData: { name: string; email: string; schoolId: string; role: string }) => {

    // ensure password is provided (api.registerAdmin expects password); default to a random pwd or 'password123'
  const pwd = (adminData as any).password || 'password123';
  // map UI role to backend role codes
  const roleCode = adminData.role === 'super_admin' ? 'SA' : 'AD';
  await api.registerAdmin({name: adminData.name, email: adminData.email, password: pwd, schoolId: adminData.schoolId, role: roleCode});
    addNotification({ message: 'School admin added', type: 'success' });
    setAdminModalOpen(false);
  };

  const handleEdit = (s: School) => {
    setEditingSchool(s);
    setModalOpen(true);
  };

  const handleDelete = async (id?: string) => {
    try {
      if (!id) return;
      await api.deleteSchool(id);
      setSchools(schools.filter(s => s.id !== id));
      addNotification({ message: 'School deleted', type: 'success' });
    } catch (err) {
      addNotification({ message: 'Failed to delete school', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSave = async (schoolData: Omit<School, 'id'>) => {
    try {
      if (editingSchool) {
        console.log('editingSchool', editingSchool);
        const updated = await api.updateSchool(editingSchool.id, schoolData);
        setSchools(schools.map(s => (s.id === editingSchool.id ? updated : s)));
        addNotification({ message: 'School updated', type: 'success' });
      } else {
        const created = await api.createSchool(schoolData);
        setSchools([...schools, created]);
        addNotification({ message: 'School created', type: 'success' });
      }
      setModalOpen(false);
    } catch (err) {
      addNotification({ message: 'Failed to save school', type: 'error' });
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
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-600">Manage registered schools across the system</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add New School</span>
        </Button>
        {/* Add School Admin handled per-row via person icon */}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teachers</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.address || '—'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.contact_email || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.contact_phone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={s.status} size="sm" /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.number_of_students ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.number_of_teachers ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-900 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => { setAdminModalOpen(true); setAdminSchoolId(s.id); }} className="text-gray-600 hover:text-gray-900 transition-colors" title="Add School Admin">
                      <UserPlus size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(s.id)} className="text-red-600 hover:text-red-900 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SchoolFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        school={editingSchool}
      />

      <AdminAddModal
        isOpen={adminModalOpen}
        onClose={() => { setAdminModalOpen(false); setAdminSchoolId(null); }}
        onAdd={handleAdminAdd}
        initialSchoolId={adminSchoolId || ''}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        schoolId={deleteConfirm || undefined}
        schoolName={schools.find(s => s.id === deleteConfirm)?.name || ''}
      />
    </div>
  );
};

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schoolData: Omit<School, 'id'>) => void;
  school: School | null;
}

const SchoolFormModal: React.FC<SchoolFormModalProps> = ({ isOpen, onClose, onSave, school }) => {
  const [form, setForm] = useState<Omit<School, 'id'>>({
    name: '',
    status: 'active',
    address: '',
    contact_email: '',
    contact_phone: '',
    number_of_students: 0,
    number_of_teachers: 0,
  });

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name,
        status: school.status,
        address: school.address || '',
        contact_email: (school as any).contact_email || '',
        contact_phone: (school as any).contact_phone || '',
        number_of_students: (school as any).number_of_students ?? 0,
        number_of_teachers: (school as any).number_of_teachers ?? 0,
      });
    } else {
      setForm({
        name: '',
        status: 'active',
        address: '',
        contact_email: '',
        contact_phone: '',
        number_of_students: 0,
        number_of_teachers: 0,
      });
    }
  }, [school]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name.includes('number_of') ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={school ? 'Edit School' : 'Add New School'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input name="contact_email" value={(form as any).contact_email} onChange={handleChange} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
          <input name="contact_phone" value={(form as any).contact_phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># Students</label>
            <input name="number_of_students" value={(form as any).number_of_students} onChange={handleChange} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># Teachers</label>
            <input name="number_of_teachers" value={(form as any).number_of_teachers} onChange={handleChange} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{school ? 'Update School' : 'Create School'}</Button>
        </div>
      </form>
    </Modal>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id?: string) => void;
  schoolName: string;
  schoolId?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, schoolName, schoolId }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
      <div className="space-y-4">
        <p className="text-gray-700">Are you sure you want to delete school <strong>{schoolName}</strong>? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(schoolId)}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
};

interface AdminAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (adminData: { name: string; email: string; schoolId: string; role: string; password?: string }) => void;
  initialSchoolId?: string;
}

const AdminAddModal: React.FC<AdminAddModalProps> = ({ isOpen, onClose, onAdd, initialSchoolId }) => {
  const [form, setForm] = useState({ name: '', email: '', schoolId: initialSchoolId || '', role: 'admin', password: '' });

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({ ...prev, schoolId: initialSchoolId || '' }));
    }
  }, [isOpen, initialSchoolId]);

  useEffect(() => {
    // if initialSchoolId prop passed, set it
    // (we'll read it via dataset or closure; better to accept prop)
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add School Admin" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" value={form.email} onChange={handleChange} type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
          <input name="schoolId" value={form.schoolId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" value={(form as any).password} onChange={handleChange} type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Admin</Button>
        </div>
      </form>
    </Modal>
  );
};
