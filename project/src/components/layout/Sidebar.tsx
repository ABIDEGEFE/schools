import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  BarChart3, 
  Megaphone, 
  User, 
  School, 
  MessageCircle, 
  FileText, 
  Banknote,
  Award
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;

  if (!user) return null;

  const adminLinks = [
    { to: '/admin-portal', icon: Users, label: 'User Management' },
    { to: '/admin-portal/performance', icon: BarChart3, label: 'Performance Monitor' },
    { to: '/admin-portal/announcements', icon: Megaphone, label: 'Announcements' },
  ];

  const systemAdminLinks = [
    { to: '/system-admin/announcements', icon: Megaphone, label: 'Manage Announcements' },
    { to: '/system-admin', icon: School, label: 'Manage Schools' },
    { to: '/system-admin/performance', icon: BarChart3, label: 'Schools Performance' },
  ];

  const userLinks = [
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/explore/schools', icon: School, label: 'Explore Schools' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/exams', icon: FileText, label: 'Exams' },
    { to: '/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/license', icon: Award, label: 'Licensing' },
  ];

  const licenseOnlyLinks = [
    { to: '/bank', icon: Banknote, label: 'Material Bank' },
  ];

  const links = user.role === 'AD' ? adminLinks : user.role === 'SA' ? systemAdminLinks : [
    ...userLinks,
    ...(user.is_licensed ? licenseOnlyLinks : [])
  ];

  return (
    <nav className="bg-blue shadow-sm w-64 min-h-screen border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {user.role === 'AD' ? 'Admin Portal' : 'Dashboard'}
        </h2>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};