"""
Tests complets pour les endpoints de données (GET/PUT)
"""
import pytest
import json
from datetime import datetime

class TestDataEndpoints:
    """Tests pour les endpoints de gestion des données"""
    
    def test_get_year_data_authenticated(self, client, auth_session):
        """Test récupération des données d'une année quand authentifié"""
        current_year = datetime.now().year
        
        response = client.get(f'/api/get?year={current_year}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'categories' in data
        assert 'expenses' in data
        assert 'subs' in data
    
    def test_get_year_data_unauthenticated(self, client):
        """Test récupération des données sans authentification"""
        response = client.get('/api/get?year=2025')
        assert response.status_code == 401
    
    def test_get_year_data_invalid_year(self, client, auth_session):
        """Test récupération des données avec année invalide"""
        response = client.get('/api/get?year=invalid')
        assert response.status_code == 400
    
    def test_get_year_data_missing_year(self, client, auth_session):
        """Test récupération des données sans paramètre year"""
        response = client.get('/api/get')
        assert response.status_code == 400
    
    def test_put_year_data_authenticated(self, client, auth_session, csrf_token):
        """Test sauvegarde des données d'une année quand authentifié"""
        current_year = datetime.now().year
        
        data_to_save = {
            'categories': [
                {'id': 1, 'name': 'Test', 'target': 100, 'color': '#FF0000'}
            ],
            'expenses': [],
            'subs': [],
            'annualFixedExpenses': []
        }
        
        response = client.put(f'/api/put?year={current_year}',
            json=data_to_save,
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 200
    
    def test_put_year_data_unauthenticated(self, client):
        """Test sauvegarde des données sans authentification"""
        response = client.put('/api/put?year=2025',
            json={'categories': []},
            content_type='application/json'
        )
        assert response.status_code == 401
    
    def test_put_year_data_missing_csrf(self, client, auth_session):
        """Test sauvegarde des données sans token CSRF"""
        response = client.put('/api/put?year=2025',
            json={'categories': []},
            content_type='application/json'
        )
        assert response.status_code == 403
    
    def test_put_year_data_invalid_data(self, client, auth_session, csrf_token):
        """Test sauvegarde avec données invalides"""
        response = client.put('/api/put?year=2025',
            json={'invalid': 'data'},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        # Devrait accepter ou retourner 400 selon la validation
        assert response.status_code in [200, 400]
    
    def test_get_global_data_authenticated(self, client, auth_session):
        """Test récupération des données globales quand authentifié"""
        response = client.get('/api/global')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'accounts' in data or 'initializationComplete' in data
    
    def test_get_global_data_unauthenticated(self, client):
        """Test récupération des données globales sans authentification"""
        response = client.get('/api/global')
        assert response.status_code == 401
    
    def test_put_global_data_authenticated(self, client, auth_session, csrf_token):
        """Test sauvegarde des données globales quand authentifié"""
        global_data = {
            'accounts': [],
            'investments': [],
            'initializationComplete': True
        }
        
        response = client.put('/api/global',
            json=global_data,
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 200
    
    def test_put_global_data_unauthenticated(self, client):
        """Test sauvegarde des données globales sans authentification"""
        response = client.put('/api/global',
            json={'accounts': []},
            content_type='application/json'
        )
        assert response.status_code == 401

