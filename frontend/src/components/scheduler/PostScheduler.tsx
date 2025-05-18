import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LucideAlertCircle, LucideCheckCircle2, LucideCalendar } from 'lucide-react';
import axios from 'axios';
import Navbar from '../layout/Navbar';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostScheduler: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load selected sheet and blog from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      const storedSheet = localStorage.getItem('selectedSheet');
      const storedBlog = localStorage.getItem('selectedBlog');
      
      if (storedSheet) {
        setSelectedSheet(JSON.parse(storedSheet));
      }
      
      if (storedBlog) {
        setSelectedBlog(JSON.parse(storedBlog));
      }
    }
  }, [isAuthenticated]);

  // Load pending posts when sheet is selected
  useEffect(() => {
    if (selectedSheet) {
      fetchPendingPosts();
    }
  }, [selectedSheet]);

  const fetchPendingPosts = async () => {
    if (!selectedSheet) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/scheduler/pending-posts?sheet_id=${selectedSheet.id}`);
      setPendingPosts(response.data.pendingPosts || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching pending posts:', error);
      setError('Failed to load pending posts. Please try again.');
      setIsLoading(false);
    }
  };

  const publishNow = async (row: number) => {
    if (!selectedSheet || !selectedBlog) {
      setError('Please select both a Google Sheet and a Blogger blog first.');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/scheduler/publish-now`, {
        sheetId: selectedSheet.id,
        blogId: selectedBlog.id,
        row
      });
      
      if (response.data.success) {
        // Remove from pending posts
        setPendingPosts(pendingPosts.filter(post => post.row !== row));
        setSuccessMessage('Post published successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error publishing post:', error);
      setError('Failed to publish post. Please try again.');
      setIsLoading(false);
    }
  };

  const checkPosts = async () => {
    if (!selectedSheet || !selectedBlog) {
      setError('Please select both a Google Sheet and a Blogger blog first.');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/scheduler/check-posts`, {
        sheetId: selectedSheet.id,
        blogId: selectedBlog.id
      });
      
      if (response.data.success) {
        // Refresh pending posts
        fetchPendingPosts();
        setSuccessMessage(`${response.data.publishedPosts.length} posts published!`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking posts:', error);
      setError('Failed to check posts. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Post Scheduler</h1>
        
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
            <CardTitle>About Post Scheduling</CardTitle>
            <CardDescription>
              How post scheduling works in this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Due to system limitations, this application uses a manual approach to scheduled posts:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Add posts with future dates to your Google Sheet</li>
                <li>Use the "Check for Due Posts" button to publish posts that have reached their scheduled date</li>
                <li>Alternatively, use the "Publish Now" button to publish a specific post immediately</li>
              </ol>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> The system does not automatically publish posts at their scheduled time.
                  You must manually check for due posts using the button below.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={checkPosts}
              disabled={!selectedSheet || !selectedBlog || isLoading}
            >
              <LucideCalendar className="mr-2 h-4 w-4" />
              Check for Due Posts
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Posts</CardTitle>
            <CardDescription>
              Posts scheduled for future publication from your Google Sheet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedSheet ? (
              <div className="text-center py-4 text-gray-500">
                Please select a Google Sheet first.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/connect-sheet')}
                  >
                    Connect Sheet
                  </Button>
                </div>
              </div>
            ) : !selectedBlog ? (
              <div className="text-center py-4 text-gray-500">
                Please select a Blogger blog first.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/connect-blogger')}
                  >
                    Connect Blog
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : pendingPosts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No pending posts found. Make sure you have future-dated posts in your Google Sheet.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{post.title}</h3>
                        <p className="text-sm text-gray-500">
                          Scheduled for: {post.formattedDate}
                        </p>
                        {post.labels && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.labels.split(',').map((label: string, i: number) => (
                              <span 
                                key={i} 
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {label.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => publishNow(post.row)}
                        disabled={isLoading}
                      >
                        Publish Now
                      </Button>
                    </div>
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
              onClick={fetchPendingPosts}
              disabled={!selectedSheet || isLoading}
            >
              Refresh Posts
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PostScheduler;
