"""
Neural Network Model for Budget Prediction using TensorFlow/Keras
Deep learning model with multiple layers for better predictions

OPTIMIZED: Lazy loading of TensorFlow to reduce memory consumption
"""
import os
import pickle
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

# Lazy loading: Do NOT import TensorFlow at module level
TF_AVAILABLE = None
TF_MODULE = None

def _lazy_import_tensorflow():
    """Lazy import TensorFlow only when needed"""
    global TF_AVAILABLE, TF_MODULE
    
    if TF_AVAILABLE is not None:
        return TF_AVAILABLE
    
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers, models, callbacks
        from tensorflow.keras.optimizers import Adam
        
        TF_MODULE = {
            'tf': tf,
            'keras': keras,
            'layers': layers,
            'models': models,
            'callbacks': callbacks,
            'Adam': Adam
        }
        
        # Désactiver les warnings TensorFlow
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        tf.get_logger().setLevel('ERROR')
        
        TF_AVAILABLE = True
        return True
    except ImportError:
        TF_AVAILABLE = False
        TF_MODULE = None
        print("⚠️  TensorFlow n'est pas disponible. Utilisez le modèle scikit-learn.")
        return False

from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .features import extract_features, extract_target_variables


class NeuralNetworkBudgetPredictor:
    """
    Deep Neural Network model for budget prediction using TensorFlow/Keras
    Architecture:
    - Input layer (15 features)
    - 3 Hidden layers with dropout for regularization
    - Output layer (3 outputs: expenses, income, savings)
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.model = None
        self.scaler_X = StandardScaler()
        self.scaler_y = MinMaxScaler()
        self.is_trained = False
        self.training_score = {}
        self.history = None
        self.model_dir = Path(__file__).parent.parent.parent / 'data' / 'models'
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Lazy load TensorFlow only when creating an instance
        if not _lazy_import_tensorflow():
            raise ImportError("TensorFlow n'est pas installé. Installez-le avec: pip install tensorflow")
    
    @property
    def tf(self):
        """Lazy access to TensorFlow"""
        _lazy_import_tensorflow()
        return TF_MODULE['tf']
    
    @property
    def keras(self):
        """Lazy access to Keras"""
        _lazy_import_tensorflow()
        return TF_MODULE['keras']
    
    @property
    def layers(self):
        """Lazy access to Keras layers"""
        _lazy_import_tensorflow()
        return TF_MODULE['layers']
    
    @property
    def models(self):
        """Lazy access to Keras models"""
        _lazy_import_tensorflow()
        return TF_MODULE['models']
    
    @property
    def callbacks(self):
        """Lazy access to Keras callbacks"""
        _lazy_import_tensorflow()
        return TF_MODULE['callbacks']
    
    @property
    def Adam(self):
        """Lazy access to Adam optimizer"""
        _lazy_import_tensorflow()
        return TF_MODULE['Adam']
    
    def _get_model_path(self, model_type: str = 'neural_network') -> Path:
        """Get path to saved model file"""
        safe_email = self.user_email.replace('@', '_at_').replace('.', '_')
        return self.model_dir / f"{safe_email}_{model_type}.h5"
    
    def _get_scaler_path(self, model_type: str = 'neural_network') -> Path:
        """Get path to saved scaler file"""
        safe_email = self.user_email.replace('@', '_at_').replace('.', '_')
        return self.model_dir / f"{safe_email}_{model_type}_scalers.pkl"
    
    def _build_model(self, input_dim: int, output_dim: int = 3):
        """
        Build a deep neural network model
        
        Architecture:
        - Input: input_dim features
        - Hidden Layer 1: 128 neurons, ReLU activation, Dropout 0.3
        - Hidden Layer 2: 64 neurons, ReLU activation, Dropout 0.3
        - Hidden Layer 3: 32 neurons, ReLU activation, Dropout 0.2
        - Output: output_dim neurons (no activation for regression)
        """
        layers_module = self.layers
        models_module = self.models
        
        model = models_module.Sequential([
            # Input layer
            layers_module.Dense(128, activation='relu', input_shape=(input_dim,), name='hidden1'),
            layers_module.BatchNormalization(name='bn1'),
            layers_module.Dropout(0.3, name='dropout1'),
            
            # Hidden layer 2
            layers_module.Dense(64, activation='relu', name='hidden2'),
            layers_module.BatchNormalization(name='bn2'),
            layers_module.Dropout(0.3, name='dropout2'),
            
            # Hidden layer 3
            layers_module.Dense(32, activation='relu', name='hidden3'),
            layers_module.BatchNormalization(name='bn3'),
            layers_module.Dropout(0.2, name='dropout3'),
            
            # Output layer (3 outputs: expenses, income, savings)
            layers_module.Dense(output_dim, activation='linear', name='output')
        ])
        
        # Compile model with Adam optimizer
        model.compile(
            optimizer=self.Adam(learning_rate=0.001),
            loss='mse',  # Mean Squared Error for regression
            metrics=['mae', 'mse']  # Mean Absolute Error and MSE
        )
        
        return model
    
    def train(self, historical_data: List[Dict[str, Any]], epochs: int = 100, batch_size: int = 32) -> Dict[str, float]:
        """
        Train the neural network on historical data
        
        Args:
            historical_data: List of historical year data
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Dictionary with training scores
        """
        if not TF_AVAILABLE:
            return {'error': 'TensorFlow n\'est pas disponible'}
        
        if len(historical_data) < 2:
            return {'error': 'Pas assez de données historiques (minimum 2 années nécessaires)'}
        
        # Extract features and targets
        X = extract_features(historical_data)
        y_dict = extract_target_variables(historical_data)
        
        if len(X) < 2:
            return {'error': 'Pas assez de données pour l\'entraînement'}
        
        # Prepare target data (stack all targets)
        y = np.column_stack([
            y_dict.get('total_expenses', []),
            y_dict.get('annual_income', []),
            y_dict.get('savings', [])
        ])
        
        if len(y) == 0:
            return {'error': 'Aucune cible disponible pour l\'entraînement'}
        
        # Normalize features
        X_scaled = self.scaler_X.fit_transform(X)
        
        # Normalize targets (important for neural networks)
        y_scaled = self.scaler_y.fit_transform(y)
        
        # Split data if we have enough samples
        if len(X_scaled) >= 3:
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y_scaled, test_size=0.3, random_state=42
            )
        else:
            # Use all data for training if not enough for split
            X_train, X_test = X_scaled, X_scaled
            y_train, y_test = y_scaled, y_scaled
        
        # Build model
        self.model = self._build_model(input_dim=X_scaled.shape[1], output_dim=3)
        
        # Early stopping to prevent overfitting
        callbacks_module = self.callbacks
        early_stop = callbacks_module.EarlyStopping(
            monitor='val_loss',
            patience=20,
            restore_best_weights=True,
            verbose=0
        )
        
        # Reduce learning rate on plateau
        reduce_lr = callbacks_module.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=10,
            min_lr=0.0001,
            verbose=0
        )
        
        # Train model
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test) if len(X_scaled) >= 3 else None,
            epochs=epochs,
            batch_size=min(batch_size, len(X_train)),
            verbose=0,
            callbacks=[early_stop, reduce_lr]
        )
        
        # Make predictions
        y_pred_scaled = self.model.predict(X_test, verbose=0)
        
        # Inverse transform to get real values
        y_pred = self.scaler_y.inverse_transform(y_pred_scaled)
        y_test_real = self.scaler_y.inverse_transform(y_test)
        
        # Calculate metrics for each target
        scores = {}
        target_names = ['total_expenses', 'annual_income', 'savings']
        
        for i, target_name in enumerate(target_names):
            mae = mean_absolute_error(y_test_real[:, i], y_pred[:, i])
            rmse = np.sqrt(mean_squared_error(y_test_real[:, i], y_pred[:, i]))
            r2 = r2_score(y_test_real[:, i], y_pred[:, i])
            
            scores[target_name] = {
                'mae': float(mae),
                'rmse': float(rmse),
                'r2': float(r2)
            }
        
        self.is_trained = True
        self.training_score = scores
        
        # Save model and scalers
        self.save()
        
        return scores
    
    def predict(self, future_years: List[int], last_historical_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Predict budget values for future years using neural network
        
        Args:
            future_years: List of years to predict
            last_historical_data: Last year's data (for features)
            
        Returns:
            List of predictions for each future year
        """
        if not self.is_trained or self.model is None:
            return []
        
        predictions = []
        
        # Create features for each future year
        for year in future_years:
            # Use last historical data as base
            base_year = last_historical_data.get('year', 2020)
            
            # Create feature vector for this future year
            last_features = extract_features([last_historical_data])
            if len(last_features) == 0:
                continue
            
            future_features = last_features[0].copy()
            
            # Update normalized year
            normalized_year = (year - 2020) / 10.0
            future_features[0] = normalized_year
            
            # Scale features
            future_features_scaled = self.scaler_X.transform([future_features])
            
            # Predict using neural network
            pred_scaled = self.model.predict(future_features_scaled, verbose=0)
            
            # Inverse transform to get real values
            pred_real = self.scaler_y.inverse_transform(pred_scaled)[0]
            
            predictions.append({
                'year': year,
                'predicted_total_expenses': float(pred_real[0]),
                'predicted_annual_income': float(pred_real[1]),
                'predicted_savings': float(pred_real[2]),
                'confidence': self._calculate_confidence(),
                'model_type': 'neural_network'
            })
        
        return predictions
    
    def _calculate_confidence(self) -> float:
        """Calculate prediction confidence based on training scores"""
        if not self.training_score:
            return 0.5
        
        # Average R² score across all targets
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
        """Save trained model and scalers to disk"""
        if self.model is None:
            return
        
        # Save Keras model
        model_path = self._get_model_path()
        self.model.save(str(model_path))
        
        # Save scalers
        scaler_path = self._get_scaler_path()
        scaler_data = {
            'scaler_X': self.scaler_X,
            'scaler_y': self.scaler_y,
            'is_trained': self.is_trained,
            'training_score': self.training_score,
            'user_email': self.user_email,
        }
        
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler_data, f)
    
    def load(self) -> bool:
        """Load trained model and scalers from disk"""
        model_path = self._get_model_path()
        scaler_path = self._get_scaler_path()
        
        if not model_path.exists() or not scaler_path.exists():
            return False
        
        try:
            # Load Keras model
            keras_module = self.keras
            self.model = keras_module.models.load_model(str(model_path))
            
            # Load scalers
            with open(scaler_path, 'rb') as f:
                scaler_data = pickle.load(f)
            
            self.scaler_X = scaler_data['scaler_X']
            self.scaler_y = scaler_data['scaler_y']
            self.is_trained = scaler_data['is_trained']
            self.training_score = scaler_data.get('training_score', {})
            
            return True
        except Exception as e:
            print(f"Error loading neural network model: {e}")
            return False
    
    def get_training_info(self) -> Dict[str, Any]:
        """Get information about model training"""
        info = {
            'is_trained': self.is_trained,
            'training_score': self.training_score,
            'has_saved_model': self._get_model_path().exists(),
            'model_type': 'neural_network',
            'tensorflow_available': _lazy_import_tensorflow(),
        }
        
        if self.history:
            info['training_history'] = {
                'loss': [float(x) for x in self.history.history.get('loss', [])],
                'mae': [float(x) for x in self.history.history.get('mae', [])],
                'val_loss': [float(x) for x in self.history.history.get('val_loss', [])] if 'val_loss' in self.history.history else [],
                'epochs': len(self.history.history.get('loss', []))
            }
        
        return info


def create_neural_predictor(user_email: str) -> Optional[NeuralNetworkBudgetPredictor]:
    """Create a neural network predictor instance for a user (lazy loading)"""
    if not _lazy_import_tensorflow():
        return None
    
    try:
        predictor = NeuralNetworkBudgetPredictor(user_email)
        predictor.load()
        return predictor
    except Exception as e:
        print(f"Error creating neural network predictor: {e}")
        return None
