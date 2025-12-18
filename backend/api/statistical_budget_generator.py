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
    
    # Mapping des nouvelles CSP vers les catégories de base pour les statistiques
    CSP_MAPPING = {
        # Agriculteurs
        'agriculteur_exploitant': 'agriculteur',
        'agriculteur_salarie': 'agriculteur',
        'agriculteur': 'agriculteur',  # Ancienne valeur pour compatibilité
        
        # Artisans, commerçants, chefs d'entreprise
        'artisan': 'artisan',
        'commercant': 'commercant',
        'chef_entreprise_10': 'chef_entreprise',
        'chef_entreprise_moins_10': 'chef_entreprise',
        'chef_entreprise': 'chef_entreprise',  # Ancienne valeur pour compatibilité
        
        # Cadres et professions intellectuelles supérieures
        'profession_liberale': 'profession_liberale',
        'cadre_entreprise': 'cadre',
        'cadre_fonction_publique': 'cadre',
        'professeur_enseignant': 'cadre',
        'ingenieur': 'cadre',
        'medecin': 'profession_liberale',
        'pharmacien': 'profession_liberale',
        'avocat': 'profession_liberale',
        'architecte': 'profession_liberale',
        'veterinaire': 'profession_liberale',
        'cadre_commercial': 'cadre',
        'cadre_technique': 'cadre',
        'cadre_administratif': 'cadre',
        'directeur_general': 'cadre_sup',
        'directeur_service': 'cadre_sup',
        'chercheur': 'cadre',
        'journaliste': 'cadre',
        'artiste': 'cadre',
        'cadre_sup': 'cadre_sup',  # Ancienne valeur pour compatibilité
        'cadre': 'cadre',  # Ancienne valeur pour compatibilité
        
        # Professions intermédiaires
        'prof_intermediaire_admin': 'prof_intermediaire',
        'prof_intermediaire_commerciale': 'prof_intermediaire',
        'technicien': 'prof_intermediaire',
        'contremaitre': 'prof_intermediaire',
        'infirmier': 'prof_intermediaire',
        'prof_paramedical': 'prof_intermediaire',
        'instituteur': 'prof_intermediaire',
        'prof_intermediaire_sante': 'prof_intermediaire',
        'prof_intermediaire_social': 'prof_intermediaire',
        'policier_gendarme': 'prof_intermediaire',
        'pompier': 'prof_intermediaire',
        'agent_maitrise': 'prof_intermediaire',
        'prof_intermediaire': 'prof_intermediaire',  # Ancienne valeur pour compatibilité
        
        # Employés
        'employe_admin_entreprise': 'employe',
        'employe_admin_fonction_publique': 'employe',
        'employe_commercial': 'employe',
        'caissier': 'employe',
        'vendeur': 'employe',
        'employe_service_direct': 'employe',
        'aide_menagere': 'employe',
        'assistant_maternel': 'employe',
        'employe_hotel_restaurant': 'employe',
        'coiffeur_esthetiste': 'employe',
        'employe_securite': 'employe',
        'ouvrier_qualifie': 'ouvrier',
        'employe': 'employe',  # Ancienne valeur pour compatibilité
        
        # Ouvriers
        'ouvrier_qualifie_industrie': 'ouvrier',
        'ouvrier_qualifie_batiment': 'ouvrier',
        'ouvrier_qualifie_artisanat': 'ouvrier',
        'chauffeur': 'ouvrier',
        'ouvrier_non_qualifie_industrie': 'ouvrier',
        'ouvrier_non_qualifie_batiment': 'ouvrier',
        'ouvrier_non_qualifie_artisanat': 'ouvrier',
        'ouvrier_agricole': 'ouvrier',
        'manoeuvre': 'ouvrier',
        'ouvrier': 'ouvrier',  # Ancienne valeur pour compatibilité
        
        # Retraités
        'retraite_agriculteur': 'retraite',
        'retraite_artisan_commercant': 'retraite',
        'retraite_cadre': 'retraite',
        'retraite_prof_intermediaire': 'retraite',
        'retraite_employe': 'retraite',
        'retraite_ouvrier': 'retraite',
        'retraite': 'retraite',  # Ancienne valeur pour compatibilité
        
        # Autres personnes sans activité professionnelle
        'chomeur': 'chomeur',
        'chomeur_ancien_travailleur': 'chomeur',
        'etudiant': 'etudiant',
        'lyceen': 'etudiant',
        'apprenti': 'etudiant',
        'militaire_du_contingent': 'autre',
        'femme_au_foyer': 'autre',
        'autre_inactif': 'autre',
        'autre': 'autre',
    }
    
    # Average income by CSP (Catégorie Socio-Professionnelle) - Net monthly income
    # Utilise les catégories de base pour les statistiques
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
    
    def _normalize_csp(self, csp: str) -> str:
        """Normalise une CSP vers une catégorie de base pour les statistiques"""
        return self.CSP_MAPPING.get(csp, 'autre')
    
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
        # Normaliser la CSP vers une catégorie de base pour les statistiques
        normalized_csp = self._normalize_csp(csp)
        
        # Estimate monthly income if not provided
        if not profile.get('monthly_income'):
            base_income = self.CSP_INCOMES.get(normalized_csp, 2000)
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
        
        # Ne PAS générer de dépenses variables automatiquement
        # L'utilisateur doit les ajouter manuellement
        expenses = []
        
        # Ne PAS générer d'abonnements automatiquement
        # L'utilisateur doit les ajouter manuellement
        subscriptions = []
        
        # Ne PAS générer de dépenses fixes annuelles automatiquement
        # L'utilisateur doit les ajouter manuellement
        fixed_expenses = []
        
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
            normalized_csp = self._normalize_csp(csp)
            if normalized_csp == 'etudiant' and cat_name == 'Logement':
                target *= 1.2  # Students spend more on housing
            elif normalized_csp == 'retraite' and cat_name == 'Santé':
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
        normalized_csp = self._normalize_csp(csp)
        if normalized_csp == 'cadre' or normalized_csp == 'cadre_sup':
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

