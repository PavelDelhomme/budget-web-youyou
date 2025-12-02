"""
Statistical Budget Generator
Generates initial budgets based on government statistics and socio-professional categories
"""
from typing import Dict, Any, List, Optional
import random
from datetime import datetime, timedelta


class StatisticalBudgetGenerator:
    """
    Generates budget proposals based on socio-professional statistics
    Uses INSEE and government data for realistic budget suggestions
    """
    
    # Average income by CSP (Catégorie Socio-Professionnelle) - Net monthly income
    CSP_INCOMES = {
        'agriculteur': 2200,
        'artisan': 2500,
        'commercant': 2700,
        'chef_entreprise': 4500,
        'profession_liberale': 4500,
        'cadre_sup': 5000,
        'cadre': 3800,
        'prof_intermediaire': 2800,
        'employe': 1900,
        'ouvrier': 2100,
        'retraite': 1800,
        'chomeur': 1200,
        'etudiant': 600,
        'autre': 2000,
    }
    
    # Average expense distribution by CSP (percentage of income)
    CSP_EXPENSE_DISTRIBUTION = {
        'logement': 0.30,  # 30% for housing
        'transport': 0.12,  # 12% for transport
        'alimentation': 0.18,  # 18% for food
        'sante': 0.05,  # 5% for health
        'loisirs': 0.08,  # 8% for leisure
        'telecom': 0.03,  # 3% for telecom
        'autres': 0.24,  # 24% for others
    }
    
    # Typical categories and their percentage of total expenses
    CATEGORY_DISTRIBUTION = {
        'Alimentation': 0.18,
        'Transport': 0.12,
        'Logement': 0.30,
        'Santé': 0.05,
        'Loisirs': 0.08,
        'Télécommunications': 0.03,
        'Assurance': 0.05,
        'Habillement': 0.04,
        'Divers': 0.15,
    }
    
    def generate_budget_from_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a complete budget proposal from user profile
        
        Args:
            profile: User profile with CSP, situation, etc.
                {
                    'csp': str,
                    'monthly_income': Optional[float],
                    'situation_familiale': str,
                    'nombre_enfants': int,
                    'zone_geographique': str,
                    'age': int,
                    ...
                }
        
        Returns:
            Complete budget structure with categories, expenses, etc.
        """
        csp = profile.get('csp', 'autre')
        
        # Estimate monthly income if not provided
        if not profile.get('monthly_income'):
            base_income = self.CSP_INCOMES.get(csp, 2000)
            # Adjust for family situation
            situation = profile.get('situation_familiale', 'celibataire')
            if situation == 'couple':
                base_income *= 1.5
            elif situation == 'parent_solo':
                base_income *= 1.2
            
            # Adjust for geographic zone
            zone = profile.get('zone_geographique', 'moyenne')
            if zone == 'paris':
                base_income *= 1.3
            elif zone == 'rurale':
                base_income *= 0.85
            
            monthly_income = round(base_income, 2)
        else:
            monthly_income = profile.get('monthly_income', 2000)
        
        annual_income = monthly_income * 12
        
        # Generate categories with targets
        categories = self._generate_categories(annual_income, profile)
        
        # Generate typical expenses
        expenses = self._generate_typical_expenses(annual_income, profile)
        
        # Generate subscriptions
        subscriptions = self._generate_subscriptions(profile)
        
        # Generate fixed annual expenses
        fixed_expenses = self._generate_fixed_expenses(profile)
        
        return {
            'monthlySalary': monthly_income,
            'categories': categories,
            'expenses': expenses,
            'subs': subscriptions,
            'annualFixedExpenses': fixed_expenses,
            'estimated_annual_savings': annual_income - sum(cat.get('target', 0) for cat in categories) - sum(sub.get('monthly', 0) * 12 for sub in subscriptions) - sum(f.get('amount', 0) for f in fixed_expenses),
            'source': 'statistical_estimation',
            'confidence': self._calculate_confidence(profile),
        }
    
    def _generate_categories(self, annual_income: float, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate category budgets based on typical distribution"""
        categories = []
        category_id = 0
        
        total_expenses = annual_income * 0.85  # Assume 85% of income goes to expenses
        
        for cat_name, percentage in self.CATEGORY_DISTRIBUTION.items():
            category_id += 1
            target = round(total_expenses * percentage, 2)
            
            # Adjust for specific CSP needs
            csp = profile.get('csp', 'autre')
            if csp == 'etudiant' and cat_name == 'Logement':
                target *= 1.2  # Students spend more on housing
            elif csp == 'retraite' and cat_name == 'Santé':
                target *= 1.5  # Retirees spend more on health
            
            categories.append({
                'id': f'cat_{category_id}',
                'name': cat_name,
                'target': target,
                'monthlyTargets': [round(target / 12, 2)] * 12,
            })
        
        return categories
    
    def _generate_typical_expenses(self, annual_income: float, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate typical expenses for the year"""
        expenses = []
        current_year = datetime.now().year
        
        # Generate a few typical expenses based on income
        num_expenses = min(max(int(annual_income / 5000), 5), 20)
        
        categories_list = list(self.CATEGORY_DISTRIBUTION.keys())
        
        for i in range(num_expenses):
            month = random.randint(1, 12)
            category_id = f'cat_{random.randint(1, len(categories_list))}'
            # Typical expense amount: between 10 and 5% of monthly income
            amount = round((annual_income / 12) * random.uniform(0.01, 0.05), 2)
            
            expenses.append({
                'id': f'exp_{i+1}',
                'categoryId': category_id,
                'amount': amount,
                'date': f'{current_year}-{month:02d}-{random.randint(1, 28):02d}',
                'description': f'Dépense typique {categories_list[i % len(categories_list)]}',
            })
        
        return expenses
    
    def _generate_subscriptions(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate typical subscriptions"""
        subscriptions = []
        
        # Common subscriptions
        common_subs = [
            {'name': 'Internet/Fibre', 'monthly': 30},
            {'name': 'Téléphone mobile', 'monthly': 20},
            {'name': 'Abonnement streaming', 'monthly': 10},
            {'name': 'Assurance habitation', 'monthly': 50},
        ]
        
        csp = profile.get('csp', 'autre')
        if csp == 'cadre' or csp == 'cadre_sup':
            common_subs.append({'name': 'Transport (Navigo)', 'monthly': 75})
        
        for sub in common_subs[:3]:  # Take first 3 common ones
            subscriptions.append({
                'id': f'sub_{len(subscriptions) + 1}',
                'name': sub['name'],
                'monthly': sub['monthly'],
            })
        
        return subscriptions
    
    def _generate_fixed_expenses(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annual fixed expenses"""
        fixed_expenses = []
        
        # Common annual expenses
        common_fixed = [
            {'name': 'Assurance voiture', 'amount': 600},
            {'name': 'Impôts locaux', 'amount': 800},
        ]
        
        for fixed in common_fixed:
            fixed_expenses.append({
                'id': f'fixed_{len(fixed_expenses) + 1}',
                'name': fixed['name'],
                'amount': fixed['amount'],
            })
        
        return fixed_expenses
    
    def _calculate_confidence(self, profile: Dict[str, Any]) -> float:
        """Calculate confidence level for the budget estimation"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence if we have more information
        if profile.get('monthly_income'):
            confidence += 0.2
        if profile.get('csp'):
            confidence += 0.15
        if profile.get('situation_familiale'):
            confidence += 0.1
        if profile.get('zone_geographique'):
            confidence += 0.05
        
        return min(confidence, 1.0)


# Statistical data for training ML model
class StatisticalTrainingDataGenerator:
    """
    Generates statistical training data for initial ML model training
    Based on INSEE and government statistics
    """
    
    def generate_training_years(self, num_years: int = 5) -> List[Dict[str, Any]]:
        """
        Generate synthetic training data based on statistical patterns
        
        Returns:
            List of year data dictionaries suitable for ML training
        """
        years_data = []
        base_year = datetime.now().year - num_years
        
        # Generate data for different CSP profiles
        csps = ['cadre', 'employe', 'ouvrier', 'retraite', 'etudiant']
        
        for year_offset in range(num_years):
            year = base_year + year_offset
            
            for csp in csps:
                profile = {
                    'csp': csp,
                    'situation_familiale': random.choice(['celibataire', 'couple']),
                    'nombre_enfants': random.randint(0, 2),
                }
                
                generator = StatisticalBudgetGenerator()
                budget = generator.generate_budget_from_profile(profile)
                
                # Add some variation over years (inflation, career progression)
                inflation_factor = 1.02 ** year_offset  # 2% annual inflation
                
                year_data = {
                    'year': year,
                    'data': {
                        'monthlySalary': round(budget['monthlySalary'] * inflation_factor, 2),
                        'categories': budget['categories'],
                        'expenses': budget['expenses'],
                        'subs': budget['subs'],
                        'annualFixedExpenses': budget['annualFixedExpenses'],
                        'csp': csp,
                    }
                }
                
                years_data.append(year_data)
        
        return years_data

