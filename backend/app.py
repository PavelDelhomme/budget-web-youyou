"""
Flask application for Budget Annuel API
Enhanced with advanced security features
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import re
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

# Import structured logger after DATA_DIR is defined

from api.utils import load_user, save_user, get_default_year_data
from api.middleware import (
    add_security_headers, get_client_ip, rate_limit,
    require_csrf, prevent_session_fixation, log_security_event,
    get_csrf_token
)
from api.security_advanced import (
    AnomalyDetector, SecurityLogger, DataEncryption
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Security configuration
app.secret_key = os.environ.get('SECRET_KEY', 'budget-annuel-secret-key-change-in-production')
if app.secret_key == 'budget-annuel-secret-key-change-in-production':
    # Generate a secure secret key if default is used
    import secrets
    app.secret_key = secrets.token_hex(32)

# Cookie security configuration
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Empêche l'accès JavaScript aux cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Protection CSRF (Lax pour permettre les liens)
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('FORCE_HTTPS', '').lower() == 'true'  # HTTPS en production
app.config['SESSION_COOKIE_NAME'] = 'budget_session'  # Nom personnalisé pour éviter les collisions
app.config['SESSION_COOKIE_PATH'] = '/'  # Restreindre le chemin
app.config['SESSION_COOKIE_DOMAIN'] = None  # Ne pas partager entre sous-domaines
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['SESSION_COOKIE_SAMESITE_FORCE_ALL'] = True

# Initialize advanced security features
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

anomaly_detector = AnomalyDetector()
security_logger = SecurityLogger(DATA_DIR)
data_encryption = DataEncryption()

# Add security headers to all responses
@app.after_request
def set_security_headers(response):
    return add_security_headers(response)


# Credentials - stockés comme variables d'environnement pour la sécurité
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'dev@delhomme.ovh')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '5n!B@#c*ymgEBYXrWdKE')

# Rate limiting pour les tentatives de login (protection contre brute force)
login_attempts = {}  # {ip: {'count': int, 'last_attempt': timestamp, 'locked_until': timestamp}}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutes en secondes
RATE_LIMIT_WINDOW = 60  # Fenêtre de 60 secondes pour les tentatives

# CORS configuration
CORS(app, 
     origins=['http://localhost:6061', 'http://127.0.0.1:6061'],
     supports_credentials=True)

# Global error handler
@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    import traceback
    print(f"Internal Server Error: {error}")
    traceback.print_exc()
    return jsonify({'error': 'Internal Server Error', 'message': str(error)}), 500

@app.errorhandler(404)
def handle_404(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not Found', 'message': 'The requested resource was not found'}), 404

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions"""
    import traceback
    print(f"Exception: {e}")
    traceback.print_exc()
    return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500


def require_auth(f):
    """Decorator to require authentication with security checks"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Vérifier la session
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Vérifier que l'email de la session est valide
        user_email = session.get('user_email')
        if not user_email or not isinstance(user_email, str):
            session.clear()
            return jsonify({'error': 'Session invalide'}), 401
        
        # Valider le format de l'email dans la session
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, user_email):
            session.clear()
            return jsonify({'error': 'Session invalide'}), 401
        
        # Détection d'anomalies sur les requêtes authentifiées
        client_ip = get_client_ip()
        rate_abuse = anomaly_detector.detect_rate_limit_abuse(client_ip)
        
        if rate_abuse.get('suspicious'):
            security_logger.log_security_event(
                'RATE_LIMIT_ABUSE',
                client_ip,
                {'details': rate_abuse.get('reason')},
                'WARNING'
            )
        
        return f(*args, **kwargs)
    return decorated_function


@app.route('/api/csrf-token', methods=['GET'])
def get_csrf():
    """Get CSRF token for authenticated users"""
    if 'user_email' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    token = get_csrf_token(session)
    return jsonify({'csrf_token': token})


@app.route('/api/login', methods=['POST'])
@rate_limit(max_requests=5, window=60)  # Stricter rate limiting for login
def login():
    """Login endpoint with advanced security measures"""
    client_ip = get_client_ip()
    current_time = time.time()
    
    # Détection d'anomalies de connexion
    suspicious_check = anomaly_detector.detect_suspicious_login(client_ip, False)
    
    if suspicious_check.get('suspicious'):
        security_logger.log_security_event(
            'SUSPICIOUS_LOGIN_ATTEMPT',
            client_ip,
            {'reason': suspicious_check.get('reason')},
            'HIGH'
        )
    
    # Vérifier si l'IP est bloquée
    if client_ip in login_attempts:
        attempt_data = login_attempts[client_ip]
        if 'locked_until' in attempt_data and current_time < attempt_data['locked_until']:
            remaining_time = int(attempt_data['locked_until'] - current_time)
            return jsonify({
                'error': f'Trop de tentatives. Veuillez réessayer dans {remaining_time // 60} minute(s).'
            }), 429
        
        # Réinitialiser le compteur si la fenêtre de temps est passée
        if 'last_attempt' in attempt_data:
            time_since_last = current_time - attempt_data['last_attempt']
            if time_since_last > RATE_LIMIT_WINDOW:
                attempt_data['count'] = 0
    
    # Validation des données d'entrée
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données invalides'}), 400
    
    email = data.get('email', '').strip() if isinstance(data.get('email'), str) else ''
    password = data.get('password', '') if isinstance(data.get('password'), str) else ''
    
    # Validation de l'email
    if not email:
        return jsonify({'error': 'Email invalide'}), 400
    
    # Validation du format email (protection injection)
    if len(email) > 254:  # RFC 5321 limite
        return jsonify({'error': 'Email invalide'}), 400
    
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Validation du mot de passe
    if not password or not isinstance(password, str):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Limiter la longueur du mot de passe (protection)
    if len(password) > 500:
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Vérifier les identifiants
    email_match = email.lower() == ADMIN_EMAIL.lower()
    password_match = password == ADMIN_PASSWORD
    
    # Si les identifiants sont incorrects, incrémenter le compteur
    if not email_match or not password_match:
        if client_ip not in login_attempts:
            login_attempts[client_ip] = {'count': 0, 'last_attempt': current_time}
        
        login_attempts[client_ip]['count'] += 1
        login_attempts[client_ip]['last_attempt'] = current_time
        
        # Bloquer l'IP après trop de tentatives
        if login_attempts[client_ip]['count'] >= MAX_LOGIN_ATTEMPTS:
            login_attempts[client_ip]['locked_until'] = current_time + LOCKOUT_DURATION
            security_logger.log_security_event(
                'LOGIN_BLOCKED',
                client_ip,
                {'attempts': login_attempts[client_ip]['count']},
                'CRITICAL'
            )
            return jsonify({
                'error': f'Trop de tentatives échouées. Veuillez réessayer dans {LOCKOUT_DURATION // 60} minute(s).'
            }), 429
        
        # Log failed login attempt with anomaly detection
        anomaly_result = anomaly_detector.detect_suspicious_login(client_ip, False)
        security_logger.log_security_event(
            'LOGIN_FAILED',
            client_ip,
            {
                'attempt': login_attempts[client_ip]['count'],
                'suspicious': anomaly_result.get('suspicious', False)
            },
            'WARNING'
        )
        
        # Message générique pour ne pas révéler lequel est incorrect
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Authentification réussie
    anomaly_detector.detect_suspicious_login(client_ip, True)  # Clear failed attempts
    
    # Réinitialiser le compteur
    if client_ip in login_attempts:
        del login_attempts[client_ip]
    
    # Regenerate session to prevent session fixation
    session.permanent = True
    
    # Update session values (preserves existing session cookie)
    session['user_email'] = ADMIN_EMAIL
    session['login_time'] = current_time
    session['csrf_token'] = get_csrf_token(session)
    
    # Mark session as modified to ensure cookie is saved and sent
    session.modified = True
    
    # Log successful login
    security_logger.log_security_event(
        'LOGIN_SUCCESS',
        client_ip,
        {'user': ADMIN_EMAIL},
        'INFO'
    )
    
    # Ensure user data exists
    user_data = load_user(ADMIN_EMAIL)
    
    # Create response - Flask will automatically send session cookie
    response = jsonify({
        'email': ADMIN_EMAIL,
        'years': user_data['years'],
        'csrf_token': session['csrf_token']
    })
    
    return response


@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    """Logout endpoint"""
    user_email = session.get('user_email', 'unknown')
    client_ip = get_client_ip()
    
    security_logger.log_security_event(
        'LOGOUT',
        client_ip,
        {'user': user_email},
        'INFO'
    )
    
    session.clear()
    return jsonify({'success': True})


@app.route('/api/session-check', methods=['GET'])
def session_check():
    """
    Check if user is authenticated (never returns 401 to prevent console errors)
    """
    if 'user_email' not in session:
        return jsonify({'authenticated': False}), 200
    
    user_email = session.get('user_email')
    if not user_email or not isinstance(user_email, str):
        return jsonify({'authenticated': False}), 200
    
    # Validate email format
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, user_email):
        return jsonify({'authenticated': False}), 200
    
    return jsonify({
        'authenticated': True,
        'email': user_email
    }), 200


# Import and register routes
from api import views
from api.ml_service import register_ml_routes
from api.government_service import register_government_routes
from api.statistical_service import register_statistical_routes
from api.backup_service_routes import register_backup_routes
from api.health_routes import register_health_routes
from api.swagger_docs import register_swagger_routes
from api.export_routes import register_export_routes
from api.compression_middleware import enable_compression
from api.structured_logging import create_structured_logger

# Enable compression for all API responses
enable_compression(app)

# Initialize structured logging
structured_logger = create_structured_logger('app', DATA_DIR / 'logs')
structured_logger.info('Application démarrée', {
    'version': '1.0.0',
    'environment': os.environ.get('FLASK_ENV', 'development')
})

# Register all routes
views.register_routes(app)
register_ml_routes(app)
register_government_routes(app)
register_statistical_routes(app)
register_backup_routes(app)
register_health_routes(app)
register_swagger_routes(app)
register_export_routes(app)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6060, debug=True)
