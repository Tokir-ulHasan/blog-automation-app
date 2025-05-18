# Blog Automation App - Setup Guide

This guide will help you set up and deploy the Blog Automation App, which automates posting blog articles from Google Sheets to Blogger.com.

## Prerequisites

1. Google Cloud Platform account
2. Node.js and npm/pnpm (for frontend)
3. Python 3.11+ (for backend)
4. Vercel account (for frontend deployment)
5. Render or Railway account (for backend deployment)

## Google Cloud Platform Setup

### Create a New Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Note your Project ID

### Enable Required APIs

1. Navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Sheets API
   - Blogger API v3
   - Google Drive API
   - Google OAuth2 API

### Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production frontend URL (e.g., `https://your-app.vercel.app`)
5. Add authorized redirect URIs:
   - `http://localhost:5000/auth/callback` (for development)
   - Your production backend URL + `/auth/callback` (e.g., `https://your-api.onrender.com/auth/callback`)
6. Click "Create"
7. Note your Client ID and Client Secret

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd blog-automation-app/backend
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following content:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_PROJECT_ID=your_project_id
   OAUTH_REDIRECT_URI=http://localhost:5000/auth/callback
   FRONTEND_URL=http://localhost:3000
   SECRET_KEY=your_random_secret_key
   ```

5. Run the Flask application:
   ```bash
   python -m src.main
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd blog-automation-app/frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the frontend directory with the following content:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Run the development server:
   ```bash
   pnpm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python -m src.main`
4. Add environment variables (same as in the `.env` file)
5. Deploy the service

### Frontend Deployment (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure the project:
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL=https://your-backend-url.onrender.com`
5. Deploy the project

## Troubleshooting

### OAuth Issues

- Ensure your redirect URIs are correctly configured in Google Cloud Console
- Check that your Client ID and Client Secret are correctly set in environment variables
- Verify that your application has the necessary API permissions

### API Integration Issues

- Check the browser console for error messages
- Verify that your Google Sheet has the required columns: Title, Content, Labels, Publish Date
- Ensure your Blogger blog is accessible and you have posting permissions

### Deployment Issues

- Verify that all environment variables are correctly set in your deployment platform
- Check the deployment logs for any error messages
- Ensure your backend URL is correctly set in the frontend environment variables
