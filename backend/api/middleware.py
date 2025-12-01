"""
Security middleware for Flask application
"""
from flask import request, session
from functools import wraps
import time
import hashlib
import secrets
from datetime import datetime, timedelta


# Rate limiting storage (in production, use Redis)
rate_limit_store = {}
MAX_REQUESTS_PER_WINDOW = 100  # Max requests per window
RATE_LIMIT_WINDOW = 60  # 60 seconds window


def get_client_ip():
    """Get client IP address, handling proxies"""
    if request.headers.get('X-Forwarded-For'):
        # X-Forwarded-For can contain multiple IPs, take the first one
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr or 'unknown'


def rate_limit(max_requests=MAX_REQUESTS_PER_WINDOW, window=RATE_LIMIT_WINDOW):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = get_client_ip()
            current_time = time.time()
            
            # Clean old entries (simple cleanup)
            if len(rate_limit_store) > 10000:
                cutoff = current_time - window * 2
                rate_limit_store.clear()
            
            # Get or create rate limit entry
            if client_ip not in rate_limit_store:
                rate_limit_store[client_ip] = {
                    'requests': [],
                    'blocked_until': None
                }
            
            entry = rate_limit_store[client_ip]
            
            # Check if IP is blocked
            if entry['blocked_until'] and current_time < entry['blocked_until']:
                remaining = int(entry['blocked_until'] - current_time)
                return {
                    'error': f'Trop de requêtes. Veuillez réessayer dans {remaining} seconde(s).'
                }, 429
            
            # Remove old requests outside the window
            entry['requests'] = [
                req_time for req_time in entry['requests']
                if current_time - req_time < window
            ]
            
            # Check if limit exceeded
            if len(entry['requests']) >= max_requests:
                # Block for the window duration
                entry['blocked_until'] = current_time + window
                return {
                    'error': f'Trop de requêtes. Veuillez réessayer dans {window} seconde(s).'
                }, 429
            
            # Add current request
            entry['requests'].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def generate_csrf_token():
    """Generate a CSRF token"""
    return secrets.token_urlsafe(32)


def get_csrf_token(session):
    """Get or create CSRF token for session"""
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()
    return session['csrf_token']


def validate_csrf_token_from_session(token, session_obj):
    """Validate CSRF token"""
    if 'csrf_token' not in session_obj:
        return False
    return secrets.compare_digest(session_obj['csrf_token'], token)


def require_csrf(f):
    """Decorator to require valid CSRF token for state-changing operations"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import session as flask_session
        # Skip CSRF for GET and HEAD requests
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return f(*args, **kwargs)
        
        # Get token from header or form
        token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
        if not token:
            json_data = request.get_json(silent=True, force=True)
            if isinstance(json_data, dict):
                token = json_data.get('csrf_token', '')
        
        if not token or not validate_csrf_token_from_session(token, flask_session):
            return {'error': 'Token CSRF invalide ou manquant'}, 403
        
        return f(*args, **kwargs)
    return decorated_function


def prevent_session_fixation(f):
    """Prevent session fixation attacks by regenerating session ID after login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = f(*args, **kwargs)
        # Regenerate session ID after successful authentication
        if hasattr(session, 'permanent') and session.permanent:
            session.permanent = False
            session.regenerate()
            session.permanent = True
        return result
    return decorated_function


# Security headers
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',  # HSTS
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    # Content Security Policy
    'Content-Security-Policy': (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # unsafe-eval for dev
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' http://localhost:* ws://localhost:*; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    ),
}


def add_security_headers(response):
    """Add security headers to response"""
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response


def log_security_event(event_type, details, client_ip=None, severity='INFO'):
    """Log security events"""
    if not client_ip:
        client_ip = get_client_ip()
    
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] [{severity}] [{event_type}] IP: {client_ip} - {details}"
    
    # In production, send to logging service
    print(log_entry)
    
    # You can also write to a security log file
    try:
        with open('/app/data/security.log', 'a') as f:
            f.write(log_entry + '\n')
    except Exception:
        pass  # Fail silently if can't write logs

