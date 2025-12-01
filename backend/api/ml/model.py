"""
Machine Learning models for budget prediction
Uses scikit-learn for training and prediction
"""
import os
import pickle
import numpy as np
from typing import Dict, List, Any, Optional
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .features import extract_features, extract_target_variables


class BudgetPredictor:
    """
    Machine Learning model for predicting budget values
    Uses ensemble of models for better predictions
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.models = {
            'total_expenses': RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10),
            'annual_income': Ridge(alpha=1.0),
            'savings': GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5),
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_score = {}
        self.model_dir = Path(__file__).parent.parent.parent / 'data' / 'models'
        self.model_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_model_path(self, model_type: str = 'budget') -> Path:
        """Get path to saved model file"""
        safe_email = self.user_email.replace('@', '_at_').replace('.', '_')
        return self.model_dir / f"{safe_email}_{model_type}.pkl"
    
    def train(self, historical_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Train the models on historical data
        
        Args:
            historical_data: List of historical year data
            
        Returns:
            Dictionary with training scores for each target
        """
        if len(historical_data) < 2:
            return {'error': 'Pas assez de données historiques (minimum 2 années nécessaires)'}
        
        # Extract features and targets
        X = extract_features(historical_data)
        y = extract_target_variables(historical_data)
        
        if len(X) < 2:
            return {'error': 'Pas assez de données pour l\'entraînement'}
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        scores = {}
        
        # Train each model
        for target_name, model in self.models.items():
            if target_name not in y or len(y[target_name]) == 0:
                continue
            
            target_values = y[target_name]
            
            # Si on a assez de données, faire un split train/test
            if len(X_scaled) >= 3:
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, target_values, test_size=0.3, random_state=42
                )
                
                # Train model
                model.fit(X_train, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test)
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                scores[target_name] = {
                    'mae': float(mae),
                    'r2': float(r2),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred)))
                }
            else:
                # Pas assez de données pour split, entraîner sur tout
                model.fit(X_scaled, target_values)
                scores[target_name] = {'mae': 0, 'r2': 0, 'rmse': 0}
        
        self.is_trained = True
        self.training_score = scores
        
        # Save models
        self.save()
        
        return scores
    
    def predict(self, future_years: List[int], last_historical_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Predict budget values for future years
        
        Args:
            future_years: List of years to predict
            last_historical_data: Last year's data (for features)
            
        Returns:
            List of predictions for each future year
        """
        if not self.is_trained:
            return []
        
        predictions = []
        
        # Create features for each future year
        for i, year in enumerate(future_years):
            # Use last historical data as base
            base_year = last_historical_data.get('year', 2020)
            years_ahead = year - base_year
            
            # Create feature vector for this future year
            # Start with last year's features
            last_features = extract_features([last_historical_data])
            if len(last_features) == 0:
                continue
            
            future_features = last_features[0].copy()
            
            # Update normalized year
            normalized_year = (year - 2020) / 10.0
            future_features[0] = normalized_year
            
            # Scale features
            future_features_scaled = self.scaler.transform([future_features])
            
            # Predict each target
            pred_total_expenses = self.models['total_expenses'].predict(future_features_scaled)[0]
            pred_annual_income = self.models['annual_income'].predict(future_features_scaled)[0]
            pred_savings = self.models['savings'].predict(future_features_scaled)[0]
            
            predictions.append({
                'year': year,
                'predicted_total_expenses': float(pred_total_expenses),
                'predicted_annual_income': float(pred_annual_income),
                'predicted_savings': float(pred_savings),
                'confidence': self._calculate_confidence(),
            })
        
        return predictions
    
    def _calculate_confidence(self) -> float:
        """Calculate prediction confidence based on training scores"""
        if not self.training_score:
            return 0.5
        
        # Average R² score across all models
        r2_scores = [
            score.get('r2', 0) 
            for score in self.training_score.values()
        ]
        
        if not r2_scores:
            return 0.5
        
        avg_r2 = np.mean(r2_scores)
        # Convert R² to confidence (0-1 scale)
        confidence = max(0, min(1, (avg_r2 + 1) / 2))
        
        return confidence
    
    def save(self):
        """Save trained models to disk"""
        model_data = {
            'models': self.models,
            'scaler': self.scaler,
            'is_trained': self.is_trained,
            'training_score': self.training_score,
            'user_email': self.user_email,
        }
        
        model_path = self._get_model_path()
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load(self) -> bool:
        """Load trained models from disk"""
        model_path = self._get_model_path()
        
        if not model_path.exists():
            return False
        
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            self.models = model_data['models']
            self.scaler = model_data['scaler']
            self.is_trained = model_data['is_trained']
            self.training_score = model_data.get('training_score', {})
            
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def get_training_info(self) -> Dict[str, Any]:
        """Get information about model training"""
        return {
            'is_trained': self.is_trained,
            'training_score': self.training_score,
            'has_saved_model': self._get_model_path().exists(),
        }


def create_predictor(user_email: str) -> BudgetPredictor:
    """Create a budget predictor instance for a user"""
    predictor = BudgetPredictor(user_email)
    
    # Try to load existing model
    predictor.load()
    
    return predictor

