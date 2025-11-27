"""
Flask application for Budget Annuel API
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import re
import os
import time
from datetime import datetime, timedelta

from api.utils import load_user, save_user, get_default_year_data
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'budget-annuel-secret-key-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Empêche l'accès JavaScript aux cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Protection CSRF
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'  # HTTPS en production
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['SESSION_COOKIE_NAME'] = 'budget_session'  # Nom personnalisé

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
        
        return f(*args, **kwargs)
    return decorated_function


@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint with security measures"""
    # Rate limiting - protection contre les attaques brute force
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
    if client_ip == 'unknown':
        client_ip = request.remote_addr or 'unknown'
    
    current_time = time.time()
    
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
            return jsonify({
                'error': f'Trop de tentatives échouées. Veuillez réessayer dans {LOCKOUT_DURATION // 60} minute(s).'
            }), 429
        
        # Message générique pour ne pas révéler lequel est incorrect
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Authentification réussie - réinitialiser le compteur
    if client_ip in login_attempts:
        del login_attempts[client_ip]
    
    # Set session user avec sécurité renforcée
    session['user_email'] = ADMIN_EMAIL
    session.permanent = True
    
    # Set session lifetime (already configured globally)
    
    # Ensure user data exists
    user_data = load_user(ADMIN_EMAIL)
    
    return jsonify({
        'email': ADMIN_EMAIL,
        'years': user_data['years']
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    session.clear()
    return jsonify({'done': True})


@app.route('/api/years', methods=['GET'])
@require_auth
def get_years():
    """Get all years for authenticated user"""
    from datetime import datetime
    
    user_email = session['user_email']
    user_data = load_user(user_email)
    current_year = datetime.now().year
    
    # Ensure current year is always in the list
    if current_year not in user_data['years']:
        user_data['years'].append(current_year)
        user_data['years'].sort()
        save_user(user_email, user_data)
    
    return jsonify({
        'email': user_email,
        'years': user_data['years']
    })


@app.route('/api/years', methods=['POST'])
@require_auth
def add_year():
    """Add a new year"""
    user_email = session['user_email']
    data = request.get_json()
    year = data.get('year') if data else None
    
    try:
        year_num = int(year) if year else None
        if not year_num or year_num < 1900 or year_num > 2100:
            return jsonify({'error': 'Année invalide'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Année invalide'}), 400
    
    user_data = load_user(user_email)
    if year_num not in user_data['years']:
        user_data['years'].append(year_num)
        user_data['years'].sort()
    
    save_user(user_email, user_data)
    return jsonify({'years': user_data['years']})


@app.route('/api/years', methods=['DELETE'])
@require_auth
def delete_year():
    """Delete a year"""
    user_email = session['user_email']
    year_str = request.args.get('year')
    
    if not year_str:
        return jsonify({'error': 'Année requise'}), 400
    
    try:
        year_num = int(year_str)
    except ValueError:
        return jsonify({'error': 'Année invalide'}), 400
    
    user_data = load_user(user_email)
    
    # Remove from years array
    user_data['years'] = [y for y in user_data['years'] if y != year_num]
    
    # Remove dataset if exists
    year_key = str(year_num)
    if year_key in user_data['datasets']:
        del user_data['datasets'][year_key]
    
    save_user(user_email, user_data)
    return jsonify({'years': user_data['years']})


@app.route('/api/get', methods=['GET'])
@require_auth
def get_year_data():
    """Get data for a specific year"""
    user_email = session['user_email']
    year_str = request.args.get('year')
    
    if not year_str:
        return jsonify({'error': 'Année requise'}), 400
    
    try:
        year_num = int(year_str)
        if year_num < 1900 or year_num > 2100:
            return jsonify({'error': 'Année invalide'}), 400
    except ValueError:
        return jsonify({'error': 'Année invalide'}), 400
    
    user_data = load_user(user_email)
    year_key = str(year_num)
    dataset = user_data['datasets'].get(year_key)
    
    # Ensure default structure exists
    default_data = get_default_year_data()
    result = {}
    for key, default_value in default_data.items():
        result[key] = dataset.get(key, default_value) if dataset else default_value
    
    # Ensure annualFixedExpenses exists (backward compatibility)
    if 'annualFixedExpenses' not in result:
        result['annualFixedExpenses'] = []
    
    # Ensure variableMonthlyIncomes exists (backward compatibility)
    if 'variableMonthlyIncomes' not in result:
        result['variableMonthlyIncomes'] = None
    
    # Ensure additionalMonthlyIncomes exists (backward compatibility)
    if 'additionalMonthlyIncomes' not in result:
        result['additionalMonthlyIncomes'] = []
    
    return jsonify(result)


@app.route('/api/put', methods=['PUT'])
@require_auth
def put_year_data():
    """Update data for a specific year with input validation"""
    user_email = session['user_email']
    year_str = request.args.get('year')
    
    if not year_str:
        return jsonify({'error': 'Année requise'}), 400
    
    # Validation stricte de l'année
    try:
        year_num = int(year_str)
        if year_num < 1900 or year_num > 2100:
            return jsonify({'error': 'Année invalide'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Année invalide'}), 400
    
    # Validation du payload
    payload = request.get_json()
    if not isinstance(payload, dict):
        return jsonify({'error': 'Payload invalide'}), 400
    
    # Limiter la taille du payload (protection contre les payloads trop volumineux)
    payload_str = str(payload)
    if len(payload_str) > 1000000:  # 1MB max
        return jsonify({'error': 'Payload trop volumineux'}), 400
    
    user_data = load_user(user_email)
    year_key = str(year_num)
    
    # Récupérer les données existantes de l'année (si elles existent)
    existing_data = user_data['datasets'].get(year_key, {})
    
    # Fusionner les données existantes avec les nouvelles données du payload
    # Cela permet de préserver les champs qui ne sont pas dans le payload
    user_data['datasets'][year_key] = {
        'categories': payload.get('categories', existing_data.get('categories', [])),
        'expenses': payload.get('expenses', existing_data.get('expenses', [])),
        'subs': payload.get('subs', existing_data.get('subs', [])),
        'annualFixedExpenses': payload.get('annualFixedExpenses', existing_data.get('annualFixedExpenses', [])),
        'monthlySalary': payload.get('monthlySalary', existing_data.get('monthlySalary', 0)),
        'variableMonthlyIncomes': payload.get('variableMonthlyIncomes') if 'variableMonthlyIncomes' in payload else existing_data.get('variableMonthlyIncomes'),  # Array of 12 values or None
        'additionalMonthlyIncomes': payload.get('additionalMonthlyIncomes', existing_data.get('additionalMonthlyIncomes', [])),  # Array of MonthlyAdditionalIncome
        'currentSavings': payload.get('currentSavings', existing_data.get('currentSavings', 0)),
        'savingsTransactions': payload.get('savingsTransactions', existing_data.get('savingsTransactions', []))
    }
    
    # Ensure year is in years array
    if year_num not in user_data['years']:
        user_data['years'].append(year_num)
        user_data['years'].sort()
    
    save_user(user_email, user_data)
    return jsonify({'ok': True})


@app.route('/api/global', methods=['GET'])
@require_auth
def get_global_data():
    """Get global user data (not year-specific)"""
    try:
        user_email = session.get('user_email')
        if not user_email:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_data = load_user(user_email)
        global_data = user_data.get('globalData') or {}
        
        # If globalData doesn't exist or is empty, check if user has years data
        # If they have years data, consider them initialized
        if not global_data:
            has_years_data = bool(user_data.get('years') and len(user_data.get('years', [])) > 0)
            return jsonify({
                'bankAccounts': [],
                'investments': [],
                'savingsGoals': [],
                'savingsProjects': [],
                'temporaryIncomes': [],
                'sharedExpensePersons': [],
                'personTransactions': [],
                'salaryHistory': [],
                'initializationComplete': has_years_data,  # If user has years, they're initialized
                'monthlySalary': 0,
                'monthlySalaryStartDate': None
            })
        
        # Ensure all fields exist in existing globalData
        if 'initializationComplete' not in global_data:
            # If user has years data, assume they're initialized
            has_years_data = bool(user_data.get('years') and len(user_data.get('years', [])) > 0)
            global_data['initializationComplete'] = has_years_data
        
        # Ensure all required fields exist
        defaults = {
            'bankAccounts': [],
            'investments': [],
            'savingsGoals': [],
            'savingsProjects': [],
            'temporaryIncomes': [],
            'sharedExpensePersons': [],
            'personTransactions': [],
            'salaryHistory': [],
            'monthlySalary': 0,
            'monthlySalaryStartDate': None
        }
        
        for key, default_value in defaults.items():
            if key not in global_data:
                global_data[key] = default_value
        
        return jsonify(global_data)
    except Exception as e:
        import traceback
        print(f"Error in get_global_data: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500


@app.route('/api/global', methods=['PUT'])
@require_auth
def put_global_data():
    """Update global user data with input validation"""
    user_email = session['user_email']
    payload = request.get_json()
    
    if not isinstance(payload, dict):
        return jsonify({'error': 'Payload invalide'}), 400
    
    # Limiter la taille du payload
    payload_str = str(payload)
    if len(payload_str) > 500000:  # 500KB max pour les données globales
        return jsonify({'error': 'Payload trop volumineux'}), 400
    
    user_data = load_user(user_email)
    user_data['globalData'] = payload
    save_user(user_email, user_data)
    return jsonify({'ok': True})


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 6060))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

