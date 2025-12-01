"""
Feature engineering for budget prediction models
Extract meaningful features from historical budget data
"""
from typing import List, Dict, Any
from datetime import datetime
import numpy as np


def extract_features(historical_data: List[Dict[str, Any]]) -> np.ndarray:
    """
    Extract features from historical budget data for ML model
    
    Features extracted:
    1. Année (normalisée)
    2. Total dépenses annuelles
    3. Revenus annuels (salaire * 12)
    4. Nombre de catégories
    5. Nombre d'abonnements
    6. Dépenses fixes annuelles
    7. Épargne initiale
    8. Nombre de dépenses
    9. Variance des dépenses par catégorie
    10. Tendance des dépenses (augmentation/diminution)
    11. Ratio épargne/revenus
    12. Dépenses par mois moyen
    """
    if not historical_data:
        return np.array([])
    
    features_list = []
    
    for i, year_data in enumerate(historical_data):
        year = year_data.get('year', 2020)
        data = year_data.get('data', {})
        
        # Feature 1: Année normalisée (pour la tendance temporelle)
        normalized_year = (year - 2020) / 10.0  # Normaliser autour de 2020
        
        # Feature 2: Total dépenses annuelles
        categories = data.get('categories', [])
        expenses = data.get('expenses', [])
        subs = data.get('subs', [])
        annual_fixed = data.get('annualFixedExpenses', [])
        
        # Calculer dépenses variables
        variable_expenses = sum(
            cat.get('target', 0) for cat in categories
        )
        
        # Calculer dépenses abonnements
        subs_expenses = sum(
            sub.get('monthly', 0) * 12 for sub in subs
        )
        
        # Calculer dépenses fixes annuelles
        fixed_expenses = sum(
            exp.get('amount', 0) for exp in annual_fixed
        )
        
        total_expenses = variable_expenses + subs_expenses + fixed_expenses
        
        # Feature 3: Revenus annuels
        monthly_salary = data.get('monthlySalary', 0)
        annual_income = monthly_salary * 12
        
        # Feature 4: Nombre de catégories
        num_categories = len(categories)
        
        # Feature 5: Nombre d'abonnements
        num_subs = len(subs)
        
        # Feature 6: Dépenses fixes annuelles
        annual_fixed_expenses = fixed_expenses
        
        # Feature 7: Épargne initiale
        current_savings = data.get('currentSavings', 0)
        
        # Feature 8: Nombre de dépenses
        num_expenses = len(expenses)
        
        # Feature 9: Variance des dépenses par catégorie
        category_targets = [cat.get('target', 0) for cat in categories]
        category_variance = np.var(category_targets) if category_targets else 0
        
        # Feature 10: Tendance des dépenses (comparaison avec année précédente)
        if i > 0:
            prev_expenses = features_list[-1][1]  # Total dépenses année précédente
            spending_trend = (total_expenses - prev_expenses) / max(prev_expenses, 1) * 100
        else:
            spending_trend = 0
        
        # Feature 11: Ratio épargne/revenus
        savings_ratio = (current_savings / max(annual_income, 1)) * 100 if annual_income > 0 else 0
        
        # Feature 12: Dépenses par mois moyen
        avg_monthly_expenses = total_expenses / 12 if total_expenses > 0 else 0
        
        # Feature 13: Total dépenses réelles (somme des dépenses enregistrées)
        actual_expenses = sum(
            exp.get('amount', 0) for exp in expenses
        )
        
        # Feature 14: Différence budget réel vs dépenses réelles
        budget_vs_actual = total_expenses - actual_expenses if actual_expenses > 0 else 0
        
        # Feature 15: Diversité des dépenses (nombre de catégories utilisées)
        used_categories = len(set(
            exp.get('categoryId', '') for exp in expenses
        ))
        
        # Assembler toutes les features
        features = np.array([
            normalized_year,
            total_expenses,
            annual_income,
            num_categories,
            num_subs,
            annual_fixed_expenses,
            current_savings,
            num_expenses,
            category_variance,
            spending_trend,
            savings_ratio,
            avg_monthly_expenses,
            actual_expenses,
            budget_vs_actual,
            used_categories,
        ])
        
        features_list.append(features)
    
    return np.array(features_list)


def extract_target_variables(historical_data: List[Dict[str, Any]]) -> Dict[str, np.ndarray]:
    """
    Extract target variables (what we want to predict) from historical data
    
    Targets:
    - total_expenses: Total dépenses annuelles
    - annual_income: Revenus annuels
    - savings: Épargne finale
    """
    targets = {
        'total_expenses': [],
        'annual_income': [],
        'savings': [],
    }
    
    for year_data in historical_data:
        data = year_data.get('data', {})
        
        # Calculer total dépenses
        categories = data.get('categories', [])
        subs = data.get('subs', [])
        annual_fixed = data.get('annualFixedExpenses', [])
        
        variable_expenses = sum(cat.get('target', 0) for cat in categories)
        subs_expenses = sum(sub.get('monthly', 0) * 12 for sub in subs)
        fixed_expenses = sum(exp.get('amount', 0) for exp in annual_fixed)
        total_expenses = variable_expenses + subs_expenses + fixed_expenses
        
        # Revenus annuels
        monthly_salary = data.get('monthlySalary', 0)
        annual_income = monthly_salary * 12
        
        # Épargne finale
        current_savings = data.get('currentSavings', 0)
        savings = current_savings + (annual_income - total_expenses)
        
        targets['total_expenses'].append(total_expenses)
        targets['annual_income'].append(annual_income)
        targets['savings'].append(savings)
    
    return {
        key: np.array(values) 
        for key, values in targets.items()
    }


def extract_category_features(historical_data: List[Dict[str, Any]]) -> Dict[str, np.ndarray]:
    """
    Extract features for category-level predictions
    Returns features for each category in each year
    """
    category_features = {}
    
    for year_data in historical_data:
        year = year_data.get('year', 2020)
        data = year_data.get('data', {})
        
        categories = data.get('categories', [])
        expenses = data.get('expenses', [])
        
        for category in categories:
            cat_id = category.get('id', '')
            if not cat_id:
                continue
            
            if cat_id not in category_features:
                category_features[cat_id] = []
            
            # Features pour cette catégorie
            target = category.get('target', 0)
            
            # Dépenses réelles pour cette catégorie
            actual_spending = sum(
                exp.get('amount', 0) 
                for exp in expenses 
                if exp.get('categoryId') == cat_id
            )
            
            # Différence budget vs réel
            variance = target - actual_spending if target > 0 else 0
            
            category_features[cat_id].append({
                'year': year,
                'target': target,
                'actual': actual_spending,
                'variance': variance,
            })
    
    return category_features

