"""
OpenFisca integration for French socio-fiscal calculations
Documentation: https://www.data.gouv.fr/dataservices/openfisca/
Calculates taxes, social contributions, and benefits
"""
import os
import requests
from typing import Dict, Any, Optional, List


class OpenFiscaService:
    """
    Service for OpenFisca calculations
    Provides comprehensive tax and benefit calculations
    """
    
    def __init__(self):
        self.base_url = os.environ.get('OPENFISCA_URL', 'https://api.openfisca.fr/api/2')
        self.country = 'france'
    
    def calculate_impot_revenu(
        self, 
        annual_income: float,
        situation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate income tax (impôt sur le revenu)
        
        Args:
            annual_income: Annual taxable income
            situation: Family situation (parts, children, etc.)
            
        Returns:
            Tax calculation results
        """
        # Build OpenFisca scenario
        scenario = {
            'period': f'{situation.get("year", 2024)}',
            'persons': {
                'personne_principale': {
                    'salaire_imposable': {
                        f'{situation.get("year", 2024)}': annual_income
                    }
                }
            },
            'foyers_fiscaux': {
                'foyer_fiscal_principal': {
                    'declarants': ['personne_principale'],
                    'personnes_a_charge': []
                }
            }
        }
        
        try:
            # Call OpenFisca API
            response = requests.post(
                f'{self.base_url}/calculate',
                json={'scenario': scenario}
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_openfisca_response(data)
            else:
                # Fallback to simplified calculation
                return self._simplified_tax_calculation(annual_income, situation)
                
        except Exception as e:
            # Fallback to simplified calculation
            return self._simplified_tax_calculation(annual_income, situation)
    
    def calculate_all_benefits(
        self,
        situation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate all eligible benefits and taxes
        """
        # This would call OpenFisca with full situation
        return {
            'impot_revenu': self.calculate_impot_revenu(
                situation.get('annual_income', 0),
                situation
            ),
            'social_contributions': {},
            'benefits': {},
            'note': 'Calcul complet via OpenFisca (à implémenter avec API complète)'
        }
    
    def _parse_openfisca_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse OpenFisca API response"""
        # Extract relevant values from OpenFisca response
        return {
            'impot_revenu': data.get('impot_revenu', {}).get('value', 0),
            'revenu_fiscal_reference': data.get('revenu_fiscal_reference', {}).get('value', 0),
            'source': 'openfisca'
        }
    
    def _simplified_tax_calculation(
        self, 
        annual_income: float,
        situation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simplified tax calculation as fallback"""
        # Use tax brackets
        parts = situation.get('parts', 1)
        income_per_part = annual_income / parts
        
        # Simplified brackets
        tax = 0
        if income_per_part > 11294:
            if income_per_part <= 28797:
                tax = (income_per_part - 11294) * 0.11
            elif income_per_part <= 82341:
                tax = (28797 - 11294) * 0.11 + (income_per_part - 28797) * 0.30
            elif income_per_part <= 177106:
                tax = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (income_per_part - 82341) * 0.41
            else:
                tax = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (income_per_part - 177106) * 0.45
        
        total_tax = tax * parts
        
        return {
            'impot_revenu': round(total_tax, 2),
            'revenu_fiscal_reference': round(annual_income, 2),
            'parts': parts,
            'income_per_part': round(income_per_part, 2),
            'source': 'simplified',
            'note': 'Calcul simplifié. Utilisez OpenFisca pour un calcul précis.'
        }

