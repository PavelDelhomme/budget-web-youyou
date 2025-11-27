"""
Flask application for Budget Annuel API
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import re
import os

from api.utils import load_user, save_user, get_default_year_data

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'budget-annuel-secret-key-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 30 * 24 * 60 * 60  # 30 days

# Credentials - stockés comme variables d'environnement pour la sécurité
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'dev@delhomme.ovh')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '5n!B@#c*ymgEBYXrWdKE')

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
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    email = data.get('email', '').strip() if data else ''
    password = data.get('password', '')
    
    if not email:
        return jsonify({'error': 'Email invalide'}), 400
    
    # Validate email format
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Email invalide'}), 400
    
    # Verify credentials
    if email.lower() != ADMIN_EMAIL.lower():
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    if password != ADMIN_PASSWORD:
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Set session user
    session['user_email'] = ADMIN_EMAIL
    session.permanent = True
    
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
    """Update data for a specific year"""
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
    
    payload = request.get_json()
    if not isinstance(payload, dict):
        return jsonify({'error': 'Payload invalide'}), 400
    
    user_data = load_user(user_email)
    year_key = str(year_num)
    
    user_data['datasets'][year_key] = {
        'categories': payload.get('categories', []),
        'expenses': payload.get('expenses', []),
        'subs': payload.get('subs', []),
        'annualFixedExpenses': payload.get('annualFixedExpenses', []),
        'monthlySalary': payload.get('monthlySalary', 0),
        'variableMonthlyIncomes': payload.get('variableMonthlyIncomes'),  # Array of 12 values or None
        'additionalMonthlyIncomes': payload.get('additionalMonthlyIncomes', []),  # Array of MonthlyAdditionalIncome
        'currentSavings': payload.get('currentSavings', 0),
        'savingsTransactions': payload.get('savingsTransactions', [])
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
    """Update global user data"""
    user_email = session['user_email']
    payload = request.get_json()
    
    if not isinstance(payload, dict):
        return jsonify({'error': 'Payload invalide'}), 400
    
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

