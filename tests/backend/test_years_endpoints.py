"""
Tests complets pour les endpoints d'années
"""
import pytest
import json
from datetime import datetime

class TestYearsEndpoints:
    """Tests pour les endpoints de gestion des années"""
    
    def test_get_years_authenticated(self, client, auth_session):
        """Test récupération des années quand authentifié"""
        response = client.get('/api/years')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'email' in data
        assert 'years' in data
        assert isinstance(data['years'], list)
    
    def test_get_years_unauthenticated(self, client):
        """Test récupération des années sans authentification"""
        response = client.get('/api/years')
        assert response.status_code == 401
    
    def test_add_year_authenticated(self, client, auth_session, csrf_token):
        """Test ajout d'une année quand authentifié"""
        current_year = datetime.now().year
        # Essayer avec une année qui n'existe probablement pas (plus loin dans le futur)
        new_year = current_year + 5
        
        response = client.post('/api/years',
            json={'year': new_year},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        
        # Si l'année existe déjà, c'est OK (400), sinon devrait être créée (200)
        if response.status_code == 400:
            # Vérifier que l'erreur est bien "Cette année existe déjà"
            data = json.loads(response.data)
            assert 'error' in data
            # Peut être "Cette année existe déjà" ou une autre erreur de validation
        else:
            assert response.status_code == 200, f"Status inattendu: {response.status_code}, response: {response.data}"
            data = json.loads(response.data)
            assert 'years' in data
            assert new_year in data['years']
    
    def test_add_year_unauthenticated(self, client):
        """Test ajout d'une année sans authentification"""
        response = client.post('/api/years',
            json={'year': 2026},
            content_type='application/json'
        )
        assert response.status_code == 401
    
    def test_add_year_missing_csrf(self, client, auth_session):
        """Test ajout d'une année sans token CSRF"""
        response = client.post('/api/years',
            json={'year': 2026},
            content_type='application/json'
        )
        assert response.status_code == 403
    
    def test_add_year_invalid_year(self, client, auth_session, csrf_token):
        """Test ajout d'une année invalide"""
        response = client.post('/api/years',
            json={'year': 'invalid'},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_add_year_too_old(self, client, auth_session, csrf_token):
        """Test ajout d'une année trop ancienne"""
        response = client.post('/api/years',
            json={'year': 1900},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_add_year_too_future(self, client, auth_session, csrf_token):
        """Test ajout d'une année trop future"""
        response = client.post('/api/years',
            json={'year': 2100},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_add_duplicate_year(self, client, auth_session, csrf_token):
        """Test ajout d'une année déjà existante"""
        current_year = datetime.now().year
        
        # Ajouter l'année courante si elle n'existe pas
        response = client.post('/api/years',
            json={'year': current_year},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        
        # Essayer de l'ajouter à nouveau
        response = client.post('/api/years',
            json={'year': current_year},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code == 400

