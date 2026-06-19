"""
Mathlers Authentication & Authorization System
Role-Based Access Control (RBAC) with JWT authentication
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, List, Dict, Any, Callable
from flask import request, jsonify, g
from sqlalchemy.orm import Session

# Configuration (should be loaded from settings.yaml in production)
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 1
REFRESH_TOKEN_EXPIRY_DAYS = 7


# ==================== PERMISSION DEFINITIONS ====================

PERMISSIONS = {
    # User Management
    "manage_users": "Create, update, delete user accounts",
    "manage_roles": "Assign and modify user roles",
    "view_analytics": "Access analytics and reports",
    
    # Content Management
    "manage_content": "Create, edit, delete questions and record cards",
    "moderate_content": "Review and approve flagged content",
    
    # Competition Management
    "manage_competitions": "Create and manage competitions",
    "manage_tournaments": "Create and manage tournaments",
    
    # Class Management (Teachers)
    "create_classes": "Create new classes",
    "manage_students": "Manage student accounts in classes",
    "assign_practice": "Assign practice sessions to students",
    "view_student_progress": "View progress of enrolled students",
    "create_custom_tests": "Create custom tests for classes",
    "join_competitions": "Participate in competitions",
    
    # Parent Permissions
    "view_child_progress": "View own children's progress",
    "manage_child_account": "Manage child's account settings",
    "purchase_subscriptions": "Purchase and manage subscriptions",
    
    # Student Permissions
    "practice_mode": "Access practice mode",
    "participate_tournaments": "Join tournaments",
    "earn_badges": "Earn and view badges",
    "view_leaderboards": "View global and school leaderboards",
    
    # System
    "manage_system": "System configuration access",
    "access_all_data": "Access all platform data",
    "configure_platform": "Modify platform settings",
    "manage_subscriptions": "Manage subscription plans",
    "delete_content": "Permanently delete content",
    "ban_users": "Ban or suspend users",
    "warn_users": "Issue warnings to users",
    "temporary_ban": "Temporarily suspend users",
    "view_reports": "View moderation reports",
    
    # Guest/Public
    "view_public_content": "View public pages and content",
    "register_account": "Register a new account",
    "try_demo": "Access demo mode",
}


# ==================== ROLE CONFIGURATION ====================

ROLE_PERMISSIONS = {
    "admin": [
        "manage_users", "manage_roles", "manage_content", "manage_system",
        "view_analytics", "manage_competitions", "manage_tournaments",
        "access_all_data", "configure_platform", "manage_subscriptions",
        "delete_content", "ban_users", "moderate_content", "view_reports",
        "warn_users", "temporary_ban"
    ],
    "moderator": [
        "moderate_content", "view_reports", "manage_competitions",
        "view_analytics", "warn_users", "temporary_ban"
    ],
    "teacher": [
        "create_classes", "manage_students", "assign_practice",
        "view_student_progress", "create_custom_tests", "view_analytics",
        "join_competitions"
    ],
    "parent": [
        "view_child_progress", "manage_child_account", "view_recommendations",
        "purchase_subscriptions"
    ],
    "student": [
        "practice_mode", "join_competitions", "view_own_progress",
        "participate_tournaments", "earn_badges", "view_leaderboards"
    ],
    "guest": [
        "view_public_content", "register_account", "try_demo"
    ]
}

ROLE_LEVELS = {
    "admin": 100,
    "moderator": 80,
    "teacher": 60,
    "parent": 40,
    "student": 20,
    "guest": 0
}


# ==================== PASSWORD UTILITIES ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    except Exception:
        return False


# ==================== JWT TOKEN MANAGEMENT ====================

def generate_access_token(user_id: int, role: str, permissions: List[str]) -> str:
    """Generate a JWT access token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'permissions': permissions,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_refresh_token(user_id: int) -> str:
    """Generate a JWT refresh token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_token(token: str) -> tuple:
    """
    Verify a token and return (is_valid, payload, error_message)
    """
    payload = decode_token(token)
    
    if not payload:
        return False, None, "Invalid or expired token"
    
    if payload.get('type') not in ['access', 'refresh']:
        return False, None, "Invalid token type"
    
    return True, payload, None


# ==================== AUTHENTICATION DECORATORS ====================

def authenticate_required(f: Callable):
    """Decorator to require authentication for an endpoint"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        # Extract token from "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        is_valid, payload, error = verify_token(token)
        
        if not is_valid:
            return jsonify({'error': error}), 401
        
        # Store user info in Flask's g object for use in the route
        g.current_user = {
            'user_id': payload['user_id'],
            'role': payload['role'],
            'permissions': payload.get('permissions', [])
        }
        
        return f(*args, **kwargs)
    
    return decorated_function


def require_role(required_role: str):
    """Decorator to require a specific role or higher"""
    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = g.current_user['role']
            user_level = ROLE_LEVELS.get(user_role, 0)
            required_level = ROLE_LEVELS.get(required_role, 0)
            
            if user_level < required_level:
                return jsonify({
                    'error': f'{required_role} role or higher required',
                    'your_role': user_role
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_permission(required_permission: str):
    """Decorator to require a specific permission"""
    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_permissions = g.current_user.get('permissions', [])
            
            if required_permission not in user_permissions:
                return jsonify({
                    'error': f'Permission "{required_permission}" required',
                    'your_permissions': user_permissions
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_any_permission(required_permissions: List[str]):
    """Decorator to require at least one of the specified permissions"""
    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_permissions = set(g.current_user.get('permissions', []))
            required_set = set(required_permissions)
            
            if not user_permissions.intersection(required_set):
                return jsonify({
                    'error': f'One of these permissions required: {required_permissions}',
                    'your_permissions': list(user_permissions)
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ==================== PERMISSION CHECKING UTILITIES ====================

def get_role_permissions(role: str) -> List[str]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(user_permissions: List[str], required_permission: str) -> bool:
    """Check if a user has a specific permission"""
    return required_permission in user_permissions


def has_any_permission(user_permissions: List[str], required_permissions: List[str]) -> bool:
    """Check if a user has at least one of the required permissions"""
    return bool(set(user_permissions).intersection(set(required_permissions)))


def has_all_permissions(user_permissions: List[str], required_permissions: List[str]) -> bool:
    """Check if a user has all required permissions"""
    return set(required_permissions).issubset(set(user_permissions))


def can_access_resource(user_role: str, resource_role: str) -> bool:
    """
    Check if a user can access/modify a resource based on role hierarchy.
    Users can only manage resources owned by users with equal or lower role levels.
    """
    user_level = ROLE_LEVELS.get(user_role, 0)
    resource_level = ROLE_LEVELS.get(resource_role, 0)
    return user_level >= resource_level


# ==================== AUTH ROUTES (Flask Example) ====================

def create_auth_routes(app):
    """Create authentication routes for Flask app"""
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        """Register a new user"""
        from ..models.database import User, Role
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'username', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate role
        if data['role'] not in ROLE_PERMISSIONS:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Get permissions for role
        permissions = get_role_permissions(data['role'])
        
        # Create user (in production, use database session)
        # This is pseudo-code - implement with actual DB operations
        new_user = {
            'email': data['email'],
            'username': data['username'],
            'password_hash': password_hash,
            'role': data['role'],
            'permissions': permissions
        }
        
        # Generate tokens
        access_token = generate_access_token(
            user_id=new_user.get('id', 0),
            role=data['role'],
            permissions=permissions
        )
        refresh_token = generate_refresh_token(user_id=new_user.get('id', 0))
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'id': new_user.get('id'),
                'email': new_user['email'],
                'username': new_user['username'],
                'role': new_user['role']
            },
            'tokens': {
                'access': access_token,
                'refresh': refresh_token
            }
        }), 201
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Login and get access tokens"""
        from ..models.database import User
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Fetch user from database (pseudo-code)
        # user = db.session.query(User).filter_by(email=email).first()
        user = None  # Replace with actual DB query
        
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        if user.is_banned:
            return jsonify({'error': f'Account is banned: {user.ban_reason}'}), 403
        
        # Get permissions
        permissions = get_role_permissions(user.role)
        
        # Generate tokens
        access_token = generate_access_token(
            user_id=user.id,
            role=user.role,
            permissions=permissions
        )
        refresh_token = generate_refresh_token(user_id=user.id)
        
        # Update last login
        # user.last_login = datetime.utcnow()
        # db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role
            },
            'tokens': {
                'access': access_token,
                'refresh': refresh_token
            }
        })
    
    @app.route('/api/auth/refresh', methods=['POST'])
    def refresh_token():
        """Refresh access token using refresh token"""
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400
        
        is_valid, payload, error = verify_token(refresh_token)
        
        if not is_valid or payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        # Fetch user to get current role and permissions
        # user = db.session.query(User).filter_by(id=payload['user_id']).first()
        user = None  # Replace with actual DB query
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        permissions = get_role_permissions(user.role)
        
        # Generate new access token
        new_access_token = generate_access_token(
            user_id=user.id,
            role=user.role,
            permissions=permissions
        )
        
        return jsonify({
            'access_token': new_access_token
        })
    
    @app.route('/api/auth/me', methods=['GET'])
    @authenticate_required
    def get_current_user():
        """Get current authenticated user info"""
        return jsonify({
            'user': g.current_user
        })
    
    @app.route('/api/auth/logout', methods=['POST'])
    @authenticate_required
    def logout():
        """Logout (invalidate token - requires token blacklist in production)"""
        # In production, add token to blacklist
        return jsonify({'message': 'Logged out successfully'})


# ==================== EXAMPLE USAGE ====================

"""
# Flask App Setup
from flask import Flask
app = Flask(__name__)
create_auth_routes(app)

# Protected Route Examples

@app.route('/api/admin/users', methods=['GET'])
@authenticate_required
@require_role('admin')
def list_all_users():
    # Only admins can access
    return jsonify({'users': [...]})

@app.route('/api/teachers/classes', methods=['POST'])
@authenticate_required
@require_permission('create_classes')
def create_class():
    # Only users with create_classes permission (teachers, admins)
    return jsonify({'message': 'Class created'})

@app.route('/api/students/progress/<int:student_id>', methods=['GET'])
@authenticate_required
def view_student_progress(student_id):
    # Students can view own progress, teachers can view their students
    current_user = g.current_user
    
    if current_user['role'] == 'student':
        if current_user['user_id'] != student_id:
            return jsonify({'error': 'Can only view own progress'}), 403
    elif current_user['role'] == 'teacher':
        # Check if student is in teacher's class
        pass  # Implement validation
    elif current_user['role'] == 'parent':
        # Check if student is child of parent
        pass  # Implement validation
    elif ROLE_LEVELS.get(current_user['role'], 0) >= ROLE_LEVELS.get('teacher', 0):
        pass  # Admin/moderator can view all
    else:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'progress': {...}})
"""
