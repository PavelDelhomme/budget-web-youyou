"""
ML Service API endpoints for training and predictions
Supports both Neural Network (TensorFlow/Keras) and Traditional ML (scikit-learn)
"""
from flask import request, jsonify, session
from functools import wraps
import os

from api.utils import load_user, CACHE_DIR
from api.ml.model import create_predictor
from api.ml.neural_network import create_neural_predictor
from api.ml.recommendations import AIRecommendationEngine
from api.ml.data_validator import DataValidator
from api.ml.cache import create_ml_cache

# Initialize ML cache
ml_cache = create_ml_cache(CACHE_DIR)


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
        Supports both neural network and traditional ML models
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        
        try:
            # Get historical data
            historical_data = get_historical_data_for_ml(user_email)
            
            if len(historical_data) < 2:
                return jsonify({
                    'error': 'Pas assez de données historiques. Minimum 2 années nécessaires pour l\'entraînement.',
                    'years_available': len(historical_data)
                }), 400
            
            # Try neural network first, fallback to traditional ML
            use_neural = data.get('use_neural_network', True)  # Default to neural network
            model_type = 'neural_network'
            
            if use_neural:
                try:
                    predictor = create_neural_predictor(user_email)
                    if predictor:
                        # Get epochs from request or use default
                        epochs = data.get('epochs', 100)
                        scores = predictor.train(historical_data, epochs=epochs)
                    else:
                        # Fallback to traditional ML if neural network not available
                        model_type = 'traditional_ml'
                        predictor = create_predictor(user_email)
                        scores = predictor.train(historical_data)
                except Exception as e:
                    # Fallback to traditional ML on error
                    print(f"⚠️  Neural network not available, using traditional ML: {e}")
                    model_type = 'traditional_ml'
                    predictor = create_predictor(user_email)
                    scores = predictor.train(historical_data)
            else:
                # Use traditional ML
                model_type = 'traditional_ml'
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
                'model_info': info,
                'model_type': model_type
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
        Automatically uses neural network if available, otherwise traditional ML
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
            
            # Try neural network first, fallback to traditional ML
            predictor = create_neural_predictor(user_email)
            if not predictor or not predictor.is_trained:
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
                'predictions': predictions,
                'model_type': predictor.get_training_info().get('model_type', 'traditional_ml')
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
            # Vérifier d'abord si un modèle neuronal existe et est disponible
            neural_predictor = create_neural_predictor(user_email)
            model_type = 'traditional_ml'
            predictor = None
            neural_available = neural_predictor is not None
            neural_trained = False
            
            if neural_predictor:
                # Vérifier si le modèle neuronal est entraîné
                # Le load() dans create_neural_predictor devrait avoir chargé le modèle s'il existe
                if neural_predictor.is_trained:
                    predictor = neural_predictor
                    model_type = 'neural_network'
                    neural_trained = True
                else:
                    # Vérifier s'il existe un fichier de modèle sauvegardé même si is_trained est False
                    from pathlib import Path
                    model_path = neural_predictor._get_model_path()
                    scaler_path = neural_predictor._get_scaler_path()
                    
                    if model_path.exists() and scaler_path.exists():
                        # Modèle sauvegardé existe, essayer de le charger
                        try:
                            neural_predictor.load()
                            if neural_predictor.is_trained:
                                predictor = neural_predictor
                                model_type = 'neural_network'
                                neural_trained = True
                            else:
                                predictor = create_predictor(user_email)
                                model_type = 'traditional_ml'
                        except Exception:
                            predictor = create_predictor(user_email)
                            model_type = 'traditional_ml'
                    else:
                        # Pas de modèle neuronal entraîné, utiliser le traditionnel
                        predictor = create_predictor(user_email)
                        model_type = 'traditional_ml'
            else:
                # Pas de modèle neuronal disponible, utiliser le traditionnel
                predictor = create_predictor(user_email)
                model_type = 'traditional_ml'
            
            info = predictor.get_training_info()
            
            # S'assurer que le type de modèle est correct dans l'info
            info['model_type'] = model_type
            
            historical_data = get_historical_data_for_ml(user_email)
            
            return jsonify({
                'model_info': info,
                'historical_years_available': len(historical_data),
                'years': [d['year'] for d in historical_data],
                'model_type': model_type,
                'neural_network_available': neural_available,
                'neural_network_trained': neural_trained
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
        data = request.get_json() or {}
        
        try:
            # Get all historical data
            historical_data = get_historical_data_for_ml(user_email)
            
            if len(historical_data) < 2:
                return jsonify({
                    'error': 'Pas assez de données historiques. Minimum 2 années nécessaires.',
                    'years_available': len(historical_data)
                }), 400
            
            # Use neural network if available
            use_neural = data.get('use_neural_network', True)
            model_type = 'neural_network'
            
            if use_neural:
                try:
                    predictor = create_neural_predictor(user_email)
                    if predictor:
                        epochs = data.get('epochs', 100)
                        scores = predictor.train(historical_data, epochs=epochs)
                    else:
                        model_type = 'traditional_ml'
                        predictor = create_predictor(user_email)
                        scores = predictor.train(historical_data)
                except Exception:
                    model_type = 'traditional_ml'
                    predictor = create_predictor(user_email)
                    scores = predictor.train(historical_data)
            else:
                model_type = 'traditional_ml'
                predictor = create_predictor(user_email)
                scores = predictor.train(historical_data)
            
            if 'error' in scores:
                return jsonify(scores), 400
            
            return jsonify({
                'success': True,
                'message': 'Modèle réentraîné avec succès',
                'training_scores': scores,
                'years_used': len(historical_data),
                'model_type': model_type
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
    
    @app.route('/api/ml/benchmark', methods=['POST'])
    @require_auth
    def run_benchmark():
        """
        Run performance benchmark comparing neural network vs traditional ML
        """
        user_email = session['user_email']
        data = request.get_json() or {}
        use_synthetic_data = data.get('use_synthetic_data', False)
        
        try:
            from api.ml.performance_tests import run_benchmark
            
            results = run_benchmark(user_email, use_synthetic_data=use_synthetic_data)
            
            return jsonify({
                'success': True,
                'benchmark': results
            })
            
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors du benchmark: {str(e)}'
            }), 500
