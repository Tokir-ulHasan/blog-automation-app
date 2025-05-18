from flask import Blueprint, redirect, url_for, session, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
import os
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import pathlib
import secrets
from src.models.user import User

# Create blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

# Define OAuth scopes needed for the application
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/blogger',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
]

# In-memory user storage (replace with database in production)
users = {}

def create_flow():
    """Create and configure OAuth flow."""
    # In production, these would be environment variables
    client_secrets = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID"),
            "project_id": os.getenv("GOOGLE_PROJECT_ID", "YOUR_PROJECT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_CLIENT_SECRET"),
            "redirect_uris": [os.getenv("OAUTH_REDIRECT_URI", "http://localhost:5000/auth/callback")]
        }
    }
    
    # Create a temporary client_secrets.json file
    secrets_file = pathlib.Path("client_secrets.json")
    with open(secrets_file, "w") as f:
        json.dump(client_secrets, f)
    
    # Create flow instance
    flow = Flow.from_client_secrets_file(
        str(secrets_file),
        scopes=SCOPES,
        redirect_uri=client_secrets["web"]["redirect_uris"][0]
    )
    
    # Clean up temporary file
    secrets_file.unlink()
    
    return flow

@auth_bp.route('/login')
def login():
    """Initiate Google OAuth login flow."""
    # Generate state token to prevent CSRF
    state = secrets.token_urlsafe(16)
    session['state'] = state
    
    # Create OAuth flow
    flow = create_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state,
        prompt='consent'  # Force to show consent screen to get refresh token
    )
    
    return jsonify({
        'authorization_url': authorization_url
    })

@auth_bp.route('/callback')
def callback():
    """Handle OAuth callback from Google."""
    # Verify state token to prevent CSRF
    state = session.get('state')
    if not state or state != request.args.get('state'):
        return jsonify({'error': 'Invalid state parameter'}), 401
    
    # Create OAuth flow
    flow = create_flow()
    
    # Exchange authorization code for credentials
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    
    # Get user info from Google
    user_info_service = build('oauth2', 'v2', credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()
    
    # Create or update user
    user_id = user_info['id']
    user = User(
        id=user_id,
        email=user_info['email'],
        name=user_info.get('name', ''),
        profile_pic=user_info.get('picture', ''),
        credentials=credentials_to_dict(credentials)
    )
    
    # Store user (in memory for now, would be database in production)
    users[user_id] = user
    
    # Log in the user
    login_user(user)
    
    # Redirect to frontend
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    return redirect(f"{frontend_url}/dashboard")

@auth_bp.route('/logout')
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    return jsonify({'message': 'Successfully logged out'})

@auth_bp.route('/user')
@login_required
def get_user():
    """Get current user information."""
    return jsonify(current_user.to_dict())

def credentials_to_dict(credentials):
    """Convert credentials object to dictionary for storage."""
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

def get_credentials(user_id):
    """Get credentials for a user and refresh if necessary."""
    user = users.get(user_id)
    if not user or not user.credentials:
        return None
    
    credentials = Credentials(
        token=user.credentials['token'],
        refresh_token=user.credentials['refresh_token'],
        token_uri=user.credentials['token_uri'],
        client_id=user.credentials['client_id'],
        client_secret=user.credentials['client_secret'],
        scopes=user.credentials['scopes']
    )
    
    # Refresh token if expired
    if credentials.expired:
        credentials.refresh(Request())
        # Update stored credentials
        user.credentials = credentials_to_dict(credentials)
        users[user_id] = user
    
    return credentials
