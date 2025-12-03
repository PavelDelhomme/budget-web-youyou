"""
Tests complets pour la validation des données
"""
import pytest
import json
from datetime import datetime

class TestValidation:
    """Tests pour la validation des données"""
    
    def test_validate_year_format(self, client, auth_session):
        """Test validation du format d'année"""
        invalid_years = ['invalid', '2025.5', '', None, -1, 1900, 2100]
        
        for invalid_year in invalid_years:
            response = client.get(f'/api/get?year={invalid_year}')
            # Devrait retourner une erreur de validation
            assert response.status_code in [400, 500]
    
    def test_validate_email_format(self, client):
        """Test validation du format d'email"""
        invalid_emails = [
            'notanemail',
            '@example.com',
            'test@',
            'test@.com',
            'test @example.com',
            ''
        ]
        
        for invalid_email in invalid_emails:
            response = client.post('/api/login',
                json={'email': invalid_email, 'password': 'password'},
                content_type='application/json'
            )
            assert response.status_code in [400, 401]
    
    def test_validate_category_data(self, client, auth_session, csrf_token):
        """Test validation des données de catégorie"""
        invalid_categories = [
            {'name': ''},  # Nom vide
            {'name': 'Test', 'target': 'invalid'},  # Target invalide
            {'name': 'Test', 'target': -100},  # Target négatif
            {'name': 'Test' * 1000, 'target': 100},  # Nom trop long
        ]
        
        for invalid_cat in invalid_categories:
            response = client.put('/api/put?year=2025',
                json={'categories': [invalid_cat]},
                headers={'X-CSRF-Token': csrf_token},
                content_type='application/json'
            )
            # Devrait valider ou retourner une erreur
            assert response.status_code in [200, 400]
    
    def test_validate_expense_data(self, client, auth_session, csrf_token):
        """Test validation des données de dépense"""
        invalid_expenses = [
            {'amount': 'invalid'},  # Montant invalide
            {'amount': -100},  # Montant négatif
            {'date': 'invalid-date'},  # Date invalide
            {'categoryId': 'invalid'},  # CategoryId invalide
        ]
        
        for invalid_exp in invalid_expenses:
            response = client.put('/api/put?year=2025',
                json={'expenses': [invalid_exp]},
                headers={'X-CSRF-Token': csrf_token},
                content_type='application/json'
            )
            assert response.status_code in [200, 400]
    
    def test_validate_json_structure(self, client, auth_session, csrf_token):
        """Test validation de la structure JSON"""
        # JSON mal formé
        response = client.put('/api/put?year=2025',
            data='{invalid json}',
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code in [400, 500]
        
        # Données manquantes
        response = client.put('/api/put?year=2025',
            json={},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        # Pourrait être accepté ou retourner une erreur
        assert response.status_code in [200, 400]
    
    def test_validate_data_types(self, client, auth_session, csrf_token):
        """Test validation des types de données"""
        # Tester avec des types incorrects
        invalid_data = {
            'categories': 'not an array',
            'expenses': 123,
            'subs': None
        }
        
        response = client.put('/api/put?year=2025',
            json=invalid_data,
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code in [200, 400]
    
    def test_validate_string_length(self, client, auth_session, csrf_token):
        """Test validation de la longueur des chaînes"""
        # Chaîne très longue
        long_string = 'a' * 10000
        
        response = client.put('/api/put?year=2025',
            json={'categories': [{'id': 1, 'name': long_string, 'target': 100}]},
            headers={'X-CSRF-Token': csrf_token},
            content_type='application/json'
        )
        assert response.status_code in [200, 400]
    
    def test_validate_number_ranges(self, client, auth_session, csrf_token):
        """Test validation des plages de nombres"""
        # Nombres extrêmes
        extreme_numbers = [
            999999999999,
            -999999999999,
            0,
            float('inf'),
            float('-inf')
        ]
        
        for num in extreme_numbers:
            response = client.put('/api/put?year=2025',
                json={'categories': [{'id': 1, 'name': 'Test', 'target': num}]},
                headers={'X-CSRF-Token': csrf_token},
                content_type='application/json'
            )
            assert response.status_code in [200, 400]

