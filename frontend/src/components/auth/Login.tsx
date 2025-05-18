import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { LucideGithub, LucideLogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl">Blog Automation</CardTitle>
          <CardDescription>
            Connect your Google account to automate blog posts from Google Sheets to Blogger
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            This application requires access to your Google account to:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-500">
            <li>Read your Google Sheets data</li>
            <li>Manage your Blogger blogs</li>
            <li>Verify your identity</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={login}
          >
            <LucideLogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
