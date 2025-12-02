"""
Tests de performance comparatifs entre modèles ML
Compare les performances du réseau neuronal vs modèles traditionnels
"""
import time
import json
from typing import Dict, List, Any, Tuple
from pathlib import Path
from datetime import datetime

from api.ml.model import create_predictor
from api.ml.neural_network import create_neural_predictor
from api.utils import load_user, get_default_year_data


class PerformanceBenchmark:
    """
    Benchmark pour comparer les performances des modèles ML
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.results = {}
    
    def generate_test_data(self, num_years: int = 5) -> List[Dict[str, Any]]:
        """
        Génère des données de test synthétiques pour le benchmark
        
        Args:
            num_years: Nombre d'années de données à générer
            
        Returns:
            Liste de données d'années
        """
        test_data = []
        base_year = datetime.now().year - num_years
        
        for i in range(num_years):
            year = base_year + i
            year_data = get_default_year_data()
            
            # Données réalistes avec variation
            year_data['monthlySalary'] = 2000 + (i * 50)  # Augmentation progressive
            year_data['categories'] = [
                {'id': 'alimentation', 'name': 'Alimentation', 'target': 3000 + (i * 100)},
                {'id': 'transport', 'name': 'Transport', 'target': 1500 + (i * 50)},
                {'id': 'loisirs', 'name': 'Loisirs', 'target': 1000 + (i * 30)},
            ]
            
            # Quelques dépenses
            year_data['expenses'] = [
                {
                    'id': f'exp_{j}',
                    'categoryId': year_data['categories'][j % len(year_data['categories'])]['id'],
                    'amount': 100 + (j * 20),
                    'date': f'{year}-{(j % 12) + 1:02d}-15',
                    'month': (j % 12) + 1,
                }
                for j in range(10)  # 10 dépenses par année
            ]
            
            test_data.append({
                'year': year,
                'data': year_data
            })
        
        return test_data
    
    def benchmark_training(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare les temps d'entraînement des deux types de modèles
        
        Args:
            historical_data: Données historiques pour l'entraînement
            
        Returns:
            Résultats du benchmark d'entraînement
        """
        results = {
            'traditional_ml': None,
            'neural_network': None,
        }
        
        # Test modèle traditionnel
        try:
            traditional_predictor = create_predictor(self.user_email)
            
            start_time = time.time()
            traditional_predictor.train(historical_data)
            traditional_time = time.time() - start_time
            
            traditional_info = traditional_predictor.get_training_info()
            
            results['traditional_ml'] = {
                'training_time': traditional_time,
                'scores': traditional_info.get('training_score', {}),
                'success': True
            }
        except Exception as e:
            results['traditional_ml'] = {
                'training_time': None,
                'error': str(e),
                'success': False
            }
        
        # Test réseau neuronal
        try:
            neural_predictor = create_neural_predictor(self.user_email)
            
            start_time = time.time()
            neural_predictor.train(historical_data, epochs=50)  # Moins d'epochs pour le test
            neural_time = time.time() - start_time
            
            neural_info = neural_predictor.get_training_info()
            
            results['neural_network'] = {
                'training_time': neural_time,
                'scores': neural_info.get('training_score', {}),
                'success': True
            }
        except Exception as e:
            results['neural_network'] = {
                'training_time': None,
                'error': str(e),
                'success': False
            }
        
        return results
    
    def benchmark_prediction(self, historical_data: List[Dict[str, Any]], target_years: List[int]) -> Dict[str, Any]:
        """
        Compare les temps de prédiction des deux types de modèles
        
        Args:
            historical_data: Données historiques
            target_years: Années à prédire
            
        Returns:
            Résultats du benchmark de prédiction
        """
        results = {
            'traditional_ml': None,
            'neural_network': None,
        }
        
        # Entraîner les modèles d'abord
        traditional_predictor = None
        neural_predictor = None
        
        try:
            traditional_predictor = create_predictor(self.user_email)
            traditional_predictor.train(historical_data)
        except Exception as e:
            results['traditional_ml'] = {'error': str(e), 'success': False}
        
        try:
            neural_predictor = create_neural_predictor(self.user_email)
            neural_predictor.train(historical_data, epochs=50)
        except Exception as e:
            results['neural_network'] = {'error': str(e), 'success': False}
        
        # Test prédictions modèle traditionnel
        if traditional_predictor:
            try:
                start_time = time.time()
                traditional_predictions = []
                for year in target_years:
                    pred = traditional_predictor.predict(year, historical_data)
                    traditional_predictions.append(pred)
                traditional_time = time.time() - start_time
                
                results['traditional_ml'] = {
                    'prediction_time': traditional_time,
                    'time_per_prediction': traditional_time / len(target_years),
                    'num_predictions': len(target_years),
                    'success': True
                }
            except Exception as e:
                results['traditional_ml'] = {
                    'error': str(e),
                    'success': False
                }
        
        # Test prédictions réseau neuronal
        if neural_predictor:
            try:
                start_time = time.time()
                neural_predictions = []
                for year in target_years:
                    pred = neural_predictor.predict(year, historical_data)
                    neural_predictions.append(pred)
                neural_time = time.time() - start_time
                
                results['neural_network'] = {
                    'prediction_time': neural_time,
                    'time_per_prediction': neural_time / len(target_years),
                    'num_predictions': len(target_years),
                    'success': True
                }
            except Exception as e:
                results['neural_network'] = {
                    'error': str(e),
                    'success': False
                }
        
        return results
    
    def benchmark_accuracy(self, historical_data: List[Dict[str, Any]], test_years: List[int]) -> Dict[str, Any]:
        """
        Compare la précision des deux types de modèles
        
        Args:
            historical_data: Données historiques
            test_years: Années à utiliser pour tester la précision
            
        Returns:
            Résultats du benchmark de précision
        """
        results = {
            'traditional_ml': None,
            'neural_network': None,
        }
        
        # Séparer les données en train/test
        train_data = [d for d in historical_data if d['year'] not in test_years]
        test_data = [d for d in historical_data if d['year'] in test_years]
        
        if len(train_data) < 2 or len(test_data) == 0:
            return {
                'error': 'Pas assez de données pour le test de précision (besoin de 2+ années pour train et 1+ pour test)',
                'traditional_ml': None,
                'neural_network': None
            }
        
        # Test modèle traditionnel
        try:
            traditional_predictor = create_predictor(self.user_email)
            traditional_predictor.train(train_data)
            
            traditional_errors = []
            for test_item in test_data:
                year = test_item['year']
                actual_data = test_item['data']
                
                predicted = traditional_predictor.predict(year, train_data)
                
                # Comparer avec les valeurs réelles
                actual_expenses = sum(
                    cat.get('target', 0) for cat in actual_data.get('categories', [])
                )
                predicted_expenses = predicted.get('total_expenses', 0)
                
                if actual_expenses > 0:
                    error_percent = abs((predicted_expenses - actual_expenses) / actual_expenses) * 100
                    traditional_errors.append(error_percent)
            
            avg_error = sum(traditional_errors) / len(traditional_errors) if traditional_errors else 0
            
            results['traditional_ml'] = {
                'average_error_percent': avg_error,
                'num_tests': len(test_data),
                'success': True
            }
        except Exception as e:
            results['traditional_ml'] = {
                'error': str(e),
                'success': False
            }
        
        # Test réseau neuronal
        try:
            neural_predictor = create_neural_predictor(self.user_email)
            neural_predictor.train(train_data, epochs=50)
            
            neural_errors = []
            for test_item in test_data:
                year = test_item['year']
                actual_data = test_item['data']
                
                predicted = neural_predictor.predict(year, train_data)
                
                # Comparer avec les valeurs réelles
                actual_expenses = sum(
                    cat.get('target', 0) for cat in actual_data.get('categories', [])
                )
                predicted_expenses = predicted.get('total_expenses', 0)
                
                if actual_expenses > 0:
                    error_percent = abs((predicted_expenses - actual_expenses) / actual_expenses) * 100
                    neural_errors.append(error_percent)
            
            avg_error = sum(neural_errors) / len(neural_errors) if neural_errors else 0
            
            results['neural_network'] = {
                'average_error_percent': avg_error,
                'num_tests': len(test_data),
                'success': True
            }
        except Exception as e:
            results['neural_network'] = {
                'error': str(e),
                'success': False
            }
        
        return results
    
    def run_full_benchmark(self, use_synthetic_data: bool = False) -> Dict[str, Any]:
        """
        Lance un benchmark complet
        
        Args:
            use_synthetic_data: Utiliser des données synthétiques au lieu des vraies données
            
        Returns:
            Résultats complets du benchmark
        """
        # Charger ou générer les données
        if use_synthetic_data:
            historical_data = self.generate_test_data(num_years=5)
        else:
            user_data = load_user(self.user_email)
            datasets = user_data.get('datasets', {})
            historical_data = [
                {'year': int(year), 'data': data}
                for year, data in datasets.items()
                if data  # Ignorer les années vides
            ]
            historical_data.sort(key=lambda x: x['year'])
        
        if len(historical_data) < 2:
            return {
                'error': 'Pas assez de données historiques (besoin de 2+ années)',
                'recommendation': 'Ajoutez plus de données d\'années précédentes pour comparer les modèles'
            }
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'user_email': self.user_email,
            'num_historical_years': len(historical_data),
            'training_benchmark': None,
            'prediction_benchmark': None,
            'accuracy_benchmark': None,
        }
        
        # Benchmark entraînement
        try:
            results['training_benchmark'] = self.benchmark_training(historical_data)
        except Exception as e:
            results['training_benchmark'] = {'error': str(e)}
        
        # Benchmark prédiction
        try:
            target_years = [max(d['year'] for d in historical_data) + 1]
            results['prediction_benchmark'] = self.benchmark_prediction(historical_data, target_years)
        except Exception as e:
            results['prediction_benchmark'] = {'error': str(e)}
        
        # Benchmark précision
        try:
            # Utiliser la dernière année comme test
            if len(historical_data) >= 3:
                test_years = [historical_data[-1]['year']]
                results['accuracy_benchmark'] = self.benchmark_accuracy(historical_data, test_years)
        except Exception as e:
            results['accuracy_benchmark'] = {'error': str(e)}
        
        # Recommandation finale
        results['recommendation'] = self._generate_recommendation(results)
        
        return results
    
    def _generate_recommendation(self, results: Dict[str, Any]) -> str:
        """Génère une recommandation basée sur les résultats"""
        training = results.get('training_benchmark', {})
        accuracy = results.get('accuracy_benchmark', {})
        
        traditional_training = training.get('traditional_ml', {})
        neural_training = training.get('neural_network', {})
        
        traditional_accuracy = accuracy.get('traditional_ml', {})
        neural_accuracy = accuracy.get('neural_network', {})
        
        # Si le réseau neuronal n'est pas disponible
        if not neural_training.get('success'):
            return "Modèle traditionnel recommandé (réseau neuronal non disponible)"
        
        # Comparer les performances
        neural_error = neural_accuracy.get('average_error_percent', 100)
        traditional_error = traditional_accuracy.get('average_error_percent', 100)
        
        if neural_error < traditional_error * 0.8:  # 20% meilleur
            return "Réseau neuronal recommandé (meilleure précision)"
        elif traditional_error < neural_error * 0.8:
            return "Modèle traditionnel recommandé (meilleure précision)"
        else:
            # Comparer les temps
            neural_time = neural_training.get('training_time', 0)
            traditional_time = traditional_training.get('training_time', 0)
            
            if neural_time < traditional_time * 1.5:  # Pas trop plus lent
                return "Réseau neuronal recommandé (bon compromis vitesse/précision)"
            else:
                return "Modèle traditionnel recommandé (plus rapide avec précision similaire)"


def run_benchmark(user_email: str, use_synthetic_data: bool = False) -> Dict[str, Any]:
    """
    Fonction helper pour lancer un benchmark
    
    Args:
        user_email: Email de l'utilisateur
        use_synthetic_data: Utiliser des données synthétiques
        
    Returns:
        Résultats du benchmark
    """
    benchmark = PerformanceBenchmark(user_email)
    return benchmark.run_full_benchmark(use_synthetic_data=use_synthetic_data)

