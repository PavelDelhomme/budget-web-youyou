"""
ML Service API endpoints for training and predictions
"""
from flask import request, jsonify, session
from functools import wraps
import os

from api.utils import load_user
from api.ml.model import create_predictor
from api.ml.recommendations import AIRecommendationEngine
from api.ml.data_validator import DataValidator


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_historical_data_for_ml(user_email: str):
    """
    Get historical data formatted for ML training
    """
    user_data = load_user(user_email)
    historical = []
    
    years = sorted(user_data.get('years', []))
    
    for year in years:
        year_key = str(year)
        dataset = user_data['datasets'].get(year_key, {})
        
        if dataset:
            historical.append({
                'year': year,
                'data': dataset
            })
    
    return historical


def register_ml_routes(app):
    """Register ML API routes"""
    
    @app.route('/api/ml/train', methods=['POST'])
    @require_auth
    def train_model():
        """
        Train the ML model on user's historical data
        """
        user_email = session['user_email']
        
        try:
            # Get historical data
            historical_data = get_historical_data_for_ml(user_email)
            
            if len(historical_data) < 2:
                return jsonify({
                    'error': 'Pas assez de données historiques. Minimum 2 années nécessaires pour l\'entraînement.',
                    'years_available': len(historical_data)
                }), 400
            
            # Create and train predictor
            predictor = create_predictor(user_email)
            scores = predictor.train(historical_data)
            
            if 'error' in scores:
                return jsonify(scores), 400
            
            # Get training info
            info = predictor.get_training_info()
            
            return jsonify({
                'success': True,
                'message': 'Modèle entraîné avec succès',
                'training_scores': scores,
                'years_used': len(historical_data),
                'model_info': info
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de l\'entraînement: {str(e)}'
            }), 500
    
    @app.route('/api/ml/predict', methods=['POST'])
    @require_auth
    def predict_budget():
        """
        Generate predictions using trained ML model
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        future_years = data.get('years', [])
        
        if not future_years or not isinstance(future_years, list):
            return jsonify({
                'error': 'Liste d\'années requise (champ "years")'
            }), 400
        
        try:
            # Get historical data to find last year
            historical_data = get_historical_data_for_ml(user_email)
            
            if not historical_data:
                return jsonify({
                    'error': 'Aucune donnée historique disponible'
                }), 400
            
            # Get last year data
            last_year_data = historical_data[-1]
            
            # Create predictor and load model
            predictor = create_predictor(user_email)
            
            if not predictor.is_trained:
                return jsonify({
                    'error': 'Modèle non entraîné. Veuillez d\'abord entraîner le modèle.',
                    'info': predictor.get_training_info()
                }), 400
            
            # Generate predictions
            predictions = predictor.predict(future_years, last_year_data)
            
            return jsonify({
                'success': True,
                'predictions': predictions
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la prédiction: {str(e)}'
            }), 500
    
    @app.route('/api/ml/info', methods=['GET'])
    @require_auth
    def get_model_info():
        """
        Get information about the trained model
        """
        user_email = session['user_email']
        
        try:
            predictor = create_predictor(user_email)
            info = predictor.get_training_info()
            
            historical_data = get_historical_data_for_ml(user_email)
            
            return jsonify({
                'model_info': info,
                'historical_years_available': len(historical_data),
                'years': [d['year'] for d in historical_data]
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/ml/retrain', methods=['POST'])
    @require_auth
    def retrain_model():
        """
        Retrain the model with latest data
        """
        user_email = session['user_email']
        
        try:
            # Get all historical data
            historical_data = get_historical_data_for_ml(user_email)
            
            if len(historical_data) < 2:
                return jsonify({
                    'error': 'Pas assez de données historiques. Minimum 2 années nécessaires.',
                    'years_available': len(historical_data)
                }), 400
            
            # Create new predictor and train
            predictor = create_predictor(user_email)
            scores = predictor.train(historical_data)
            
            if 'error' in scores:
                return jsonify(scores), 400
            
            return jsonify({
                'success': True,
                'message': 'Modèle réentraîné avec succès',
                'training_scores': scores,
                'years_used': len(historical_data)
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors du réentraînement: {str(e)}'
            }), 500
    
    @app.route('/api/ml/validate-data', methods=['GET'])
    @require_auth
    def validate_data():
        """
        Validate all historical data for ML training
        Returns detailed validation results with errors and recommendations
        """
        user_email = session['user_email']
        
        try:
            historical_data = get_historical_data_for_ml(user_email)
            
            validator = DataValidator(user_email)
            validation_results = validator.validate_all_historical_data(historical_data)
            
            return jsonify(validation_results)
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la validation: {str(e)}'
            }), 500
    
    @app.route('/api/ml/recommend/contribution', methods=['POST'])
    @require_auth
    def recommend_contribution():
        """
        Get AI recommendation for monthly contribution
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        
        target_amount = data.get('target_amount')
        target_date = data.get('target_date')
        current_amount = data.get('current_amount', 0)
        
        if not target_amount or target_amount <= 0:
            return jsonify({
                'error': 'Montant cible requis et doit être positif'
            }), 400
        
        try:
            engine = AIRecommendationEngine(user_email)
            
            # Parse target_date if provided
            target_dt = None
            if target_date:
                from datetime import datetime
                target_dt = datetime.fromisoformat(target_date.replace('Z', '+00:00'))
            
            recommendation = engine.recommend_monthly_contribution(
                target_amount, target_dt, current_amount
            )
            
            return jsonify({
                'success': True,
                'recommendation': recommendation
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la recommandation: {str(e)}'
            }), 500
    
    @app.route('/api/ml/recommend/date', methods=['POST'])
    @require_auth
    def recommend_date():
        """
        Get AI recommendation for target date
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        
        target_amount = data.get('target_amount')
        monthly_contribution = data.get('monthly_contribution')
        current_amount = data.get('current_amount', 0)
        
        if not target_amount or target_amount <= 0:
            return jsonify({
                'error': 'Montant cible requis'
            }), 400
        
        if not monthly_contribution or monthly_contribution <= 0:
            return jsonify({
                'error': 'Contribution mensuelle requise'
            }), 400
        
        try:
            engine = AIRecommendationEngine(user_email)
            
            recommendation = engine.recommend_target_date(
                target_amount, monthly_contribution, current_amount
            )
            
            return jsonify({
                'success': True,
                'recommendation': recommendation
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la recommandation: {str(e)}'
            }), 500
    
    @app.route('/api/ml/recommend/goal', methods=['POST'])
    @require_auth
    def recommend_goal():
        """
        Get AI recommendation for savings goal amount
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        
        goal_type = data.get('goal_type', 'emergency')
        timeframe_months = data.get('timeframe_months', 12)
        
        try:
            engine = AIRecommendationEngine(user_email)
            
            recommendation = engine.recommend_savings_goal(goal_type, timeframe_months)
            
            return jsonify({
                'success': True,
                'recommendation': recommendation
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la recommandation: {str(e)}'
            }), 500
    
    @app.route('/api/ml/analyze-health', methods=['GET'])
    @require_auth
    def analyze_budget_health():
        """
        Analyze overall budget health and provide recommendations
        """
        user_email = session['user_email']
        
        try:
            engine = AIRecommendationEngine(user_email)
            analysis = engine.analyze_budget_health()
            
            return jsonify({
                'success': True,
                'analysis': analysis
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de l\'analyse: {str(e)}'
            }), 500

