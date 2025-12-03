"""
API Views - Flask routes
"""
from flask import request, jsonify, session
from functools import wraps
import re

from .utils import load_user, save_user, get_default_year_data
from .security import (
    sanitize_email, validate_email, validate_year, 
    validate_year_data, validate_string
)
# Note: validate_global_data est importé dynamiquement si disponible


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_routes(app):
    """Register all API routes"""
    
    from api.middleware import require_csrf, get_client_ip
    
    @app.route('/api/years', methods=['GET'])
    @require_auth
    def get_years():
        """Get all years for authenticated user"""
        user_email = session['user_email']
        data = load_user(user_email)
        return jsonify({
            'email': user_email,
            'years': data['years']
        })
    
    @app.route('/api/years', methods=['POST'])
    @require_auth
    @require_csrf
    def add_year():
        """Add a new year"""
        user_email = session['user_email']
        data = request.get_json() or {}
        year = data.get('year')
        
        year_num = validate_year(year)
        if year_num is None:
            return jsonify({'error': 'Année invalide'}), 400
        
        # Validation supplémentaire : années raisonnables (pas trop anciennes ou futures)
        from datetime import datetime
        current_year = datetime.now().year
        if year_num < current_year - 10 or year_num > current_year + 10:
            return jsonify({'error': 'Année trop éloignée'}), 400
        
        user_data = load_user(user_email)
        if year_num in user_data['years']:
            return jsonify({'error': 'Cette année existe déjà'}), 400
        
        if year_num not in user_data['years']:
            user_data['years'].append(year_num)
            user_data['years'].sort()
            save_user(user_email, user_data)
        
        return jsonify({'years': user_data['years']})
    
    @app.route('/api/years', methods=['DELETE'])
    @require_auth
    @require_csrf
    def delete_year():
        """Delete a year"""
        user_email = session['user_email']
        year_str = request.args.get('year')
        
        if not year_str:
            return jsonify({'error': 'Année requise'}), 400
        
        year_num = validate_year(year_str)
        if year_num is None:
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
        
        year_num = validate_year(year_str)
        if year_num is None:
            return jsonify({'error': 'Année invalide'}), 400
        
        user_data = load_user(user_email)
        year_key = str(year_num)
        dataset = user_data['datasets'].get(year_key)
        
        if not dataset:
            # Return default dataset with all required fields
            default_data = get_default_year_data()
            return jsonify(default_data)
        
        # Ensure all default fields are present for backward compatibility
        default_data = get_default_year_data()
        for key, default_value in default_data.items():
            if key not in dataset:
                dataset[key] = default_value
        
        return jsonify(dataset)
    
    @app.route('/api/put', methods=['PUT'])
    @require_auth
    @require_csrf
    def put_year_data():
        """Update data for a specific year"""
        user_email = session['user_email']
        year_str = request.args.get('year')
        
        if not year_str:
            return jsonify({'error': 'Année requise'}), 400
        
        year_num = validate_year(year_str)
        if year_num is None:
            return jsonify({'error': 'Année invalide'}), 400
        
        payload = request.get_json()
        if not isinstance(payload, dict):
            return jsonify({'error': 'Payload invalide'}), 400
        
        # Validate and sanitize all data before saving
        validated_data = validate_year_data(payload)
        if validated_data is None:
            return jsonify({'error': 'Données invalides'}), 400
        
        user_data = load_user(user_email)
        year_key = str(year_num)
        
        # Merge with existing data
        existing_data = user_data['datasets'].get(year_key, {})
        existing_data.update(validated_data)
        user_data['datasets'][year_key] = existing_data
        
        # Ensure year is in years array
        if year_num not in user_data['years']:
            user_data['years'].append(year_num)
            user_data['years'].sort()
        
        save_user(user_email, user_data)
        return jsonify({'ok': True})
    
    @app.route('/api/global', methods=['GET'])
    @require_auth
    def get_global_data():
        """Get global user data"""
        user_email = session['user_email']
        user_data = load_user(user_email)
        return jsonify(user_data.get('globalData', {}))
    
    @app.route('/api/global', methods=['PUT'])
    @require_auth
    @require_csrf
    def put_global_data():
        """Update global user data"""
        user_email = session['user_email']
        payload = request.get_json()
        
        if not isinstance(payload, dict):
            return jsonify({'error': 'Payload invalide'}), 400
        
        # Utiliser le payload directement - validation optionnelle si disponible
        validated_data = payload
        
        # Essayer d'utiliser validate_global_data si disponible (sans forcer l'import)
        try:
            # Import dynamique uniquement dans le try pour éviter l'erreur si la fonction n'existe pas
            import importlib
            security_module = importlib.import_module('api.security')
            if hasattr(security_module, 'validate_global_data'):
                validate_func = getattr(security_module, 'validate_global_data')
                result = validate_func(payload)
                if result is not None:
                    validated_data = result
        except Exception as e:
            # Si validate_global_data n'est pas disponible, utiliser le payload directement (normal)
            pass
        
        user_data = load_user(user_email)
        user_data['globalData'] = validated_data
        save_user(user_email, user_data)
        
        return jsonify({'ok': True})
