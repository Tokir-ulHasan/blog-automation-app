# Blog Automation App

A web application that automates posting blog articles from Google Sheets to Blogger.com.

## Project Overview

This application allows users to:
- Connect their Google account (OAuth 2.0)
- Link a Google Sheet containing blog content
- Connect to their Blogger.com account
- Automatically post content from the sheet to their blog
- Schedule future posts
- Monitor post status through a dashboard

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Vite for build tooling

### Backend
- Flask (Python)
- SQLAlchemy for database operations
- Google API integrations:
  - Google OAuth 2.0
  - Google Sheets API
  - Blogger API

## Project Structure

```
blog-automation-app/
├── backend/                # Flask backend
│   ├── venv/               # Python virtual environment
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── static/         # Static files
│   │   └── main.py         # Main entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── public/             # Public assets
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── ...             # Other source files
│   └── ...                 # Config files
│
├── README.md               # Project documentation
└── todo.md                 # Development checklist
```

## Setup Instructions

### Prerequisites
- Node.js and pnpm for frontend
- Python 3.11+ for backend
- Google Cloud Platform account for API access

### Backend Setup
1. Navigate to the backend directory
2. Activate the virtual environment
3. Install dependencies
4. Set up environment variables
5. Run the Flask application

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies with pnpm
3. Set up environment variables
4. Run the development server

## Deployment

### Frontend
- Deploy to Vercel

### Backend
- Deploy to Render or Railway

## Features

- Google OAuth 2.0 authentication
- Google Sheets integration
- Blogger API integration
- Post scheduling system
- Dashboard with post status and logs
- Retry functionality for failed posts

## License
MIT
