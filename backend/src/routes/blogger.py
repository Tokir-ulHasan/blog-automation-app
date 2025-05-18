from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
import os
from datetime import datetime
from src.routes.auth import get_credentials

# Create blueprint for Blogger routes
blogger_bp = Blueprint('blogger', __name__)

@blogger_bp.route('/blogs')
@login_required
def list_blogs():
    """List all blogs owned by the user."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get the list of blogs
        blogs = blogger_service.blogs().listByUser(userId='self').execute()
        
        return jsonify({'blogs': blogs.get('items', [])})
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/blogs/<blog_id>')
@login_required
def get_blog(blog_id):
    """Get details for a specific blog."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get blog details
        blog = blogger_service.blogs().get(blogId=blog_id).execute()
        
        return jsonify({'blog': blog})
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/blogs/<blog_id>/posts')
@login_required
def list_posts(blog_id):
    """List posts for a specific blog."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get posts
        posts = blogger_service.posts().list(
            blogId=blog_id,
            maxResults=10  # Adjust as needed
        ).execute()
        
        return jsonify({'posts': posts.get('items', [])})
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/blogs/<blog_id>/posts', methods=['POST'])
@login_required
def create_post(blog_id):
    """Create a new post on a specific blog."""
    try:
        # Get post data from request
        post_data = request.json
        if not post_data:
            return jsonify({'error': 'No post data provided'}), 400
        
        # Validate required fields
        required_fields = ['title', 'content']
        missing_fields = [field for field in required_fields if field not in post_data]
        if missing_fields:
            return jsonify({
                'error': f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Prepare post body
        post_body = {
            'title': post_data['title'],
            'content': post_data['content']
        }
        
        # Add labels if provided
        if 'labels' in post_data and post_data['labels']:
            # Convert comma-separated string to list if needed
            labels = post_data['labels']
            if isinstance(labels, str):
                labels = [label.strip() for label in labels.split(',')]
            post_body['labels'] = labels
        
        # Add publish date if provided
        if 'publishDate' in post_data and post_data['publishDate']:
            # Format date for Blogger API
            try:
                # Parse the date string
                publish_date = datetime.fromisoformat(post_data['publishDate'].replace('Z', '+00:00'))
                # Format for Blogger API
                post_body['published'] = publish_date.isoformat()
            except ValueError:
                return jsonify({'error': 'Invalid publish date format'}), 400
        
        # Create the post
        post = blogger_service.posts().insert(
            blogId=blog_id,
            body=post_body,
            isDraft=post_data.get('isDraft', False)
        ).execute()
        
        return jsonify({
            'success': True,
            'post': post
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/blogs/<blog_id>/posts/<post_id>', methods=['PUT'])
@login_required
def update_post(blog_id, post_id):
    """Update an existing post."""
    try:
        # Get post data from request
        post_data = request.json
        if not post_data:
            return jsonify({'error': 'No post data provided'}), 400
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get existing post
        existing_post = blogger_service.posts().get(
            blogId=blog_id,
            postId=post_id
        ).execute()
        
        # Update post fields
        if 'title' in post_data:
            existing_post['title'] = post_data['title']
        if 'content' in post_data:
            existing_post['content'] = post_data['content']
        if 'labels' in post_data:
            # Convert comma-separated string to list if needed
            labels = post_data['labels']
            if isinstance(labels, str):
                labels = [label.strip() for label in labels.split(',')]
            existing_post['labels'] = labels
        
        # Update the post
        updated_post = blogger_service.posts().update(
            blogId=blog_id,
            postId=post_id,
            body=existing_post
        ).execute()
        
        return jsonify({
            'success': True,
            'post': updated_post
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/blogs/<blog_id>/posts/<post_id>', methods=['DELETE'])
@login_required
def delete_post(blog_id, post_id):
    """Delete a post."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Blogger API service
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Delete the post
        blogger_service.posts().delete(
            blogId=blog_id,
            postId=post_id
        ).execute()
        
        return jsonify({
            'success': True,
            'message': 'Post deleted successfully'
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@blogger_bp.route('/publish-from-sheet', methods=['POST'])
@login_required
def publish_from_sheet():
    """Publish posts from Google Sheet to Blogger."""
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['sheetId', 'blogId']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        sheet_id = data['sheetId']
        blog_id = data['blogId']
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the services
        sheets_service = build('sheets', 'v4', credentials=credentials)
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get sheet data
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range='A1:Z1000'  # Adjust range as needed
        ).execute()
        
        values = result.get('values', [])
        if not values:
            return jsonify({'error': 'No data found in sheet'}), 404
        
        # Get headers and data
        headers = values[0]
        
        # Check required columns
        required_columns = ['Title', 'Content']
        for column in required_columns:
            if column not in headers:
                return jsonify({
                    'error': f"Required column '{column}' not found in sheet"
                }), 400
        
        # Get column indices
        title_idx = headers.index('Title')
        content_idx = headers.index('Content')
        labels_idx = headers.index('Labels') if 'Labels' in headers else None
        publish_date_idx = headers.index('Publish Date') if 'Publish Date' in headers else None
        
        # Process rows and create posts
        results = []
        now = datetime.now()
        
        for i, row in enumerate(values[1:], start=2):  # Start from 2 to account for 1-indexed rows and header
            # Skip empty rows
            if len(row) <= title_idx or not row[title_idx]:
                continue
                
            # Skip rows with future publish dates
            if publish_date_idx is not None and len(row) > publish_date_idx and row[publish_date_idx]:
                try:
                    publish_date = datetime.fromisoformat(row[publish_date_idx].replace('Z', '+00:00'))
                    if publish_date > now:
                        results.append({
                            'row': i,
                            'title': row[title_idx],
                            'status': 'skipped',
                            'message': 'Future publish date'
                        })
                        continue
                except ValueError:
                    # If date parsing fails, proceed with publishing
                    pass
            
            # Prepare post data
            post_body = {
                'title': row[title_idx],
                'content': row[content_idx] if len(row) > content_idx else ''
            }
            
            # Add labels if available
            if labels_idx is not None and len(row) > labels_idx and row[labels_idx]:
                post_body['labels'] = [label.strip() for label in row[labels_idx].split(',')]
            
            try:
                # Create the post
                post = blogger_service.posts().insert(
                    blogId=blog_id,
                    body=post_body
                ).execute()
                
                results.append({
                    'row': i,
                    'title': row[title_idx],
                    'status': 'success',
                    'postId': post['id'],
                    'url': post.get('url', '')
                })
            except Exception as e:
                results.append({
                    'row': i,
                    'title': row[title_idx],
                    'status': 'error',
                    'message': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500
