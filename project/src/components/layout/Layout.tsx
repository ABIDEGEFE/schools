import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({children, showSidebar = true }) => {
  const { state } = useAuth();
  const showSidebarForUser = showSidebar && state.isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {showSidebarForUser && <Sidebar />}
        <main className={`flex-1 ${showSidebarForUser ? 'ml-0' : ''} p-6`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};