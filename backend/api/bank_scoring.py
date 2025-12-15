"""
Système de scoring bancaire basé sur les critères bancaires français
Calcule un score de 0 à 1000 basé sur plusieurs indicateurs financiers
"""
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json


class BankScoringService:
    """
    Service de calcul du score bancaire basé sur les critères réels utilisés par les banques françaises
    
    Critères évalués :
    1. Ratio d'endettement (charges/revenus) - max 33% recommandé
    2. Capacité d'épargne (épargne mensuelle/revenus)
    3. Stabilité des revenus
    4. Actifs totaux (comptes + investissements)
    5. Variabilité des dépenses (régularité)
    6. Taux d'épargne global
    """
    
    # Poids des différents critères (total = 1000 points)
    WEIGHTS = {
        'debt_ratio': 300,      # Ratio d'endettement (300 points)
        'savings_capacity': 200, # Capacité d'épargne (200 points)
        'income_stability': 150, # Stabilité des revenus (150 points)
        'assets': 150,           # Actifs totaux (150 points)
        'expense_regularity': 100, # Régularité des dépenses (100 points)
        'savings_rate': 100,     # Taux d'épargne (100 points)
    }
    
    # Seuils bancaires français
    MAX_DEBT_RATIO = 0.33  # 33% maximum recommandé
    IDEAL_DEBT_RATIO = 0.25  # 25% idéal
    MIN_SAVINGS_RATE = 0.10  # 10% minimum recommandé
    IDEAL_SAVINGS_RATE = 0.20  # 20% idéal
    
    def calculate_score(self, user_data: Dict[str, Any], year_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcule le score bancaire complet avec tous les indicateurs
        
        Args:
            user_data: Données globales de l'utilisateur (bankAccounts, investments, etc.)
            year_data: Données de l'année courante (revenus, dépenses, etc.)
        
        Returns:
            Dict avec score, détails, recommandations
        """
        # Calculer les indicateurs
        indicators = self._calculate_indicators(user_data, year_data)
        
        # Calculer le score global (0-1000)
        total_score = sum(indicators['scores'].values())
        total_score = max(0, min(1000, total_score))  # Limiter entre 0 et 1000
        
        # Déterminer le niveau de risque
        risk_level = self._determine_risk_level(total_score)
        
        # Générer des recommandations
        recommendations = self._generate_recommendations(indicators, total_score)
        
        return {
            'score': int(total_score),
            'risk_level': risk_level,
            'indicators': indicators,
            'recommendations': recommendations,
            'calculation_date': datetime.now().isoformat(),
        }
    
    def _calculate_indicators(self, user_data: Dict[str, Any], year_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calcule tous les indicateurs financiers"""
        
        # 1. Ratio d'endettement (charges mensuelles / revenus mensuels)
        debt_ratio_score, debt_ratio = self._calculate_debt_ratio(year_data)
        
        # 2. Capacité d'épargne
        savings_capacity_score, savings_capacity = self._calculate_savings_capacity(year_data)
        
        # 3. Stabilité des revenus
        income_stability_score, income_stability = self._calculate_income_stability(user_data, year_data)
        
        # 4. Actifs totaux
        assets_score, total_assets = self._calculate_assets_score(user_data)
        
        # 5. Régularité des dépenses
        expense_regularity_score, expense_regularity = self._calculate_expense_regularity(year_data)
        
        # 6. Taux d'épargne
        savings_rate_score, savings_rate = self._calculate_savings_rate(year_data)
        
        return {
            'scores': {
                'debt_ratio': debt_ratio_score,
                'savings_capacity': savings_capacity_score,
                'income_stability': income_stability_score,
                'assets': assets_score,
                'expense_regularity': expense_regularity_score,
                'savings_rate': savings_rate_score,
            },
            'values': {
                'debt_ratio': debt_ratio,
                'savings_capacity': savings_capacity,
                'income_stability': income_stability,
                'total_assets': total_assets,
                'expense_regularity': expense_regularity,
                'savings_rate': savings_rate,
            },
        }
    
    def _calculate_debt_ratio(self, year_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Calcule le ratio d'endettement (charges/revenus)
        Score maximal si ratio < 25%, pénalité si > 33%
        """
        # Revenus mensuels
        monthly_salary = float(year_data.get('monthlySalary', 0) or 0)
        
        # Revenus supplémentaires
        additional_incomes = year_data.get('additionalMonthlyIncomes', []) or []
        variable_incomes = year_data.get('variableMonthlyIncomes', []) or []
        monthly_income_sources = year_data.get('monthlyIncomeSources', []) or []
        
        total_monthly_income = monthly_salary
        for inc in additional_incomes:
            if isinstance(inc, dict) and inc.get('amount'):
                total_monthly_income += float(inc.get('amount', 0))
        
        for inc in monthly_income_sources:
            if isinstance(inc, dict):
                amount = inc.get('monthlyAmount') or inc.get('amount') or 0
                total_monthly_income += float(amount)
        
        # Charges mensuelles
        subs = year_data.get('subs', []) or []
        monthly_charges = sum(float(s.get('monthly', 0) or 0) for s in subs)
        
        # Dépenses fixes annuelles divisées par 12
        annual_expenses = year_data.get('annualFixedExpenses', []) or []
        annual_total = sum(float(e.get('amount', 0) or 0) for e in annual_expenses)
        monthly_charges += annual_total / 12
        
        # Calculer le ratio
        if total_monthly_income == 0:
            return 0, 1.0  # Pas de revenus = ratio de 100% = très mauvais
        
        debt_ratio = monthly_charges / total_monthly_income
        
        # Score : 300 points maximum
        if debt_ratio <= self.IDEAL_DEBT_RATIO:
            score = self.WEIGHTS['debt_ratio']  # Parfait
        elif debt_ratio <= self.MAX_DEBT_RATIO:
            # Pénalité progressive entre 25% et 33%
            penalty = ((debt_ratio - self.IDEAL_DEBT_RATIO) / (self.MAX_DEBT_RATIO - self.IDEAL_DEBT_RATIO)) * 100
            score = self.WEIGHTS['debt_ratio'] - penalty
        else:
            # Pénalité importante si > 33%
            excess = (debt_ratio - self.MAX_DEBT_RATIO) / self.MAX_DEBT_RATIO
            penalty = min(200, excess * 150)  # Pénalité max 200 points
            score = max(0, self.WEIGHTS['debt_ratio'] - 100 - penalty)
        
        return max(0, score), debt_ratio
    
    def _calculate_savings_capacity(self, year_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Calcule la capacité d'épargne (revenus - dépenses) / revenus
        Score maximal si capacité > 20%
        """
        # Revenus mensuels (même calcul que pour debt_ratio)
        monthly_salary = float(year_data.get('monthlySalary', 0) or 0)
        additional_incomes = year_data.get('additionalMonthlyIncomes', []) or []
        monthly_income_sources = year_data.get('monthlyIncomeSources', []) or []
        
        total_monthly_income = monthly_salary
        for inc in additional_incomes:
            if isinstance(inc, dict) and inc.get('amount'):
                total_monthly_income += float(inc.get('amount', 0))
        for inc in monthly_income_sources:
            if isinstance(inc, dict):
                amount = inc.get('monthlyAmount') or inc.get('amount') or 0
                total_monthly_income += float(amount)
        
        # Charges mensuelles (même calcul que pour debt_ratio)
        subs = year_data.get('subs', []) or []
        monthly_charges = sum(float(s.get('monthly', 0) or 0) for s in subs)
        annual_expenses = year_data.get('annualFixedExpenses', []) or []
        annual_total = sum(float(e.get('amount', 0) or 0) for e in annual_expenses)
        monthly_charges += annual_total / 12
        
        # Dépenses variables estimées (moyenne mensuelle)
        categories = year_data.get('categories', []) or []
        monthly_variable_targets = 0
        for cat in categories:
            monthly_targets = cat.get('monthlyTargets')
            if monthly_targets and len(monthly_targets) == 12:
                monthly_variable_targets += sum(float(t or 0) for t in monthly_targets) / 12
            else:
                target = float(cat.get('target', 0) or 0)
                monthly_variable_targets += target / 12
        
        total_monthly_expenses = monthly_charges + monthly_variable_targets
        
        # Capacité d'épargne
        if total_monthly_income == 0:
            return 0, 0
        
        savings_capacity = (total_monthly_income - total_monthly_expenses) / total_monthly_income
        
        # Score : 200 points maximum
        if savings_capacity >= self.IDEAL_SAVINGS_RATE:
            score = self.WEIGHTS['savings_capacity']
        elif savings_capacity >= self.MIN_SAVINGS_RATE:
            # Pénalité progressive
            ratio = (savings_capacity - self.MIN_SAVINGS_RATE) / (self.IDEAL_SAVINGS_RATE - self.MIN_SAVINGS_RATE)
            score = 100 + (ratio * 100)
        elif savings_capacity > 0:
            score = (savings_capacity / self.MIN_SAVINGS_RATE) * 100
        else:
            score = 0  # Pas de capacité d'épargne
        
        return max(0, score), savings_capacity
    
    def _calculate_income_stability(self, user_data: Dict[str, Any], year_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Évalue la stabilité des revenus
        Score basé sur : salaire fixe, historique de salaire, revenus récurrents
        """
        score = 0
        stability_factors = []
        
        # 1. Salaire fixe mensuel (base)
        monthly_salary = float(year_data.get('monthlySalary', 0) or 0)
        if monthly_salary > 0:
            score += 50
            stability_factors.append('salaire_fixe')
        
        # 2. Historique de salaire (salaryHistory)
        salary_history = user_data.get('salaryHistory', []) or []
        if len(salary_history) >= 2:
            # Stabilité si pas de changement récent
            score += 50
            stability_factors.append('historique_stable')
        elif len(salary_history) == 1:
            score += 25
            stability_factors.append('historique_limite')
        
        # 3. Revenus récurrents (monthlyIncomeSources avec dates futures)
        monthly_income_sources = year_data.get('monthlyIncomeSources', []) or []
        if monthly_income_sources:
            # Vérifier si les revenus ont des dates de fin lointaines ou pas de fin
            for inc in monthly_income_sources:
                if isinstance(inc, dict):
                    end_date = inc.get('endDate')
                    if not end_date:
                        score += 25
                        stability_factors.append('revenus_permanents')
                    else:
                        # Si fin dans plus de 6 mois, c'est stable
                        try:
                            from datetime import datetime
                            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                            months_remaining = (end.year - datetime.now().year) * 12 + (end.month - datetime.now().month)
                            if months_remaining > 6:
                                score += 15
                        except:
                            pass
        
        # Limiter au maximum
        score = min(self.WEIGHTS['income_stability'], score)
        
        # Score de stabilité (0-1)
        stability_value = score / self.WEIGHTS['income_stability']
        
        return score, stability_value
    
    def _calculate_assets_score(self, user_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Évalue les actifs totaux (comptes bancaires + investissements)
        Score basé sur le montant total
        """
        bank_accounts = user_data.get('bankAccounts', []) or []
        investments = user_data.get('investments', []) or []
        
        total_assets = 0
        total_assets += sum(float(acc.get('currentBalance', 0) or 0) for acc in bank_accounts)
        total_assets += sum(float(inv.get('currentValue', 0) or 0) for inv in investments)
        
        # Score : 150 points maximum
        # Seuils : 0€ = 0pts, 1000€ = 30pts, 5000€ = 75pts, 10000€ = 120pts, 50000€+ = 150pts
        if total_assets >= 50000:
            score = self.WEIGHTS['assets']
        elif total_assets >= 10000:
            score = 120 + ((total_assets - 10000) / 40000) * 30
        elif total_assets >= 5000:
            score = 75 + ((total_assets - 5000) / 5000) * 45
        elif total_assets >= 1000:
            score = 30 + ((total_assets - 1000) / 4000) * 45
        elif total_assets > 0:
            score = (total_assets / 1000) * 30
        else:
            score = 0
        
        return max(0, min(self.WEIGHTS['assets'], score)), total_assets
    
    def _calculate_expense_regularity(self, year_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Évalue la régularité des dépenses (variabilité mensuelle)
        Score basé sur l'écart-type des dépenses mensuelles
        """
        expenses = year_data.get('expenses', []) or []
        
        # Grouper les dépenses par mois
        monthly_expenses = [0.0] * 12
        for exp in expenses:
            try:
                date = datetime.fromisoformat(exp.get('date', '').replace('Z', '+00:00'))
                month = date.month - 1  # 0-11
                amount = float(exp.get('amount', 0) or 0)
                monthly_expenses[month] += amount
            except:
                continue
        
        # Calculer l'écart-type (coefficient de variation)
        if not monthly_expenses or all(e == 0 for e in monthly_expenses):
            return 0, 0  # Pas de dépenses = 0
        
        mean = sum(monthly_expenses) / len([e for e in monthly_expenses if e > 0] or [1])
        if mean == 0:
            return 50, 0.5  # Pas de moyenne, score moyen
        
        variance = sum((e - mean) ** 2 for e in monthly_expenses) / len(monthly_expenses)
        std_dev = variance ** 0.5
        cv = std_dev / mean if mean > 0 else 1.0  # Coefficient de variation
        
        # Score : 100 points maximum
        # CV faible (< 0.3) = régulier = score élevé
        # CV élevé (> 0.8) = irrégulier = score faible
        if cv < 0.3:
            score = self.WEIGHTS['expense_regularity']
        elif cv < 0.5:
            score = 80
        elif cv < 0.8:
            score = 50
        else:
            score = 20
        
        # Score de régularité (inverse du CV)
        regularity_value = max(0, min(1, 1 - cv))
        
        return score, regularity_value
    
    def _calculate_savings_rate(self, year_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Calcule le taux d'épargne (épargne actuelle / revenus annuels)
        Score basé sur le taux d'épargne
        """
        current_savings = float(year_data.get('currentSavings', 0) or 0)
        
        # Revenus annuels (même calcul que pour debt_ratio × 12)
        monthly_salary = float(year_data.get('monthlySalary', 0) or 0)
        additional_incomes = year_data.get('additionalMonthlyIncomes', []) or []
        monthly_income_sources = year_data.get('monthlyIncomeSources', []) or []
        
        total_monthly_income = monthly_salary
        for inc in additional_incomes:
            if isinstance(inc, dict) and inc.get('amount'):
                total_monthly_income += float(inc.get('amount', 0))
        for inc in monthly_income_sources:
            if isinstance(inc, dict):
                amount = inc.get('monthlyAmount') or inc.get('amount') or 0
                total_monthly_income += float(amount)
        
        annual_income = total_monthly_income * 12
        
        if annual_income == 0:
            return 0, 0
        
        savings_rate = current_savings / annual_income if annual_income > 0 else 0
        
        # Score : 100 points maximum
        if savings_rate >= 0.5:  # 50%+ = excellent
            score = self.WEIGHTS['savings_rate']
        elif savings_rate >= 0.3:  # 30%+ = très bon
            score = 80
        elif savings_rate >= 0.2:  # 20%+ = bon
            score = 60
        elif savings_rate >= 0.1:  # 10%+ = acceptable
            score = 40
        elif savings_rate > 0:
            score = (savings_rate / 0.1) * 40
        else:
            score = 0
        
        return max(0, min(self.WEIGHTS['savings_rate'], score)), savings_rate
    
    def _determine_risk_level(self, score: float) -> str:
        """Détermine le niveau de risque basé sur le score"""
        if score >= 800:
            return 'excellent'
        elif score >= 650:
            return 'bon'
        elif score >= 500:
            return 'moyen'
        elif score >= 350:
            return 'faible'
        else:
            return 'tres_faible'
    
    def _generate_recommendations(self, indicators: Dict[str, Any], total_score: float) -> List[Dict[str, str]]:
        """Génère des recommandations basées sur les indicateurs"""
        recommendations = []
        scores = indicators['scores']
        values = indicators['values']
        
        # Ratio d'endettement
        if scores['debt_ratio'] < 200:
            debt_ratio = values['debt_ratio']
            if debt_ratio > self.MAX_DEBT_RATIO:
                recommendations.append({
                    'type': 'warning',
                    'category': 'Endettement',
                    'title': 'Ratio d\'endettement trop élevé',
                    'message': f'Votre ratio d\'endettement est de {debt_ratio*100:.1f}%, ce qui dépasse le seuil recommandé de 33%. Réduisez vos charges ou augmentez vos revenus.',
                })
            elif debt_ratio > self.IDEAL_DEBT_RATIO:
                recommendations.append({
                    'type': 'info',
                    'category': 'Endettement',
                    'title': 'Ratio d\'endettement acceptable',
                    'message': f'Votre ratio d\'endettement est de {debt_ratio*100:.1f}%. L\'idéal serait de le réduire sous 25%.',
                })
        
        # Capacité d'épargne
        if scores['savings_capacity'] < 150:
            savings_capacity = values['savings_capacity']
            if savings_capacity < 0:
                recommendations.append({
                    'type': 'error',
                    'category': 'Épargne',
                    'title': 'Dépenses supérieures aux revenus',
                    'message': 'Vos dépenses dépassent vos revenus. Réduisez vos dépenses ou trouvez des sources de revenus supplémentaires.',
                })
            elif savings_capacity < self.MIN_SAVINGS_RATE:
                recommendations.append({
                    'type': 'warning',
                    'category': 'Épargne',
                    'title': 'Capacité d\'épargne faible',
                    'message': f'Votre capacité d\'épargne est de {savings_capacity*100:.1f}%. Essayez d\'atteindre au moins 10% de vos revenus.',
                })
        
        # Actifs
        if scores['assets'] < 75:
            total_assets = values['total_assets']
            recommendations.append({
                'type': 'info',
                'category': 'Actifs',
                'title': 'Accumuler plus d\'actifs',
                'message': f'Vos actifs actuels sont de {total_assets:,.0f}€. Construire une réserve d\'urgence (3-6 mois de revenus) améliorerait votre score.',
            })
        
        # Stabilité des revenus
        if scores['income_stability'] < 100:
            recommendations.append({
                'type': 'info',
                'category': 'Revenus',
                'title': 'Stabilité des revenus',
                'message': 'Avoir des revenus fixes et réguliers améliore votre profil bancaire.',
            })
        
        # Score global
        if total_score >= 800:
            recommendations.append({
                'type': 'success',
                'category': 'Score',
                'title': 'Excellent profil financier',
                'message': 'Votre score bancaire est excellent. Vous avez un profil très attractif pour les établissements financiers.',
            })
        elif total_score < 500:
            recommendations.append({
                'type': 'warning',
                'category': 'Score',
                'title': 'Amélioration nécessaire',
                'message': 'Votre score peut être amélioré. Concentrez-vous sur la réduction du ratio d\'endettement et l\'augmentation de l\'épargne.',
            })
        
        return recommendations


# Instance globale du service
bank_scoring_service = BankScoringService()

