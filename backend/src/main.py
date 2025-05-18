import os
import json
from flask import Flask, jsonify, request, session
from flask_login import LoginManager, current_user
import secrets
from src.routes.auth import auth_bp
from src.routes.sheets import sheets_bp
from src.routes.blogger import blogger_bp
from src.routes.scheduler import scheduler_bp
from src.models.user import User

# Create Flask app
app = Flask(__name__)

# Configure app
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(16))
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)

# In-memory user storage (replace with database in production)
users = {}

@login_manager.user_loader
def load_user(user_id):
    """Load user from storage."""
    return users.get(user_id)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(sheets_bp, url_prefix='/sheets')
app.register_blueprint(blogger_bp, url_prefix='/blogger')
app.register_blueprint(scheduler_bp, url_prefix='/scheduler')

# CORS handling for development
@app.after_request
def after_request(response):
    """Add CORS headers to response."""
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Origin', frontend_url)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/')
def index():
    """API root endpoint."""
    return jsonify({
        'message': 'Blog Automation API',
        'status': 'running',
        'endpoints': {
            'auth': '/auth',
            'sheets': '/sheets',
            'blogger': '/blogger',
            'scheduler': '/scheduler'
        }
    })

@app.route('/status')
def status():
    """API status endpoint."""
    return jsonify({
        'status': 'ok',
        'authenticated': current_user.is_authenticated
    })

if __name__ == '__main__':
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
