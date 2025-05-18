import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LucideAlertCircle, LucideCheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../layout/Navbar';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ConnectSheet: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user's sheets on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSheets();
    }
  }, [isAuthenticated]);

  const fetchSheets = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/sheets/list`);
      setSheets(response.data.sheets || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      setError('Failed to load Google Sheets. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSheetSelect = (sheet: any) => {
    setSelectedSheet(sheet);
    // Validate if sheet has required columns
    validateSheet(sheet.id);
  };

  const validateSheet = async (sheetId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/sheets/validate?sheet_id=${sheetId}`);
      if (!response.data.valid) {
        setError(`Invalid sheet format: ${response.data.message}`);
      } else {
        setError(null);
        setSuccessMessage('Sheet validated successfully! It has all required columns.');
        
        // Store selected sheet in localStorage for persistence
        localStorage.setItem('selectedSheet', JSON.stringify(selectedSheet));
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error validating sheet:', error);
      setError('Failed to validate sheet format. Please ensure it has Title, Content, Labels, and Publish Date columns.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Connect Google Sheet</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <LucideAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <LucideCheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sheet Requirements</CardTitle>
            <CardDescription>
              Your Google Sheet must have the following columns:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Title</strong> - The title of your blog post</li>
              <li><strong>Content</strong> - The main content of your blog post (HTML supported)</li>
              <li><strong>Labels</strong> - Comma-separated tags for your post (optional)</li>
              <li><strong>Publish Date</strong> - Date when the post should be published (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Select a Google Sheet</CardTitle>
            <CardDescription>
              Choose a Google Sheet that contains your blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading your Google Sheets...</div>
            ) : sheets.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No Google Sheets found. Please create a sheet with the required columns.
              </div>
            ) : (
              <div className="space-y-4">
                {sheets.map((sheet) => (
                  <div 
                    key={sheet.id} 
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSheet?.id === sheet.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSheetSelect(sheet)}
                  >
                    <h3 className="font-medium">{sheet.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {sheet.id}
                    </p>
                    {sheet.webViewLink && (
                      <a 
                        href={sheet.webViewLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in Google Sheets
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={fetchSheets}
              disabled={isLoading}
            >
              Refresh Sheets
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConnectSheet;
