from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
import os
from src.routes.auth import get_credentials

# Create blueprint for Google Sheets routes
sheets_bp = Blueprint('sheets', __name__)

@sheets_bp.route('/list')
@login_required
def list_sheets():
    """List all Google Sheets accessible to the user."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Drive API service
        drive_service = build('drive', 'v3', credentials=credentials)
        
        # Search for Google Sheets files
        results = drive_service.files().list(
            q="mimeType='application/vnd.google-apps.spreadsheet'",
            fields="files(id, name, webViewLink)"
        ).execute()
        
        sheets = results.get('files', [])
        return jsonify({'sheets': sheets})
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@sheets_bp.route('/<sheet_id>/metadata')
@login_required
def get_sheet_metadata(sheet_id):
    """Get metadata for a specific Google Sheet."""
    try:
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Sheets API service
        sheets_service = build('sheets', 'v4', credentials=credentials)
        
        # Get spreadsheet metadata
        spreadsheet = sheets_service.spreadsheets().get(
            spreadsheetId=sheet_id
        ).execute()
        
        # Extract sheet names and IDs
        sheets = [{
            'title': sheet['properties']['title'],
            'sheetId': sheet['properties']['sheetId']
        } for sheet in spreadsheet.get('sheets', [])]
        
        return jsonify({
            'spreadsheetId': spreadsheet['spreadsheetId'],
            'title': spreadsheet['properties']['title'],
            'sheets': sheets
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@sheets_bp.route('/<sheet_id>/data')
@login_required
def get_sheet_data(sheet_id):
    """Get data from a specific Google Sheet."""
    try:
        # Get query parameters
        range_name = request.args.get('range', 'A1:Z1000')  # Default range
        
        # Get user credentials
        credentials = get_credentials(current_user.id)
        if not credentials:
            return jsonify({'error': 'No valid credentials found'}), 401
        
        # Build the Sheets API service
        sheets_service = build('sheets', 'v4', credentials=credentials)
        
        # Get spreadsheet data
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range=range_name
        ).execute()
        
        # Get header row and data rows
        values = result.get('values', [])
        if not values:
            return jsonify({'error': 'No data found'}), 404
        
        headers = values[0]
        data = []
        
        # Convert rows to dictionaries using headers as keys
        for row in values[1:]:
            # Pad row with empty strings if it's shorter than headers
            padded_row = row + [''] * (len(headers) - len(row))
            data.append(dict(zip(headers, padded_row)))
        
        return jsonify({
            'headers': headers,
            'data': data
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500

@sheets_bp.route('/validate')
@login_required
def validate_sheet():
    """Validate if a Google Sheet has the required columns for blog posts."""
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
        
        # Get the first row (headers)
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range='A1:Z1'
        ).execute()
        
        # Check if required columns exist
        headers = result.get('values', [[]])[0]
        required_columns = ['Title', 'Content', 'Labels', 'Publish Date']
        missing_columns = [col for col in required_columns if col not in headers]
        
        if missing_columns:
            return jsonify({
                'valid': False,
                'missing_columns': missing_columns,
                'message': f"Missing required columns: {', '.join(missing_columns)}"
            })
        
        return jsonify({
            'valid': True,
            'message': 'Sheet has all required columns'
        })
    
    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'}), 500
