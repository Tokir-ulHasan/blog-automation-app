from flask_login import UserMixin
from datetime import datetime

class User(UserMixin):
    """User model for authentication and session management."""
    
    def __init__(self, id, email, name, profile_pic, credentials=None):
        self.id = id  # Google user ID
        self.email = email
        self.name = name
        self.profile_pic = profile_pic
        self.credentials = credentials  # OAuth credentials
        self.created_at = datetime.now()
        self.last_login = datetime.now()
        
    def get_id(self):
        """Return the user ID as a unicode string."""
        return str(self.id)
    
    def to_dict(self):
        """Convert user object to dictionary for storage."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'profile_pic': self.profile_pic,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat()
        }
    
    @staticmethod
    def from_dict(data, credentials=None):
        """Create a user object from dictionary data."""
        user = User(
            id=data.get('id'),
            email=data.get('email'),
            name=data.get('name'),
            profile_pic=data.get('profile_pic'),
            credentials=credentials
        )
        
        # Convert ISO format strings back to datetime objects if they exist
        if 'created_at' in data:
            user.created_at = datetime.fromisoformat(data['created_at'])
        if 'last_login' in data:
            user.last_login = datetime.fromisoformat(data['last_login'])
            
        return user
