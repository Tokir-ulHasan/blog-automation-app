# Blog Automation App - API Documentation

This document provides details about the API endpoints available in the Blog Automation App.

## Base URL

- Development: `http://localhost:5000`
- Production: Your deployed backend URL

## Authentication Endpoints

### GET /auth/login

Initiates the Google OAuth login flow.

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

### GET /auth/callback

Handles the OAuth callback from Google. This endpoint is called by Google after the user authorizes the application.

**Redirects to:** Frontend dashboard URL

### GET /auth/logout

Logs out the current user.

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### GET /auth/user

Gets information about the currently authenticated user.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "profile_pic": "https://profile-picture-url.com"
}
```

## Google Sheets Endpoints

### GET /sheets/list

Lists all Google Sheets accessible to the user.

**Response:**
```json
{
  "sheets": [
    {
      "id": "sheet_id",
      "name": "Sheet Name",
      "webViewLink": "https://docs.google.com/spreadsheets/d/..."
    }
  ]
}
```

### GET /sheets/{sheet_id}/metadata

Gets metadata for a specific Google Sheet.

**Response:**
```json
{
  "spreadsheetId": "sheet_id",
  "title": "Sheet Title",
  "sheets": [
    {
      "title": "Sheet1",
      "sheetId": 0
    }
  ]
}
```

### GET /sheets/{sheet_id}/data

Gets data from a specific Google Sheet.

**Query Parameters:**
- `range` (optional): The range to get data from (default: "A1:Z1000")

**Response:**
```json
{
  "headers": ["Title", "Content", "Labels", "Publish Date"],
  "data": [
    {
      "Title": "Post Title",
      "Content": "Post content...",
      "Labels": "label1,label2",
      "Publish Date": "2025-05-20T10:00:00"
    }
  ]
}
```

### GET /sheets/validate

Validates if a Google Sheet has the required columns for blog posts.

**Query Parameters:**
- `sheet_id` (required): The ID of the sheet to validate

**Response:**
```json
{
  "valid": true,
  "message": "Sheet has all required columns"
}
```

## Blogger Endpoints

### GET /blogger/blogs

Lists all blogs owned by the user.

**Response:**
```json
{
  "blogs": [
    {
      "id": "blog_id",
      "name": "Blog Name",
      "url": "https://example.blogspot.com",
      "posts": {
        "totalItems": 10
      }
    }
  ]
}
```

### GET /blogger/blogs/{blog_id}

Gets details for a specific blog.

**Response:**
```json
{
  "blog": {
    "id": "blog_id",
    "name": "Blog Name",
    "url": "https://example.blogspot.com",
    "description": "Blog description..."
  }
}
```

### GET /blogger/blogs/{blog_id}/posts

Lists posts for a specific blog.

**Response:**
```json
{
  "posts": [
    {
      "id": "post_id",
      "title": "Post Title",
      "published": "2025-05-18T10:00:00",
      "url": "https://example.blogspot.com/post-url"
    }
  ]
}
```

### POST /blogger/blogs/{blog_id}/posts

Creates a new post on a specific blog.

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "labels": ["label1", "label2"],
  "publishDate": "2025-05-20T10:00:00",
  "isDraft": false
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post_id",
    "title": "Post Title",
    "url": "https://example.blogspot.com/post-url"
  }
}
```

### PUT /blogger/blogs/{blog_id}/posts/{post_id}

Updates an existing post.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "labels": ["label1", "label2"]
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post_id",
    "title": "Updated Title",
    "url": "https://example.blogspot.com/post-url"
  }
}
```

### DELETE /blogger/blogs/{blog_id}/posts/{post_id}

Deletes a post.

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### POST /blogger/publish-from-sheet

Publishes posts from Google Sheet to Blogger.

**Request Body:**
```json
{
  "sheetId": "sheet_id",
  "blogId": "blog_id"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "row": 2,
      "title": "Post Title",
      "status": "success",
      "postId": "post_id",
      "url": "https://example.blogspot.com/post-url"
    }
  ]
}
```

## Scheduler Endpoints

### GET /scheduler/pending-posts

Gets posts scheduled for future publication from Google Sheet.

**Query Parameters:**
- `sheet_id` (required): The ID of the sheet to check

**Response:**
```json
{
  "pendingPosts": [
    {
      "row": 2,
      "title": "Post Title",
      "content": "Post content...",
      "publishDate": "2025-05-20T10:00:00",
      "formattedDate": "2025-05-20 10:00:00",
      "labels": "label1,label2"
    }
  ]
}
```

### POST /scheduler/publish-now

Manually publishes a post that was scheduled for the future.

**Request Body:**
```json
{
  "sheetId": "sheet_id",
  "blogId": "blog_id",
  "row": 2
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post_id",
    "title": "Post Title",
    "url": "https://example.blogspot.com/post-url"
  }
}
```

### POST /scheduler/check-posts

Checks for posts that are due for publication based on current time.

**Request Body:**
```json
{
  "sheetId": "sheet_id",
  "blogId": "blog_id"
}
```

**Response:**
```json
{
  "success": true,
  "publishedPosts": [
    {
      "row": 2,
      "title": "Post Title",
      "status": "success",
      "postId": "post_id",
      "url": "https://example.blogspot.com/post-url"
    }
  ]
}
```

## Status Endpoints

### GET /status

Gets the API status and authentication state.

**Response:**
```json
{
  "status": "ok",
  "authenticated": true
}
```

### GET /

API root endpoint.

**Response:**
```json
{
  "message": "Blog Automation API",
  "status": "running",
  "endpoints": {
    "auth": "/auth",
    "sheets": "/sheets",
    "blogger": "/blogger",
    "scheduler": "/scheduler"
  }
}
```
