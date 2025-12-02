"""
Routes API pour la gestion fiscale par pays/région
"""
from flask import request, jsonify, session
from functools import wraps

from api.fiscal_country_manager import CountryFiscalManager
from api.utils import load_user


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_fiscal_country_routes(app):
    """Register fiscal country management API routes"""
    
    @app.route('/api/fiscal/country-info', methods=['GET'])
    @require_auth
    def get_country_fiscal_info():
        """Get detailed fiscal information for user's country or specified country"""
        country_code = request.args.get('country')
        
        if not country_code:
            # Get from user profile
            user_email = session['user_email']
            user_data = load_user(user_email)
            global_data = user_data.get('globalData', {})
            user_profile = global_data.get('userProfile', {})
            geographic_location = user_profile.get('geographic_location', {})
            country_code = geographic_location.get('country', 'FR')
        
        try:
            manager = CountryFiscalManager()
            fiscal_info = manager.get_tax_info(country_code)
            
            if not fiscal_info:
                return jsonify({
                    'error': f'Système fiscal non disponible pour {country_code}'
                }), 404
            
            return jsonify({
                'success': True,
                'fiscal_info': fiscal_info
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/available-countries', methods=['GET'])
    @require_auth
    def get_available_countries():
        """Get list of available countries with fiscal systems"""
        try:
            manager = CountryFiscalManager()
            countries = manager.get_available_countries()
            
            return jsonify({
                'success': True,
                'countries': countries
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500

