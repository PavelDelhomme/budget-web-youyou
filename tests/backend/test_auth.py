"""
Tests complets pour l'authentification
"""
import pytest
import json
import time
from unittest.mock import patch, MagicMock

class TestAuthentication:
    """Tests pour les endpoints d'authentification"""
    
    def test_get_csrf_token_authenticated(self, client, auth_session):
        """Test récupération du token CSRF quand authentifié"""
        response = client.get('/api/csrf-token')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'csrf_token' in data
        assert len(data['csrf_token']) > 0
    
    def test_get_csrf_token_unauthenticated(self, client):
        """Test récupération du token CSRF sans authentification"""
        response = client.get('/api/csrf-token')
        assert response.status_code == 401
    
    def test_login_success(self, client, admin_credentials):
        """Test connexion réussie"""
        response = client.post('/api/login', 
            json={'email': admin_credentials['email'], 'password': admin_credentials['password']},
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'email' in data
        assert 'years' in data
        assert 'csrf_token' in data
    
    def test_login_invalid_email(self, client, admin_credentials):
        """Test connexion avec email invalide"""
        response = client.post('/api/login',
            json={'email': 'invalid-email', 'password': admin_credentials['password']},
            content_type='application/json'
        )
        assert response.status_code == 401
    
    def test_login_invalid_password(self, client, admin_credentials):
        """Test connexion avec mot de passe invalide"""
        response = client.post('/api/login',
            json={'email': admin_credentials['email'], 'password': 'wrongpassword'},
            content_type='application/json'
        )
        assert response.status_code == 401
    
    def test_login_missing_data(self, client):
        """Test connexion sans données"""
        response = client.post('/api/login', content_type='application/json')
        assert response.status_code == 400
    
    def test_login_rate_limiting(self, client, admin_credentials):
        """Test limitation du nombre de tentatives de connexion"""
        # Faire plusieurs tentatives échouées
        for _ in range(6):
            response = client.post('/api/login',
                json={'email': admin_credentials['email'], 'password': 'wrongpassword'},
                content_type='application/json'
            )
        
        # La dernière devrait être bloquée
        assert response.status_code == 429
    
    def test_login_email_too_long(self, client):
        """Test connexion avec email trop long"""
        long_email = 'a' * 255 + '@example.com'
        response = client.post('/api/login',
            json={'email': long_email, 'password': 'password'},
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_login_password_too_long(self, client, admin_credentials):
        """Test connexion avec mot de passe trop long"""
        long_password = 'a' * 501
        response = client.post('/api/login',
            json={'email': admin_credentials['email'], 'password': long_password},
            content_type='application/json'
        )
        assert response.status_code == 401
    
    def test_logout_authenticated(self, client, auth_session):
        """Test déconnexion quand authentifié"""
        response = client.post('/api/logout')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] == True
    
    def test_logout_unauthenticated(self, client):
        """Test déconnexion sans authentification"""
        response = client.post('/api/logout')
        assert response.status_code == 401
    
    def test_session_check_authenticated(self, client, auth_session):
        """Test vérification de session quand authentifié"""
        response = client.get('/api/session-check')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['authenticated'] == True
        assert 'email' in data
    
    def test_session_check_unauthenticated(self, client):
        """Test vérification de session sans authentification"""
        response = client.get('/api/session-check')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['authenticated'] == False
    
    def test_session_cookie_security(self, client, admin_credentials):
        """Test sécurité des cookies de session"""
        response = client.post('/api/login',
            json={'email': admin_credentials['email'], 'password': admin_credentials['password']},
            content_type='application/json'
        )
        assert response.status_code == 200
        
        # Vérifier les headers de sécurité
        set_cookie = response.headers.get('Set-Cookie', '')
        assert 'HttpOnly' in set_cookie
        assert 'SameSite' in set_cookie or 'SameSite=Lax' in set_cookie

