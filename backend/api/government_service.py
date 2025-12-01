"""
Government APIs service endpoints
"""
from flask import request, jsonify, session
from functools import wraps

from api.government_apis.impot_particulier import ImpotParticulierService
from api.government_apis.mon_entreprise import MonEntrepriseAPI
from api.government_apis.openfisca import OpenFiscaService


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_government_routes(app):
    """Register government API routes"""
    
    @app.route('/api/government/impot/sync', methods=['POST'])
    @require_auth
    def sync_impot_data():
        """Sync tax data from DGFiP"""
        user_email = session['user_email']
        
        try:
            service = ImpotParticulierService(user_email)
            result = service.sync_tax_data()
            return jsonify(result)
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la synchronisation: {str(e)}'
            }), 500
    
    @app.route('/api/government/impot/estimate', methods=['POST'])
    @require_auth
    def estimate_tax():
        """Estimate tax liability"""
        user_email = session['user_email']
        data = request.get_json() or {}
        
        annual_income = data.get('annual_income', 0)
        situation = data.get('situation', {})
        
        if annual_income <= 0:
            return jsonify({
                'error': 'Revenu annuel requis'
            }), 400
        
        try:
            service = ImpotParticulierService(user_email)
            result = service.estimate_tax_liability(annual_income, situation)
            return jsonify({
                'success': True,
                'estimation': result
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors du calcul: {str(e)}'
            }), 500
    
    @app.route('/api/government/entreprise/simulate-salary', methods=['POST'])
    @require_auth
    def simulate_salary():
        """Simulate salary calculations"""
        data = request.get_json() or {}
        gross_salary = data.get('gross_salary', 0)
        
        if gross_salary <= 0:
            return jsonify({
                'error': 'Salaire brut requis'
            }), 400
        
        try:
            api = MonEntrepriseAPI()
            result = api.simulate_salary(gross_salary)
            return jsonify({
                'success': True,
                'simulation': result
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la simulation: {str(e)}'
            }), 500
    
    @app.route('/api/government/entreprise/simulate-auto-entrepreneur', methods=['POST'])
    @require_auth
    def simulate_auto_entrepreneur():
        """Simulate auto-entrepreneur calculations"""
        data = request.get_json() or {}
        turnover = data.get('turnover', 0)
        activity_type = data.get('activity_type', 'service')
        
        if turnover <= 0:
            return jsonify({
                'error': 'Chiffre d\'affaires requis'
            }), 400
        
        try:
            api = MonEntrepriseAPI()
            result = api.simulate_auto_entrepreneur(turnover, activity_type)
            return jsonify({
                'success': True,
                'simulation': result
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la simulation: {str(e)}'
            }), 500
    
    @app.route('/api/government/openfisca/calculate-tax', methods=['POST'])
    @require_auth
    def calculate_tax_openfisca():
        """Calculate tax using OpenFisca"""
        data = request.get_json() or {}
        annual_income = data.get('annual_income', 0)
        situation = data.get('situation', {})
        
        if annual_income <= 0:
            return jsonify({
                'error': 'Revenu annuel requis'
            }), 400
        
        try:
            service = OpenFiscaService()
            result = service.calculate_impot_revenu(annual_income, situation)
            return jsonify({
                'success': True,
                'calculation': result
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors du calcul: {str(e)}'
            }), 500

