import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { MaterialMarketplacePage } from './pages/MaterialMarketplacePage'; 

// Pages
import { WelcomePage } from './pages/WelcomePage';
import { SchoolListPage } from './pages/SchoolListPage';
import { LoginPage } from './pages/LoginPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SchoolExplorerPage } from './pages/SchoolExplorerPage';
import { MessagesPage } from './pages/MessagesPage';
import { ExamsPage } from './pages/ExamsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { LicensingPage } from './pages/LicensingPage';
import { MaterialBankPage } from './pages/MaterialBankPage';

// Admin Pages
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { PerformanceMonitorPage } from './pages/admin/PerformanceMonitorPage';
import { AnnouncementManagerPage } from './pages/admin/AnnouncementManagerPage';

// System Admin Pages
import { SchoolManagementPage } from './pages/systemAdmin/SchoolManagementPage';
import { SchoolPerformanceMonitorPage } from './pages/systemAdmin/SchoolPerformanceMonitorPage';
import { SAannouncementPage } from './pages/systemAdmin/SAannouncementPage';

function App() {
  
  return (
    
    <NotificationProvider>
      <AuthProvider>
        <Router> 
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout showSidebar={false}><WelcomePage /></Layout>} />
            <Route path="/schools" element={<Layout showSidebar={false}><SchoolListPage /></Layout>} />
            <Route path="/login" element={<Layout showSidebar={false}><LoginPage /></Layout>} />
            <Route path="/reset-password" element={<Layout showSidebar={false}><PasswordResetPage /></Layout>} />
            
            {/* Admin Routes */}
            <Route path="/admin-portal" element={
              <ProtectedRoute requiredRole="AD">
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* System Admin Routes */}
            <Route path="/system-admin" element={
              <ProtectedRoute requiredRole="SA">
                <Layout>
                  <SchoolManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/system-admin/performance" element={
              <ProtectedRoute requiredRole="SA">
                <Layout>
                  <SchoolPerformanceMonitorPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/system-admin/announcements" element={
              <ProtectedRoute requiredRole="SA">
                <Layout>
                  <SAannouncementPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* General Authenticated User Routes */}
            <Route path="/marketplace" element={
            <ProtectedRoute>
              <Layout>
                <MaterialMarketplacePage />
              </Layout>
            </ProtectedRoute>
          } />
            <Route path="/admin-portal/performance" element={
              <ProtectedRoute requiredRole="AD">
                <Layout>
                  <PerformanceMonitorPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin-portal/announcements" element={
              <ProtectedRoute requiredRole="AD">
                <Layout>
                  <AnnouncementManagerPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* User Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <UserProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/explore/schools" element={
              <ProtectedRoute>
                <Layout>
                  <SchoolExplorerPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/exams" element={
              <ProtectedRoute>
                <Layout>
                  <ExamsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/announcements" element={
              <ProtectedRoute>
                <Layout>
                  <AnnouncementsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/license" element={
              <ProtectedRoute>
                <Layout>
                  <LicensingPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Licensed User Routes */}
            <Route path="/bank" element={
              <ProtectedRoute requiresLicense={true}>
                <Layout>
                  <MaterialBankPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Router>
      </AuthProvider>
    </NotificationProvider>
    
  );
}

export default App;