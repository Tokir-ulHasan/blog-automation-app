import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ConnectSheet from './components/sheets/ConnectSheet';
import ConnectBlogger from './components/blogger/ConnectBlogger';
import PostScheduler from './components/scheduler/PostScheduler';
import AuthProvider, { useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/connect-sheet" 
            element={
              <ProtectedRoute>
                <ConnectSheet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/connect-blogger" 
            element={
              <ProtectedRoute>
                <ConnectBlogger />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scheduler" 
            element={
              <ProtectedRoute>
                <PostScheduler />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
