import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  LucideAlertCircle, 
  LucideCheckCircle2, 
  LucideClipboardList, 
  LucideRefreshCw, 
  LucideSettings, 
  LucideUser 
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../layout/Navbar';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [sheets, setSheets] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user's sheets and blogs on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSheets();
      fetchBlogs();
    }
  }, [isAuthenticated]);

  // Load pending posts when sheet and blog are selected
  useEffect(() => {
    if (selectedSheet && selectedBlog) {
      fetchPendingPosts();
    }
  }, [selectedSheet, selectedBlog]);

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

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/blogger/blogs`);
      setBlogs(response.data.blogs || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Failed to load Blogger blogs. Please try again.');
      setIsLoading(false);
    }
  };

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

  const handleSheetSelect = (sheet: any) => {
    setSelectedSheet(sheet);
    // Validate if sheet has required columns
    validateSheet(sheet.id);
  };

  const handleBlogSelect = (blog: any) => {
    setSelectedBlog(blog);
  };

  const validateSheet = async (sheetId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/sheets/validate?sheet_id=${sheetId}`);
      if (!response.data.valid) {
        setError(`Invalid sheet format: ${response.data.message}`);
      } else {
        setError(null);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error validating sheet:', error);
      setError('Failed to validate sheet format. Please ensure it has Title, Content, Labels, and Publish Date columns.');
      setIsLoading(false);
    }
  };

  const publishNow = async (row: number) => {
    if (!selectedSheet || !selectedBlog) return;
    
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
        // Add to published posts
        setPublishedPosts([...publishedPosts, {
          ...response.data.post,
          status: 'success',
          publishedAt: new Date().toISOString()
        }]);
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
    if (!selectedSheet || !selectedBlog) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/scheduler/check-posts`, {
        sheetId: selectedSheet.id,
        blogId: selectedBlog.id
      });
      
      if (response.data.success) {
        // Update published posts
        setPublishedPosts([...publishedPosts, ...response.data.publishedPosts]);
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

  const publishFromSheet = async () => {
    if (!selectedSheet || !selectedBlog) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/blogger/publish-from-sheet`, {
        sheetId: selectedSheet.id,
        blogId: selectedBlog.id
      });
      
      if (response.data.success) {
        // Update published posts
        const successPosts = response.data.results.filter((result: any) => result.status === 'success');
        setPublishedPosts([...publishedPosts, ...successPosts]);
        setSuccessMessage(`${successPosts.length} posts published!`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error publishing from sheet:', error);
      setError('Failed to publish posts. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Google Account</span>
                  <span className={`text-sm ${user ? 'text-green-500' : 'text-red-500'}`}>
                    {user ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Google Sheet</span>
                  <span className={`text-sm ${selectedSheet ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedSheet ? 'Selected' : 'Not Selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Blogger Blog</span>
                  <span className={`text-sm ${selectedBlog ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedBlog ? 'Selected' : 'Not Selected'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col w-full gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/connect-sheet')}
                  disabled={!user}
                >
                  {selectedSheet ? 'Change Sheet' : 'Connect Sheet'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/connect-blogger')}
                  disabled={!user}
                >
                  {selectedBlog ? 'Change Blog' : 'Connect Blog'}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={publishFromSheet}
                  disabled={!selectedSheet || !selectedBlog || isLoading}
                >
                  Publish All Ready Posts
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={checkPosts}
                  disabled={!selectedSheet || !selectedBlog || isLoading}
                >
                  <LucideRefreshCw className="mr-2 h-4 w-4" />
                  Check for Due Posts
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={fetchPendingPosts}
                  disabled={!selectedSheet || isLoading}
                >
                  Refresh Pending Posts
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-500">
                Note: Scheduled publishing requires manual checking due to system limitations.
              </p>
            </CardFooter>
          </Card>
          
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Posts</span>
                  <span className="text-sm font-bold">{pendingPosts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Published Posts</span>
                  <span className="text-sm font-bold">{publishedPosts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Sheets</span>
                  <span className="text-sm font-bold">{sheets.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Blogs</span>
                  <span className="text-sm font-bold">{blogs.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending Posts</TabsTrigger>
            <TabsTrigger value="published">Published Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Posts</CardTitle>
                <CardDescription>
                  Posts scheduled for future publication from your Google Sheet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : pendingPosts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No pending posts found. Make sure you have selected a Google Sheet with future-dated posts.
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
              <CardFooter>
                <p className="text-xs text-gray-500">
                  Note: Due to system limitations, scheduled posts require manual publishing.
                  Use the "Check for Due Posts" button to publish posts that have reached their scheduled date.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="published">
            <Card>
              <CardHeader>
                <CardTitle>Published Posts</CardTitle>
                <CardDescription>
                  Posts that have been successfully published to your blog
                </CardDescription>
              </CardHeader>
              <CardContent>
                {publishedPosts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No published posts yet. Use the "Publish All Ready Posts" button to publish content from your sheet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publishedPosts.map((post, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-sm text-gray-500">
                              Published: {new Date(post.publishedAt || post.published).toLocaleString()}
                            </p>
                            {post.url && (
                              <a 
                                href={post.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                              >
                                View Post
                              </a>
                            )}
                          </div>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Published
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
