"""
API Mon entreprise (URSSAF) integration
Documentation: https://www.data.gouv.fr/dataservices/api-mon-entreprise/
Simulator for estimating income, social contributions, and taxes
"""
import os
import requests
from typing import Dict, Any, Optional


class MonEntrepriseAPI:
    """
    Client for URSSAF Mon entreprise API
    Simulates income calculations for different business types
    """
    
    def __init__(self):
        self.base_url = os.environ.get('MON_ENTREPRISE_API_URL', 'https://mon-entreprise.urssaf.fr/api/v1')
        self.requires_authentication = False  # Public API
    
    def simulate_salary(self, gross_salary: float) -> Dict[str, Any]:
        """
        Simulate salary calculations (net, social contributions, taxes)
        
        Args:
            gross_salary: Gross monthly salary
            
        Returns:
            Calculation results
        """
        try:
            # In production, call the actual API
            # For now, use basic calculation
            return self._calculate_salary_estimation(gross_salary)
        except Exception as e:
            return {
                'error': str(e),
                'message': 'Erreur lors du calcul'
            }
    
    def simulate_auto_entrepreneur(
        self, 
        turnover: float, 
        activity_type: str = 'service'
    ) -> Dict[str, Any]:
        """
        Simulate auto-entrepreneur income
        
        Args:
            turnover: Monthly turnover
            activity_type: 'service', 'commercial', or 'artisanal'
            
        Returns:
            Calculation results
        """
        rates = {
            'service': 0.22,  # 22% for services
            'commercial': 0.125,  # 12.5% for commercial
            'artisanal': 0.17  # 17% for artisanal
        }
        
        rate = rates.get(activity_type, 0.22)
        social_contributions = turnover * rate
        net_income = turnover - social_contributions
        
        return {
            'turnover': turnover,
            'activity_type': activity_type,
            'social_contributions_rate': rate * 100,
            'social_contributions': round(social_contributions, 2),
            'net_income': round(net_income, 2),
            'annual_turnover': round(turnover * 12, 2),
            'note': 'Calcul approximatif. Utilisez l\'API officielle pour des calculs précis.'
        }
    
    def simulate_entreprise_individual(
        self, 
        revenue: float, 
        charges: float = 0
    ) -> Dict[str, Any]:
        """
        Simulate individual business income
        """
        # Simplified calculation
        net_revenue = revenue - charges
        # Social contributions estimation
        social_rate = 0.45  # Approximate rate
        social_contributions = net_revenue * social_rate
        taxable_income = net_revenue - social_contributions
        
        return {
            'revenue': revenue,
            'charges': charges,
            'net_revenue': round(net_revenue, 2),
            'social_contributions_rate': social_rate * 100,
            'social_contributions': round(social_contributions, 2),
            'taxable_income': round(taxable_income, 2),
            'note': 'Calcul approximatif'
        }
    
    def _calculate_salary_estimation(self, gross_salary: float) -> Dict[str, Any]:
        """Basic salary calculation (simplified)"""
        # Approximate rates in France
        social_security_rate = 0.23  # Employee share
        unemployment_rate = 0.0025
        retirement_rate = 0.00405
        
        social_deductions = gross_salary * (social_security_rate + unemployment_rate + retirement_rate)
        taxable_salary = gross_salary - social_deductions
        
        # Tax estimation (simplified, would use real tax brackets)
        annual_taxable = taxable_salary * 12
        estimated_tax = self._estimate_income_tax(annual_taxable)
        monthly_tax = estimated_tax / 12
        
        net_salary = taxable_salary - monthly_tax
        
        return {
            'gross_salary': round(gross_salary, 2),
            'social_contributions': round(social_deductions, 2),
            'taxable_salary': round(taxable_salary, 2),
            'estimated_monthly_tax': round(monthly_tax, 2),
            'estimated_annual_tax': round(estimated_tax, 2),
            'net_salary': round(net_salary, 2),
            'note': 'Calcul approximatif. Utilisez l\'API officielle pour des calculs précis.',
            'api_url': 'https://mon-entreprise.urssaf.fr'
        }
    
    def _estimate_income_tax(self, annual_taxable: float) -> float:
        """Simple income tax estimation"""
        # 2024 tax brackets (simplified)
        if annual_taxable <= 11294:
            return 0
        elif annual_taxable <= 28797:
            return (annual_taxable - 11294) * 0.11
        elif annual_taxable <= 82341:
            return (28797 - 11294) * 0.11 + (annual_taxable - 28797) * 0.30
        elif annual_taxable <= 177106:
            return (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (annual_taxable - 82341) * 0.41
        else:
            return (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (annual_taxable - 177106) * 0.45

