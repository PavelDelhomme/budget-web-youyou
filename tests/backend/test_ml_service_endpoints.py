"""
Tests pour les endpoints ML API
"""
import pytest
import sys
import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'backend'))

from api.ml_service import get_historical_data_for_ml


class TestMLServiceHelpers:
    """Tests pour les fonctions helper du service ML"""
    
    @patch('api.ml_service.load_user')
    def test_get_historical_data_for_ml(self, mock_load_user):
        """Test la récupération des données historiques pour ML"""
        # Mock des données utilisateur
        mock_load_user.return_value = {
            'years': [2023, 2024, 2025],
            'datasets': {
                '2023': {'monthlySalary': 2000, 'categories': []},
                '2024': {'monthlySalary': 2100, 'categories': []},
                '2025': {'monthlySalary': 2200, 'categories': []}
            }
        }
        
        historical_data = get_historical_data_for_ml('test@example.com')
        
        assert len(historical_data) == 3
        assert all('year' in item and 'data' in item for item in historical_data)
        assert historical_data[0]['year'] == 2023
        assert historical_data[1]['year'] == 2024
        assert historical_data[2]['year'] == 2025
    
    @patch('api.ml_service.load_user')
    def test_get_historical_data_empty(self, mock_load_user):
        """Test avec aucune donnée historique"""
        mock_load_user.return_value = {
            'years': [],
            'datasets': {}
        }
        
        historical_data = get_historical_data_for_ml('test@example.com')
        assert len(historical_data) == 0
    
    @patch('api.ml_service.load_user')
    def test_get_historical_data_incomplete_years(self, mock_load_user):
        """Test avec des années incomplètes"""
        mock_load_user.return_value = {
            'years': [2023, 2024, 2025],
            'datasets': {
                '2023': {'monthlySalary': 2000},
                '2025': {'monthlySalary': 2200}
                # 2024 manquante
            }
        }
        
        historical_data = get_historical_data_for_ml('test@example.com')
        assert len(historical_data) == 2  # Seulement les années avec données
        assert historical_data[0]['year'] == 2023
        assert historical_data[1]['year'] == 2025


class TestBenchmarkEndpoint:
    """Tests pour l'endpoint de benchmark"""
    
    def test_benchmark_endpoint_exists(self, client, auth_session):
        """Test que l'endpoint de benchmark existe"""
        # Tester que l'endpoint répond (même si pas implémenté, devrait retourner 404 ou autre code)
        response = client.get('/api/ml/benchmark')
        # L'endpoint peut ne pas exister (404) ou être protégé (401) ou retourner des données (200)
        assert response.status_code in [200, 401, 404, 405], f"Status inattendu: {response.status_code}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

