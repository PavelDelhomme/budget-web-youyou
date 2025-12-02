"""
API endpoints for statistical budget generation and ML training data
"""
from flask import request, jsonify, session
from functools import wraps
from api.statistical_budget_generator import StatisticalBudgetGenerator, StatisticalTrainingDataGenerator


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_statistical_routes(app):
    """Register statistical API routes"""
    
    @app.route('/api/statistical/generate-budget', methods=['POST'])
    def generate_statistical_budget():
        """
        Generate a budget proposal based on user profile and statistics
        """
        data = request.get_json() or {}
        
        profile = {
            'csp': data.get('csp', 'autre'),
            'monthly_income': data.get('monthly_income'),
            'situation_familiale': data.get('situation_familiale', 'celibataire'),
            'nombre_enfants': data.get('nombre_enfants', 0),
            'zone_geographique': data.get('zone_geographique', 'moyenne'),
            'geographic_location': data.get('geographic_location'),  # Nouvelle zone géographique détaillée
            'age': data.get('age'),
            'profession': data.get('profession'),
            'secteur_activite': data.get('secteur_activite'),
        }
        
        try:
            generator = StatisticalBudgetGenerator()
            budget = generator.generate_budget_from_profile(profile)
            
            return jsonify({
                'success': True,
                'budget': budget,
                'profile': profile,
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la génération du budget: {str(e)}'
            }), 500
    
    @app.route('/api/statistical/generate-training-data', methods=['POST'])
    @require_auth
    def generate_training_data():
        """
        Generate statistical training data for initial ML model training
        Admin only endpoint
        """
        user_email = session.get('user_email', '')
        # Simple admin check - in production, use proper admin system
        if not user_email.endswith('@admin.local'):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json() or {}
        num_years = data.get('num_years', 5)
        
        try:
            generator = StatisticalTrainingDataGenerator()
            training_data = generator.generate_training_years(num_years)
            
            return jsonify({
                'success': True,
                'training_data': training_data,
                'num_years': num_years,
                'total_records': len(training_data),
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la génération des données: {str(e)}'
            }), 500

