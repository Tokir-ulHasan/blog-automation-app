import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Blog Automation App</h1>
        <p className="mb-8 text-gray-600">
          Automate posting blog articles from Google Sheets to Blogger.com
        </p>
        
        {isAuthenticated ? (
          <Button 
            className="w-full" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
        )}
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Connect your Google account to:</p>
          <ul className="list-disc text-left pl-5 mt-2">
            <li>Link a Google Sheet with blog content</li>
            <li>Connect to your Blogger.com account</li>
            <li>Automate blog post publishing</li>
            <li>Schedule future posts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
