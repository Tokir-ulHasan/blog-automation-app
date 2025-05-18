from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os
from datetime import datetime
from src.routes.auth import get_credentials

# Create blueprint for scheduler routes
scheduler_bp = Blueprint('scheduler', __name__)

@scheduler_bp.route('/pending-posts')
@login_required
def get_pending_posts():
    """Get posts scheduled for future publication from Google Sheet."""
    try:
        # Get query parameters
        sheet_id = request.args.get('sheet_id')
        if not sheet_id:
            return jsonify({'error': 'sheet_id parameter is required'}), 400
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Sheets API service
        sheets_service = build('sheets', 'v4', credentials=credentials)
        
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
        required_columns = ['Title', 'Content', 'Publish Date']
        missing_columns = [col for col in required_columns if col not in headers]
        if missing_columns:
            return jsonify({
                'error': f"Missing required columns: {', '.join(missing_columns)}"
            }), 400
        
        # Get column indices
        title_idx = headers.index('Title')
        content_idx = headers.index('Content')
        publish_date_idx = headers.index('Publish Date')
        labels_idx = headers.index('Labels') if 'Labels' in headers else None
        
        # Get current time
        now = datetime.now()
        
        # Find pending posts (with future publish dates)
        pending_posts = []
        
        for i, row in enumerate(values[1:], start=2):  # Start from 2 to account for 1-indexed rows and header
            # Skip empty rows or rows without dates
            if (len(row) <= title_idx or not row[title_idx] or 
                len(row) <= publish_date_idx or not row[publish_date_idx]):
                continue
            
            try:
                # Parse the publish date
                publish_date = datetime.fromisoformat(row[publish_date_idx].replace('Z', '+00:00'))
                
                # Check if it's in the future
                if publish_date > now:
                    post = {
                        'row': i,
                        'title': row[title_idx],
                        'content': row[content_idx] if len(row) > content_idx else '',
                        'publishDate': row[publish_date_idx],
                        'formattedDate': publish_date.strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                    # Add labels if available
                    if labels_idx is not None and len(row) > labels_idx and row[labels_idx]:
                        post['labels'] = row[labels_idx]
                    
                    pending_posts.append(post)
            except ValueError:
                # Skip rows with invalid date formats
                continue
        
        return jsonify({
            'pendingPosts': pending_posts
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@scheduler_bp.route('/publish-now', methods=['POST'])
@login_required
def publish_now():
    """Manually publish a post that was scheduled for the future."""
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['sheetId', 'blogId', 'row']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        sheet_id = data['sheetId']
        blog_id = data['blogId']
        row = data['row']
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the services
        sheets_service = build('sheets', 'v4', credentials=credentials)
        blogger_service = build('blogger', 'v3', credentials=credentials)
        
        # Get the specific row from the sheet
        range_name = f'A{row}:Z{row}'
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range=range_name
        ).execute()
        
        row_values = result.get('values', [[]])
        if not row_values or not row_values[0]:
            return jsonify({'error': 'Row not found or empty'}), 404
        
        # Get the header row to map columns
        headers_result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range='A1:Z1'
        ).execute()
        
        headers = headers_result.get('values', [[]])[0]
        
        # Get column indices
        title_idx = headers.index('Title') if 'Title' in headers else None
        content_idx = headers.index('Content') if 'Content' in headers else None
        labels_idx = headers.index('Labels') if 'Labels' in headers else None
        
        if title_idx is None or content_idx is None:
            return jsonify({'error': 'Required columns not found in sheet'}), 400
        
        row_data = row_values[0]
        
        # Prepare post data
        post_body = {
            'title': row_data[title_idx] if len(row_data) > title_idx else 'Untitled',
            'content': row_data[content_idx] if len(row_data) > content_idx else ''
        }
        
        # Add labels if available
        if labels_idx is not None and len(row_data) > labels_idx and row_data[labels_idx]:
            post_body['labels'] = [label.strip() for label in row_data[labels_idx].split(',')]
        
        # Create the post
        post = blogger_service.posts().insert(
            blogId=blog_id,
            body=post_body
        ).execute()
        
        # Update the sheet to mark as published (optional)
        # This would require adding a "Status" column to the sheet
        
        return jsonify({
            'success': True,
            'post': post
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@scheduler_bp.route('/check-posts', methods=['POST'])
@login_required
def check_posts():
    """Check for posts that are due for publication based on current time."""
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
        required_columns = ['Title', 'Content', 'Publish Date']
        missing_columns = [col for col in required_columns if col not in headers]
        if missing_columns:
            return jsonify({
                'error': f"Missing required columns: {', '.join(missing_columns)}"
            }), 400
        
        # Get column indices
        title_idx = headers.index('Title')
        content_idx = headers.index('Content')
        publish_date_idx = headers.index('Publish Date')
        labels_idx = headers.index('Labels') if 'Labels' in headers else None
        
        # Get current time
        now = datetime.now()
        
        # Find posts due for publication
        published_posts = []
        
        for i, row in enumerate(values[1:], start=2):  # Start from 2 to account for 1-indexed rows and header
            # Skip empty rows or rows without dates
            if (len(row) <= title_idx or not row[title_idx] or 
                len(row) <= publish_date_idx or not row[publish_date_idx]):
                continue
            
            try:
                # Parse the publish date
                publish_date = datetime.fromisoformat(row[publish_date_idx].replace('Z', '+00:00'))
                
                # Check if it's due for publication (past or current date)
                if publish_date <= now:
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
                        
                        published_posts.append({
                            'row': i,
                            'title': row[title_idx],
                            'status': 'success',
                            'postId': post['id'],
                            'url': post.get('url', '')
                        })
                    except Exception as e:
                        published_posts.append({
                            'row': i,
                            'title': row[title_idx],
                            'status': 'error',
                            'message': str(e)
                        })
            except ValueError:
                # Skip rows with invalid date formats
                continue
        
        return jsonify({
            'success': True,
            'publishedPosts': published_posts
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500
