"""
Tests unitaires pour les tests de performance ML
"""
import pytest
import sys
from pathlib import Path

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'backend'))

from api.ml.performance_tests import PerformanceBenchmark
from api.utils import get_default_year_data


class TestPerformanceBenchmark:
    """Tests pour la classe PerformanceBenchmark"""
    
    def test_generate_test_data(self):
        """Test la génération de données de test"""
        benchmark = PerformanceBenchmark('test@example.com')
        test_data = benchmark.generate_test_data(num_years=3)
        
        assert len(test_data) == 3
        assert all('year' in item and 'data' in item for item in test_data)
        
        # Vérifier que les années sont consécutives
        years = [item['year'] for item in test_data]
        assert years == sorted(years)
        
        # Vérifier que chaque année a des données valides
        for item in test_data:
            assert 'monthlySalary' in item['data']
            assert 'categories' in item['data']
            assert len(item['data']['categories']) > 0
    
    def test_generate_recommendation(self):
        """Test la génération de recommandation"""
        benchmark = PerformanceBenchmark('test@example.com')
        
        # Test avec données minimales
        results = {
            'training_benchmark': {
                'traditional_ml': {'training_time': 1.0, 'success': True},
                'neural_network': {'training_time': 2.0, 'success': True}
            },
            'accuracy_benchmark': {
                'traditional_ml': {'average_error_percent': 10.0, 'success': True},
                'neural_network': {'average_error_percent': 8.0, 'success': True}
            }
        }
        
        recommendation = benchmark._generate_recommendation(results)
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0
        assert any(keyword in recommendation.lower() for keyword in ['recommandé', 'neuronal', 'traditionnel'])
    
    def test_generate_recommendation_neural_unavailable(self):
        """Test la recommandation quand le réseau neuronal n'est pas disponible"""
        benchmark = PerformanceBenchmark('test@example.com')
        
        results = {
            'training_benchmark': {
                'traditional_ml': {'training_time': 1.0, 'success': True},
                'neural_network': {'success': False, 'error': 'TensorFlow not available'}
            }
        }
        
        recommendation = benchmark._generate_recommendation(results)
        assert 'traditionnel' in recommendation.lower() or 'non disponible' in recommendation.lower()
    
    def test_benchmark_initialization(self):
        """Test l'initialisation de PerformanceBenchmark"""
        benchmark = PerformanceBenchmark('test@example.com')
        assert benchmark.user_email == 'test@example.com'
        assert isinstance(benchmark.results, dict)
        assert len(benchmark.results) == 0


class TestBenchmarkHelpers:
    """Tests pour les fonctions helper du benchmark"""
    
    def test_generate_test_data_structure(self):
        """Test que les données générées ont la bonne structure"""
        from api.ml.performance_tests import PerformanceBenchmark
        
        benchmark = PerformanceBenchmark('test@example.com')
        test_data = benchmark.generate_test_data(num_years=2)
        
        # Vérifier la structure
        for year_item in test_data:
            assert 'year' in year_item
            assert 'data' in year_item
            
            data = year_item['data']
            assert 'monthlySalary' in data
            assert isinstance(data['monthlySalary'], (int, float))
            assert data['monthlySalary'] > 0
            
            assert 'categories' in data
            assert isinstance(data['categories'], list)
            assert len(data['categories']) > 0
            
            # Vérifier la structure des catégories
            for cat in data['categories']:
                assert 'id' in cat
                assert 'name' in cat
                assert 'target' in cat
                assert isinstance(cat['target'], (int, float))


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

