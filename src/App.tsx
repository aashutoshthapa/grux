import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ContactSubmissions from './pages/ContactSubmissions';
import AllMembers from './pages/AllMembers';
import MemberDetail from './pages/MemberDetail';
import MemberForm from './components/MemberForm';
import RenewMembership from './pages/RenewMembership';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';

// Protected Route component to secure admin routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const adminEmail = localStorage.getItem('adminEmail');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (adminEmail && loginTime) {
        // Check if session has expired (8 hours)
        const currentTime = Date.now();
        const loginTimeMs = parseInt(loginTime, 10);
        const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        if (currentTime - loginTimeMs > SESSION_DURATION) {
          // Session expired
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminName');
          localStorage.removeItem('adminLoginTime');
          localStorage.removeItem('isAdminLoggedIn');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-gym-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/contacts" element={
          <ProtectedRoute>
            <ContactSubmissions />
          </ProtectedRoute>
        } />
        <Route path="/admin/members" element={
          <ProtectedRoute>
            <AllMembers />
          </ProtectedRoute>
        } />
        <Route path="/admin/members/:id" element={
          <ProtectedRoute>
            <MemberDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/members/add" element={
          <ProtectedRoute>
            <MemberForm />
          </ProtectedRoute>
        } />
        <Route path="/admin/members/renew/:id" element={
          <ProtectedRoute>
            <RenewMembership />
          </ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute>
            <ActivityLogs />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
