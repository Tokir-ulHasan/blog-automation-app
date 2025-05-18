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

const ConnectBlogger: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user's blogs on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogs();
    }
  }, [isAuthenticated]);

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

  const handleBlogSelect = (blog: any) => {
    setSelectedBlog(blog);
    setSuccessMessage('Blog selected successfully!');
    
    // Store selected blog in localStorage for persistence
    localStorage.setItem('selectedBlog', JSON.stringify(blog));
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Connect Blogger Blog</h1>
        
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
        
        <Card>
          <CardHeader>
            <CardTitle>Select a Blogger Blog</CardTitle>
            <CardDescription>
              Choose a Blogger blog where you want to publish posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading your Blogger blogs...</div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No Blogger blogs found. Please create a blog on Blogger.com first.
              </div>
            ) : (
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div 
                    key={blog.id} 
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedBlog?.id === blog.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleBlogSelect(blog)}
                  >
                    <h3 className="font-medium">{blog.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {blog.url}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {blog.posts?.totalItems || 0} posts
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <a 
                      href={blog.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Blog
                    </a>
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
              onClick={fetchBlogs}
              disabled={isLoading}
            >
              Refresh Blogs
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConnectBlogger;
