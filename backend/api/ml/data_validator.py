"""
Data validation and collection system for ML training
Identifies missing, incomplete, or erroneous data
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import re


class DataValidator:
    """
    Validates budget data for ML training
    Identifies errors, missing data, and inconsistencies
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
    
    def validate_year_data(self, year: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data for a specific year
        
        Returns:
            {
                'is_valid': bool,
                'errors': List[str],
                'warnings': List[str],
                'completeness_score': float (0-1),
                'recommendations': List[str]
            }
        """
        errors = []
        warnings = []
        recommendations = []
        
        # Check required fields
        categories = data.get('categories', [])
        expenses = data.get('expenses', [])
        subs = data.get('subs', [])
        monthly_salary = data.get('monthlySalary', 0)
        
        # Validate categories
        if not categories or len(categories) == 0:
            errors.append('Aucune catégorie de dépenses définie')
        else:
            for i, cat in enumerate(categories):
                if not cat.get('id'):
                    errors.append(f'Catégorie #{i+1} : ID manquant')
                if not cat.get('name'):
                    errors.append(f'Catégorie #{i+1} : Nom manquant')
                if cat.get('target', 0) < 0:
                    errors.append(f'Catégorie "{cat.get("name", "?")}" : Budget négatif')
        
        # Validate expenses
        invalid_expenses = []
        for i, exp in enumerate(expenses):
            if not exp.get('categoryId'):
                invalid_expenses.append(f'Dépense #{i+1} : Catégorie manquante')
            if not exp.get('date'):
                invalid_expenses.append(f'Dépense #{i+1} : Date manquante')
            elif not self._validate_date(exp.get('date')):
                invalid_expenses.append(f'Dépense #{i+1} : Date invalide')
            if exp.get('amount', 0) <= 0:
                invalid_expenses.append(f'Dépense #{i+1} : Montant invalide')
        
        if invalid_expenses:
            warnings.extend(invalid_expenses)
        
        # Validate subscriptions
        for i, sub in enumerate(subs):
            if not sub.get('name'):
                warnings.append(f'Abonnement #{i+1} : Nom manquant')
            if sub.get('monthly', 0) <= 0:
                warnings.append(f'Abonnement "{sub.get("name", "?")}" : Montant mensuel invalide')
        
        # Validate salary
        if monthly_salary <= 0:
            warnings.append('Salaire mensuel non défini ou nul')
        
        # Calculate completeness score
        completeness = self._calculate_completeness(data)
        
        # Generate recommendations
        if completeness < 0.5:
            recommendations.append('Données très incomplètes. Ajoutez plus d\'informations pour de meilleures prédictions.')
        elif completeness < 0.7:
            recommendations.append('Données partiellement complètes. Complétez les informations manquantes.')
        
        if len(expenses) < 10:
            recommendations.append(f'Peu de dépenses enregistrées ({len(expenses)}). Ajoutez plus de données pour améliorer les prédictions.')
        
        if monthly_salary <= 0:
            recommendations.append('Définissez votre salaire mensuel pour des prédictions précises.')
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'completeness_score': completeness,
            'recommendations': recommendations,
            'year': year
        }
    
    def validate_all_historical_data(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate all historical data for ML training
        
        Returns:
            Summary of validation results
        """
        results = []
        total_errors = 0
        total_warnings = 0
        avg_completeness = 0
        
        for year_data in historical_data:
            year = year_data.get('year')
            data = year_data.get('data', {})
            
            validation = self.validate_year_data(year, data)
            results.append(validation)
            
            total_errors += len(validation['errors'])
            total_warnings += len(validation['warnings'])
            avg_completeness += validation['completeness_score']
        
        avg_completeness = avg_completeness / len(results) if results else 0
        
        # Determine if ready for training
        min_years = 2
        valid_years = [r for r in results if r['is_valid']]
        
        is_ready = len(valid_years) >= min_years and avg_completeness >= 0.5
        
        return {
            'is_ready_for_training': is_ready,
            'years_validated': len(results),
            'valid_years': len(valid_years),
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'average_completeness': round(avg_completeness, 2),
            'year_results': results,
            'min_years_required': min_years,
            'recommendations': self._generate_training_recommendations(results, avg_completeness)
        }
    
    def _validate_date(self, date_str: str) -> bool:
        """Validate date string format"""
        try:
            datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return True
        except:
            return False
    
    def _calculate_completeness(self, data: Dict[str, Any]) -> float:
        """Calculate data completeness score (0-1)"""
        score = 0.0
        max_score = 0.0
        
        # Categories (30%)
        max_score += 30
        if data.get('categories') and len(data['categories']) > 0:
            score += 30
        
        # Expenses (25%)
        max_score += 25
        expenses = data.get('expenses', [])
        if expenses:
            # Bonus if many expenses
            expense_score = min(25, len(expenses) * 2)
            score += expense_score
        
        # Salary (20%)
        max_score += 20
        if data.get('monthlySalary', 0) > 0:
            score += 20
        
        # Subscriptions (15%)
        max_score += 15
        if data.get('subs') and len(data['subs']) > 0:
            score += 15
        
        # Fixed expenses (10%)
        max_score += 10
        if data.get('annualFixedExpenses') and len(data['annualFixedExpenses']) > 0:
            score += 10
        
        return score / max_score if max_score > 0 else 0
    
    def _generate_training_recommendations(
        self, 
        results: List[Dict[str, Any]], 
        avg_completeness: float
    ) -> List[str]:
        """Generate recommendations for improving data quality"""
        recommendations = []
        
        if len(results) < 2:
            recommendations.append('Minimum 2 années de données nécessaires pour l\'entraînement')
        
        invalid_years = [r for r in results if not r['is_valid']]
        if invalid_years:
            years = [r['year'] for r in invalid_years]
            recommendations.append(f'Corrigez les erreurs dans les années: {", ".join(map(str, years))}')
        
        if avg_completeness < 0.7:
            recommendations.append('Améliorez la complétude des données (actuellement {:.0f}%)'.format(avg_completeness * 100))
        
        low_completeness = [r for r in results if r['completeness_score'] < 0.5]
        if low_completeness:
            years = [r['year'] for r in low_completeness]
            recommendations.append(f'Années avec faible complétude: {", ".join(map(str, years))}')
        
        return recommendations

