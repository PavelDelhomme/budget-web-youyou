"""
API Impôt particulier (DGFiP) integration
Documentation: https://www.data.gouv.fr/dataservices/api-impot-particulier/
"""
import os
import requests
from typing import Dict, Any, Optional
from flask import session


class ImpotParticulierAPI:
    """
    Client for DGFiP API Impôt particulier
    Requires authentication and user consent via FranceConnect
    """
    
    def __init__(self):
        self.base_url = os.environ.get('IMPOT_API_URL', 'https://api.impots.gouv.fr/particulier/v1')
        self.client_id = os.environ.get('IMPOT_CLIENT_ID', '')
        self.client_secret = os.environ.get('IMPOT_CLIENT_SECRET', '')
        self.requires_authentication = True
    
    def get_revenu_fiscal_reference(self, fiscal_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get Revenu Fiscal de Référence (RFR)
        Requires user authentication via FranceConnect
        
        Args:
            fiscal_id: Fiscal identifier (SPI) or None to use session
            
        Returns:
            RFR data or error
        """
        if not self._check_authentication():
            return {
                'error': 'Authentication required',
                'message': 'Veuillez vous connecter via FranceConnect pour accéder à vos données fiscales'
            }
        
        # In production, this would call the actual API
        # For now, return a placeholder structure
        return {
            'revenu_fiscal_reference': None,
            'message': 'API non configurée. Configurez IMPOT_CLIENT_ID et IMPOT_CLIENT_SECRET',
            'note': 'Cette API nécessite une habilitation de la DGFiP'
        }
    
    def get_fiscal_situation(self) -> Dict[str, Any]:
        """
        Get complete fiscal situation including:
        - Revenu fiscal de référence
        - Nombre de parts fiscales
        - Situation familiale
        - Adresse fiscale
        """
        if not self._check_authentication():
            return {
                'error': 'Authentication required',
                'message': 'Connexion FranceConnect requise'
            }
        
        return {
            'revenu_fiscal_reference': None,
            'nombre_parts_fiscales': None,
            'situation_familiale': None,
            'adresse_fiscale': None,
            'message': 'API à configurer avec habilitation DGFiP',
            'documentation': 'https://www.data.gouv.fr/dataservices/api-impot-particulier/'
        }
    
    def _check_authentication(self) -> bool:
        """Check if user is authenticated via FranceConnect"""
        # Check session for FranceConnect authentication
        return session.get('franceconnect_authenticated', False)
    
    @staticmethod
    def get_authentication_url() -> str:
        """Get FranceConnect authentication URL"""
        # This would redirect to FranceConnect
        return '/auth/franceconnect'


class ImpotParticulierService:
    """
    Service layer for tax data integration
    Handles data transformation and validation
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.api = ImpotParticulierAPI()
    
    def sync_tax_data(self) -> Dict[str, Any]:
        """
        Sync tax data from DGFiP API
        """
        fiscal_data = self.api.get_fiscal_situation()
        
        if 'error' in fiscal_data:
            return fiscal_data
        
        # Transform and store data
        # In production, this would update user's global data
        return {
            'success': True,
            'data': fiscal_data,
            'message': 'Données fiscales synchronisées'
        }
    
    def estimate_tax_liability(self, annual_income: float, situation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate tax liability based on income and situation
        Uses OpenFisca for calculations (see openfisca.py)
        """
        from .openfisca import OpenFiscaService
        
        openfisca = OpenFiscaService()
        return openfisca.calculate_impot_revenu(annual_income, situation)

