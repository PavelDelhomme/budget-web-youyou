"""
Configuration et fixtures pour les tests backend
"""
import pytest
import os
import sys
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'backend'))

from app import app
from api.utils import load_user, save_user


@pytest.fixture
def client():
    """Fixture pour le client Flask de test"""
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key-for-testing'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        yield client


@pytest.fixture
def admin_credentials():
    """Fixture pour les identifiants admin"""
    return {
        'email': os.environ.get('TEST_ADMIN_EMAIL', 'dev@delhomme.ovh'),
        'password': os.environ.get('TEST_ADMIN_PASSWORD', '5n!B@#c*ymgEBYXrWdKE')
    }


@pytest.fixture
def auth_session(client, admin_credentials):
    """Fixture pour créer une session authentifiée"""
    # Faire une requête de connexion
    response = client.post('/api/login',
        json={'email': admin_credentials['email'], 'password': admin_credentials['password']},
        content_type='application/json'
    )
    
    if response.status_code == 200:
        # Retourner le client avec la session
        return client
    
    # Si la connexion échoue, créer une session manuellement
    with client.session_transaction() as sess:
        sess['user_email'] = admin_credentials['email']
        sess['csrf_token'] = 'test-csrf-token'
        sess.permanent = True
    
    return client


@pytest.fixture
def csrf_token(client, auth_session):
    """Fixture pour obtenir un token CSRF valide"""
    response = client.get('/api/csrf-token')
    if response.status_code == 200:
        data = json.loads(response.data)
        return data.get('csrf_token', 'test-csrf-token')
    return 'test-csrf-token'


@pytest.fixture
def sample_user_data():
    """Fixture pour des données utilisateur de test"""
    return {
        'years': [2025],
        'datasets': {
            '2025': {
                'monthlySalary': 2000,
                'categories': [
                    {'id': 1, 'name': 'Alimentation', 'target': 300, 'color': '#FF5733'},
                    {'id': 2, 'name': 'Transport', 'target': 200, 'color': '#33FF57'}
                ],
                'expenses': [],
                'subs': [],
                'annualFixedExpenses': [],
                'additionalMonthlyIncomes': [],
                'currentSavings': 5000,
                'savingsTransactions': []
            }
        },
        'global': {
            'initializationComplete': True,
            'accounts': [],
            'investments': []
        }
    }


@pytest.fixture
def mock_load_user(monkeypatch, sample_user_data):
    """Fixture pour mocker load_user"""
    def _load_user(email):
        return sample_user_data
    monkeypatch.setattr('api.utils.load_user', _load_user)
    return _load_user


@pytest.fixture
def mock_save_user(monkeypatch):
    """Fixture pour mocker save_user"""
    def _save_user(email, data):
        return True
    monkeypatch.setattr('api.utils.save_user', _save_user)
    return _save_user


@pytest.fixture
def clean_test_data():
    """Fixture pour nettoyer les données de test"""
    test_email = 'test@example.com'
    test_data_file = Path(__file__).parent.parent.parent / 'backend' / 'data' / f'{test_email}.json'
    
    yield
    
    # Nettoyer après les tests
    if test_data_file.exists():
        test_data_file.unlink()


@pytest.fixture(autouse=True)
def reset_login_attempts():
    """Reset les tentatives de login avant chaque test"""
    from app import login_attempts
    login_attempts.clear()
    yield
    login_attempts.clear()

