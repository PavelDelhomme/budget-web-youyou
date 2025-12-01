"""
AI-powered recommendation system for budget optimization
Provides intelligent recommendations for savings goals, projects, and contributions
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from .model import create_predictor
from api.utils import load_user


class AIRecommendationEngine:
    """
    Engine for generating AI-based recommendations for:
    - Target dates for savings goals
    - Monthly contributions for savings projects
    - Optimal savings goals
    - Budget adjustments
    """
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.predictor = create_predictor(user_email)
        self.predictor.load()  # Load if exists
    
    def recommend_monthly_contribution(
        self, 
        target_amount: float, 
        target_date: Optional[datetime] = None,
        current_amount: float = 0
    ) -> Dict[str, Any]:
        """
        Recommend optimal monthly contribution for a savings project
        
        Args:
            target_amount: Target amount to save
            target_date: Target date (optional, defaults to 1 year from now)
            current_amount: Current amount saved
            
        Returns:
            Recommendation with monthly contribution and confidence
        """
        if target_date is None:
            target_date = datetime.now() + timedelta(days=365)
        
        # Calculate months remaining
        now = datetime.now()
        months_remaining = max(1, (target_date.year - now.year) * 12 + (target_date.month - now.month))
        
        # Calculate required monthly contribution
        remaining_amount = target_amount - current_amount
        
        if remaining_amount <= 0:
            return {
                'monthly_contribution': 0,
                'message': 'Objectif déjà atteint !',
                'confidence': 1.0
            }
        
        base_monthly = remaining_amount / months_remaining
        
        # Get predicted income and expenses for better recommendation
        if self.predictor.is_trained:
            # Get user data
            user_data = load_user(self.user_email)
            historical_data = []
            
            years = sorted(user_data.get('years', []))
            for year in years[-3:]:  # Last 3 years
                year_key = str(year)
                dataset = user_data['datasets'].get(year_key, {})
                if dataset:
                    historical_data.append({'year': year, 'data': dataset})
            
            if historical_data:
                # Predict next year's income and expenses
                last_data = historical_data[-1]
                future_year = datetime.now().year + 1
                
                predictions = self.predictor.predict([future_year], last_data)
                
                if predictions:
                    pred = predictions[0]
                    predicted_income = pred.get('predicted_annual_income', 0) / 12
                    predicted_expenses = pred.get('predicted_total_expenses', 0) / 12
                    
                    # Calculate available budget
                    available_budget = max(0, predicted_income - predicted_expenses)
                    
                    # Recommend based on available budget
                    if base_monthly > available_budget * 0.8:
                        recommended = min(base_monthly, available_budget * 0.7)
                        confidence = 0.6
                        message = f'Recommandation ajustée selon vos prévisions budgétaires ({available_budget:.0f}€/mois disponibles)'
                    else:
                        recommended = base_monthly
                        confidence = 0.9
                        message = 'Recommandation basée sur vos habitudes budgétaires'
                else:
                    recommended = base_monthly
                    confidence = 0.7
                    message = 'Recommandation basée sur la durée cible'
            else:
                recommended = base_monthly
                confidence = 0.7
                message = 'Recommandation basée sur la durée cible'
        else:
            recommended = base_monthly
            confidence = 0.5
            message = 'Recommandation basique (entraînez le modèle IA pour des recommandations améliorées)'
        
        return {
            'monthly_contribution': round(recommended, 2),
            'months_remaining': months_remaining,
            'total_remaining': remaining_amount,
            'confidence': confidence,
            'message': message,
            'base_calculation': round(base_monthly, 2),
            'recommendation_type': 'ai_enhanced' if self.predictor.is_trained else 'basic'
        }
    
    def recommend_target_date(
        self,
        target_amount: float,
        monthly_contribution: float,
        current_amount: float = 0
    ) -> Dict[str, Any]:
        """
        Recommend optimal target date based on contribution capacity
        
        Args:
            target_amount: Target amount to save
            monthly_contribution: Monthly contribution capacity
            current_amount: Current amount saved
            
        Returns:
            Recommended target date with confidence
        """
        remaining_amount = target_amount - current_amount
        
        if remaining_amount <= 0:
            return {
                'target_date': datetime.now().isoformat(),
                'message': 'Objectif déjà atteint !',
                'confidence': 1.0
            }
        
        if monthly_contribution <= 0:
            return {
                'target_date': None,
                'message': 'Contribution mensuelle insuffisante',
                'confidence': 0.0
            }
        
        # Calculate base months needed
        base_months = remaining_amount / monthly_contribution
        
        # Adjust based on predicted budget if model is trained
        if self.predictor.is_trained:
            user_data = load_user(self.user_email)
            historical_data = []
            
            years = sorted(user_data.get('years', []))
            for year in years[-3:]:
                year_key = str(year)
                dataset = user_data['datasets'].get(year_key, {})
                if dataset:
                    historical_data.append({'year': year, 'data': dataset})
            
            if historical_data:
                # Predict future budget availability
                last_data = historical_data[-1]
                future_year = datetime.now().year + 1
                predictions = self.predictor.predict([future_year], last_data)
                
                if predictions:
                    pred = predictions[0]
                    predicted_income = pred.get('predicted_annual_income', 0) / 12
                    predicted_expenses = pred.get('predicted_total_expenses', 0) / 12
                    available_budget = max(0, predicted_income - predicted_expenses)
                    
                    # Adjust if contribution is higher than available
                    if monthly_contribution > available_budget * 0.8:
                        # Add buffer months for safety
                        adjusted_months = base_months * 1.3
                        confidence = 0.7
                        message = 'Date ajustée selon vos prévisions budgétaires (avec marge de sécurité)'
                    else:
                        adjusted_months = base_months
                        confidence = 0.9
                        message = 'Date optimisée selon vos habitudes budgétaires'
                else:
                    adjusted_months = base_months
                    confidence = 0.7
                    message = 'Date calculée selon la contribution mensuelle'
            else:
                adjusted_months = base_months
                confidence = 0.7
                message = 'Date calculée selon la contribution mensuelle'
        else:
            adjusted_months = base_months
            confidence = 0.6
            message = 'Date de base (entraînez le modèle IA pour une date optimisée)'
        
        # Calculate target date
        target_date = datetime.now() + timedelta(days=int(adjusted_months * 30.44))
        
        return {
            'target_date': target_date.isoformat(),
            'months_estimated': round(adjusted_months, 1),
            'confidence': confidence,
            'message': message,
            'base_months': round(base_months, 1),
            'recommendation_type': 'ai_enhanced' if self.predictor.is_trained else 'basic'
        }
    
    def recommend_savings_goal(
        self,
        goal_type: str = 'emergency',  # 'emergency', 'project', 'investment'
        timeframe_months: int = 12
    ) -> Dict[str, Any]:
        """
        Recommend optimal savings goal amount based on income and expenses
        
        Args:
            goal_type: Type of savings goal
            timeframe_months: Timeframe in months
            
        Returns:
            Recommended savings goal with rationale
        """
        if not self.predictor.is_trained:
            # Basic recommendation without AI
            return {
                'recommended_amount': 0,
                'message': 'Entraînez le modèle IA pour des recommandations personnalisées',
                'confidence': 0.0
            }
        
        # Get user data
        user_data = load_user(self.user_email)
        historical_data = []
        
        years = sorted(user_data.get('years', []))
        for year in years[-3:]:
            year_key = str(year)
            dataset = user_data['datasets'].get(year_key, {})
            if dataset:
                historical_data.append({'year': year, 'data': dataset})
        
        if not historical_data:
            return {
                'recommended_amount': 0,
                'message': 'Pas assez de données historiques',
                'confidence': 0.0
            }
        
        # Predict future budget
        last_data = historical_data[-1]
        future_year = datetime.now().year + 1
        predictions = self.predictor.predict([future_year], last_data)
        
        if not predictions:
            return {
                'recommended_amount': 0,
                'message': 'Impossible de générer des prédictions',
                'confidence': 0.0
            }
        
        pred = predictions[0]
        predicted_income = pred.get('predicted_annual_income', 0)
        predicted_expenses = pred.get('predicted_total_expenses', 0)
        predicted_savings = pred.get('predicted_savings', 0)
        
        # Calculate monthly savings capacity
        monthly_income = predicted_income / 12
        monthly_expenses = predicted_expenses / 12
        monthly_savings_capacity = monthly_income - monthly_expenses
        
        # Recommend based on goal type
        if goal_type == 'emergency':
            # Emergency fund: 3-6 months of expenses
            recommended = monthly_expenses * 4.5  # 4.5 months average
            rationale = f'Fond d\'urgence recommandé : {4.5:.1f} mois de dépenses mensuelles'
            confidence = 0.85
        elif goal_type == 'project':
            # Project: Based on available savings over timeframe
            recommended = monthly_savings_capacity * timeframe_months * 0.7  # 70% of capacity
            rationale = f'Basé sur votre capacité d\'épargne ({monthly_savings_capacity:.0f}€/mois) sur {timeframe_months} mois'
            confidence = 0.8
        elif goal_type == 'investment':
            # Investment: More aggressive, 50% of savings capacity
            recommended = monthly_savings_capacity * timeframe_months * 0.5
            rationale = f'Pour l\'investissement, recommande 50% de votre capacité d\'épargne'
            confidence = 0.75
        else:
            recommended = monthly_savings_capacity * timeframe_months
            rationale = 'Basé sur votre capacité d\'épargne estimée'
            confidence = 0.7
        
        return {
            'recommended_amount': round(max(0, recommended), 2),
            'monthly_savings_capacity': round(monthly_savings_capacity, 2),
            'rationale': rationale,
            'confidence': confidence,
            'predicted_annual_savings': round(predicted_savings, 2),
            'recommendation_type': 'ai_enhanced'
        }
    
    def analyze_budget_health(self) -> Dict[str, Any]:
        """
        Analyze overall budget health and provide recommendations
        """
        if not self.predictor.is_trained:
            return {
                'health_score': 0,
                'message': 'Entraînez le modèle IA pour une analyse complète',
                'recommendations': []
            }
        
        user_data = load_user(self.user_email)
        historical_data = []
        
        years = sorted(user_data.get('years', []))
        for year in years[-3:]:
            year_key = str(year)
            dataset = user_data['datasets'].get(year_key, {})
            if dataset:
                historical_data.append({'year': year, 'data': dataset})
        
        if not historical_data:
            return {
                'health_score': 0,
                'message': 'Pas assez de données',
                'recommendations': []
            }
        
        # Predict future
        last_data = historical_data[-1]
        future_year = datetime.now().year + 1
        predictions = self.predictor.predict([future_year], last_data)
        
        if not predictions:
            return {
                'health_score': 0,
                'message': 'Impossible de générer des prédictions',
                'recommendations': []
            }
        
        pred = predictions[0]
        predicted_income = pred.get('predicted_annual_income', 0)
        predicted_expenses = pred.get('predicted_total_expenses', 0)
        predicted_savings = pred.get('predicted_savings', 0)
        
        # Calculate health metrics
        savings_rate = (predicted_savings / predicted_income * 100) if predicted_income > 0 else 0
        expense_ratio = (predicted_expenses / predicted_income * 100) if predicted_income > 0 else 100
        
        # Health score (0-100)
        if savings_rate >= 20:
            health_score = 90
        elif savings_rate >= 15:
            health_score = 75
        elif savings_rate >= 10:
            health_score = 60
        elif savings_rate >= 5:
            health_score = 45
        else:
            health_score = 30
        
        # Generate recommendations
        recommendations = []
        
        if savings_rate < 10:
            recommendations.append({
                'type': 'increase_savings',
                'priority': 'high',
                'message': f'Votre taux d\'épargne est faible ({savings_rate:.1f}%). Recommande d\'augmenter l\'épargne.',
                'target_savings_rate': 15
            })
        
        if expense_ratio > 90:
            recommendations.append({
                'type': 'reduce_expenses',
                'priority': 'high',
                'message': f'Vos dépenses représentent {expense_ratio:.1f}% de vos revenus. Analysez vos dépenses.',
                'target_expense_ratio': 80
            })
        
        if predicted_savings < 0:
            recommendations.append({
                'type': 'budget_deficit',
                'priority': 'critical',
                'message': 'Prévision de déficit budgétaire. Action immédiate recommandée.',
                'estimated_deficit': abs(predicted_savings)
            })
        
        return {
            'health_score': health_score,
            'savings_rate': round(savings_rate, 2),
            'expense_ratio': round(expense_ratio, 2),
            'predicted_savings': round(predicted_savings, 2),
            'message': self._get_health_message(health_score),
            'recommendations': recommendations,
            'recommendation_type': 'ai_enhanced'
        }
    
    def _get_health_message(self, score: int) -> str:
        """Get health message based on score"""
        if score >= 80:
            return 'Excellent ! Votre budget est très sain.'
        elif score >= 60:
            return 'Bon ! Votre budget est en bonne santé.'
        elif score >= 40:
            return 'Moyen. Quelques ajustements recommandés.'
        else:
            return 'Attention. Votre budget nécessite des améliorations.'

