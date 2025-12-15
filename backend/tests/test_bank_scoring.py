"""
Tests unitaires pour le système de scoring bancaire
"""
import pytest
from datetime import datetime, timedelta
from api.bank_scoring import BankScoringService


@pytest.fixture
def scoring_service():
    """Fixture pour créer une instance du service de scoring"""
    return BankScoringService()


@pytest.fixture
def sample_user_data():
    """Données utilisateur de test"""
    return {
        'bankAccounts': [
            {'id': '1', 'name': 'Compte Principal', 'currentBalance': 5000, 'accountType': 'checking'},
            {'id': '2', 'name': 'Livret A', 'currentBalance': 10000, 'accountType': 'savings'},
        ],
        'investments': [
            {'id': '1', 'type': 'stocks', 'name': 'Portefeuille Actions', 'currentValue': 15000, 'monthlyContribution': 500, 'initialAmount': 10000, 'startDate': '2023-01-01'},
        ],
        'salaryHistory': [
            {'year': 2023, 'monthlySalary': 3000},
            {'year': 2024, 'monthlySalary': 3200},
        ],
    }


@pytest.fixture
def sample_year_data():
    """Données d'année de test"""
    return {
        'monthlySalary': 3200,
        'categories': [
            {'id': '1', 'name': 'Alimentation', 'target': 3000, 'monthlyTargets': [250] * 12},
            {'id': '2', 'name': 'Transport', 'target': 1200, 'monthlyTargets': [100] * 12},
        ],
        'subs': [
            {'id': '1', 'name': 'Netflix', 'monthly': 15.99, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
            {'id': '2', 'name': 'Assurance', 'monthly': 50, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ],
        'annualFixedExpenses': [
            {'id': '1', 'name': 'Assurance habitation', 'amount': 600, 'month': 1},
        ],
        'expenses': [
            {'id': '1', 'date': '2024-01-15', 'amount': 100, 'categoryId': '1'},
            {'id': '2', 'date': '2024-02-10', 'amount': 150, 'categoryId': '1'},
            {'id': '3', 'date': '2024-03-05', 'amount': 120, 'categoryId': '1'},
        ],
        'additionalMonthlyIncomes': [],
        'monthlyIncomeSources': [],
        'variableMonthlyIncomes': [],
        'currentSavings': 8000,
        'savingsTransactions': [],
    }


class TestDebtRatio:
    """Tests pour le calcul du ratio d'endettement"""
    
    def test_ideal_debt_ratio(self, scoring_service, sample_year_data):
        """Test avec un ratio d'endettement idéal (< 25%)"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 800, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]  # 800/4000 = 20%
        sample_year_data['annualFixedExpenses'] = []
        
        score, ratio = scoring_service._calculate_debt_ratio(sample_year_data)
        
        assert ratio == pytest.approx(0.20, rel=0.01)
        assert score == scoring_service.WEIGHTS['debt_ratio']  # Score maximal
    
    def test_max_acceptable_debt_ratio(self, scoring_service, sample_year_data):
        """Test avec un ratio d'endettement maximal acceptable (33%)"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 1320, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]  # 1320/4000 = 33%
        sample_year_data['annualFixedExpenses'] = []
        
        score, ratio = scoring_service._calculate_debt_ratio(sample_year_data)
        
        assert ratio == pytest.approx(0.33, rel=0.01)
        assert score < scoring_service.WEIGHTS['debt_ratio']  # Pénalité
    
    def test_excessive_debt_ratio(self, scoring_service, sample_year_data):
        """Test avec un ratio d'endettement excessif (> 33%)"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 2000, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]  # 2000/4000 = 50%
        sample_year_data['annualFixedExpenses'] = []
        
        score, ratio = scoring_service._calculate_debt_ratio(sample_year_data)
        
        assert ratio == pytest.approx(0.50, rel=0.01)
        assert score < 200  # Pénalité importante
    
    def test_no_income(self, scoring_service, sample_year_data):
        """Test sans revenus"""
        sample_year_data['monthlySalary'] = 0
        sample_year_data['subs'] = []
        
        score, ratio = scoring_service._calculate_debt_ratio(sample_year_data)
        
        assert ratio == 1.0  # 100% si pas de revenus
        assert score == 0  # Score minimal


class TestSavingsCapacity:
    """Tests pour le calcul de la capacité d'épargne"""
    
    def test_ideal_savings_capacity(self, scoring_service, sample_year_data):
        """Test avec une capacité d'épargne idéale (> 20%)"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 500, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]
        sample_year_data['categories'] = [
            {'id': '1', 'name': 'Test', 'target': 24000, 'monthlyTargets': [2000] * 12},
        ]  # (4000 - 500 - 2000) / 4000 = 37.5%
        
        score, capacity = scoring_service._calculate_savings_capacity(sample_year_data)
        
        assert capacity >= scoring_service.IDEAL_SAVINGS_RATE
        assert score == scoring_service.WEIGHTS['savings_capacity']
    
    def test_negative_savings_capacity(self, scoring_service, sample_year_data):
        """Test avec une capacité d'épargne négative (dépenses > revenus)"""
        sample_year_data['monthlySalary'] = 2000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 1000, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]
        sample_year_data['categories'] = [
            {'id': '1', 'name': 'Test', 'target': 24000, 'monthlyTargets': [2000] * 12},
        ]  # (2000 - 1000 - 2000) / 2000 = -50%
        
        score, capacity = scoring_service._calculate_savings_capacity(sample_year_data)
        
        assert capacity < 0
        assert score == 0


class TestIncomeStability:
    """Tests pour le calcul de la stabilité des revenus"""
    
    def test_stable_income(self, scoring_service, sample_user_data, sample_year_data):
        """Test avec des revenus stables"""
        sample_year_data['monthlySalary'] = 3000
        sample_user_data['salaryHistory'] = [
            {'year': 2022, 'monthlySalary': 2900},
            {'year': 2023, 'monthlySalary': 3000},
            {'year': 2024, 'monthlySalary': 3000},
        ]
        
        score, stability = scoring_service._calculate_income_stability(sample_user_data, sample_year_data)
        
        assert score >= 100  # Bon score avec historique
        assert 0 <= stability <= 1
    
    def test_no_history(self, scoring_service, sample_user_data, sample_year_data):
        """Test sans historique de salaire"""
        sample_user_data['salaryHistory'] = []
        
        score, stability = scoring_service._calculate_income_stability(sample_user_data, sample_year_data)
        
        assert score < 150  # Score réduit sans historique
        assert score > 0  # Mais positif si salaire fixe


class TestAssetsScore:
    """Tests pour le calcul du score des actifs"""
    
    def test_high_assets(self, scoring_service, sample_user_data):
        """Test avec beaucoup d'actifs"""
        sample_user_data['bankAccounts'] = [
            {'id': '1', 'currentBalance': 50000, 'accountType': 'checking'},
        ]
        sample_user_data['investments'] = [
            {'id': '1', 'currentValue': 50000, 'monthlyContribution': 0, 'initialAmount': 0, 'startDate': '2023-01-01'},
        ]
        
        score, total = scoring_service._calculate_assets_score(sample_user_data)
        
        assert total == 100000
        assert score == scoring_service.WEIGHTS['assets']  # Score maximal
    
    def test_low_assets(self, scoring_service, sample_user_data):
        """Test avec peu d'actifs"""
        sample_user_data['bankAccounts'] = [
            {'id': '1', 'currentBalance': 500, 'accountType': 'checking'},
        ]
        sample_user_data['investments'] = []
        
        score, total = scoring_service._calculate_assets_score(sample_user_data)
        
        assert total == 500
        assert score < 50  # Score faible


class TestExpenseRegularity:
    """Tests pour le calcul de la régularité des dépenses"""
    
    def test_regular_expenses(self, scoring_service, sample_year_data):
        """Test avec des dépenses régulières"""
        # Créer des dépenses régulières (100€ chaque mois)
        expenses = []
        for month in range(1, 13):
            expenses.append({
                'id': str(month),
                'date': f'2024-{month:02d}-15',
                'amount': 100,
                'categoryId': '1',
            })
        sample_year_data['expenses'] = expenses
        
        score, regularity = scoring_service._calculate_expense_regularity(sample_year_data)
        
        assert score >= 80  # Bon score pour régularité
        assert 0 <= regularity <= 1
    
    def test_irregular_expenses(self, scoring_service, sample_year_data):
        """Test avec des dépenses irrégulières"""
        # Créer des dépenses très variables
        expenses = []
        amounts = [50, 500, 20, 800, 10, 1000, 30, 600, 5, 900, 40, 700]
        for month, amount in enumerate(amounts, 1):
            expenses.append({
                'id': str(month),
                'date': f'2024-{month:02d}-15',
                'amount': amount,
                'categoryId': '1',
            })
        sample_year_data['expenses'] = expenses
        
        score, regularity = scoring_service._calculate_expense_regularity(sample_year_data)
        
        assert score < 50  # Score réduit pour irrégularité


class TestSavingsRate:
    """Tests pour le calcul du taux d'épargne"""
    
    def test_high_savings_rate(self, scoring_service, sample_year_data):
        """Test avec un taux d'épargne élevé"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['currentSavings'] = 50000  # 50% des revenus annuels
        
        score, rate = scoring_service._calculate_savings_rate(sample_year_data)
        
        assert rate >= 0.5
        assert score == scoring_service.WEIGHTS['savings_rate']
    
    def test_low_savings_rate(self, scoring_service, sample_year_data):
        """Test avec un taux d'épargne faible"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['currentSavings'] = 1000  # 2% des revenus annuels
        
        score, rate = scoring_service._calculate_savings_rate(sample_year_data)
        
        assert rate < 0.1
        assert score < 50


class TestRiskLevel:
    """Tests pour la détermination du niveau de risque"""
    
    def test_excellent_score(self, scoring_service):
        """Test avec un score excellent"""
        assert scoring_service._determine_risk_level(850) == 'excellent'
        assert scoring_service._determine_risk_level(800) == 'excellent'
    
    def test_good_score(self, scoring_service):
        """Test avec un bon score"""
        assert scoring_service._determine_risk_level(700) == 'bon'
        assert scoring_service._determine_risk_level(650) == 'bon'
    
    def test_medium_score(self, scoring_service):
        """Test avec un score moyen"""
        assert scoring_service._determine_risk_level(550) == 'moyen'
        assert scoring_service._determine_risk_level(500) == 'moyen'
    
    def test_low_score(self, scoring_service):
        """Test avec un score faible"""
        assert scoring_service._determine_risk_level(400) == 'faible'
        assert scoring_service._determine_risk_level(350) == 'faible'
    
    def test_very_low_score(self, scoring_service):
        """Test avec un score très faible"""
        assert scoring_service._determine_risk_level(300) == 'tres_faible'
        assert scoring_service._determine_risk_level(100) == 'tres_faible'


class TestCompleteScore:
    """Tests pour le calcul complet du score"""
    
    def test_complete_calculation(self, scoring_service, sample_user_data, sample_year_data):
        """Test du calcul complet avec toutes les données"""
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        assert 'score' in result
        assert 'risk_level' in result
        assert 'indicators' in result
        assert 'recommendations' in result
        assert 'calculation_date' in result
        
        assert 0 <= result['score'] <= 1000
        assert result['risk_level'] in ['excellent', 'bon', 'moyen', 'faible', 'tres_faible']
        assert 'scores' in result['indicators']
        assert 'values' in result['indicators']
        assert isinstance(result['recommendations'], list)
    
    def test_excellent_profile(self, scoring_service, sample_user_data, sample_year_data):
        """Test avec un profil excellent"""
        # Revenus élevés, peu de charges, beaucoup d'actifs
        sample_year_data['monthlySalary'] = 5000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 500, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]
        sample_year_data['categories'] = [
            {'id': '1', 'name': 'Test', 'target': 12000, 'monthlyTargets': [1000] * 12},
        ]
        sample_year_data['currentSavings'] = 100000
        sample_user_data['bankAccounts'] = [
            {'id': '1', 'currentBalance': 50000, 'accountType': 'checking'},
        ]
        sample_user_data['investments'] = [
            {'id': '1', 'currentValue': 100000, 'monthlyContribution': 0, 'initialAmount': 0, 'startDate': '2020-01-01'},
        ]
        sample_user_data['salaryHistory'] = [
            {'year': 2022, 'monthlySalary': 4800},
            {'year': 2023, 'monthlySalary': 4900},
            {'year': 2024, 'monthlySalary': 5000},
        ]
        
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        assert result['score'] >= 700  # Bon score
        assert result['risk_level'] in ['excellent', 'bon']
    
    def test_poor_profile(self, scoring_service, sample_user_data, sample_year_data):
        """Test avec un profil faible"""
        # Revenus faibles, beaucoup de charges, peu d'actifs
        sample_year_data['monthlySalary'] = 1500
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 800, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]  # 53% d'endettement
        sample_year_data['categories'] = [
            {'id': '1', 'name': 'Test', 'target': 12000, 'monthlyTargets': [1000] * 12},
        ]
        sample_year_data['currentSavings'] = 100
        sample_user_data['bankAccounts'] = [
            {'id': '1', 'currentBalance': 50, 'accountType': 'checking'},
        ]
        sample_user_data['investments'] = []
        sample_user_data['salaryHistory'] = []
        
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        assert result['score'] < 400  # Score faible
        assert result['risk_level'] in ['faible', 'tres_faible']


class TestRecommendations:
    """Tests pour la génération de recommandations"""
    
    def test_recommendations_for_high_debt(self, scoring_service, sample_user_data, sample_year_data):
        """Test recommandations pour endettement élevé"""
        sample_year_data['monthlySalary'] = 3000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 1500, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]  # 50% d'endettement
        
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        # Vérifier qu'il y a des recommandations sur l'endettement
        debt_recs = [r for r in result['recommendations'] if 'endettement' in r['category'].lower() or 'endettement' in r['title'].lower()]
        assert len(debt_recs) > 0
    
    def test_recommendations_for_low_savings(self, scoring_service, sample_user_data, sample_year_data):
        """Test recommandations pour épargne faible"""
        sample_year_data['monthlySalary'] = 4000
        sample_year_data['currentSavings'] = 100
        
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        # Vérifier qu'il y a des recommandations sur l'épargne
        savings_recs = [r for r in result['recommendations'] if 'épargne' in r['category'].lower() or 'épargne' in r['title'].lower()]
        assert len(savings_recs) > 0
    
    def test_recommendations_for_excellent_score(self, scoring_service, sample_user_data, sample_year_data):
        """Test recommandations pour score excellent"""
        sample_year_data['monthlySalary'] = 5000
        sample_year_data['subs'] = [
            {'id': '1', 'name': 'Test', 'monthly': 500, 'startMonth': 1, 'endMonth': 12, 'ongoing': True},
        ]
        sample_year_data['currentSavings'] = 100000
        sample_user_data['bankAccounts'] = [
            {'id': '1', 'currentBalance': 50000, 'accountType': 'checking'},
        ]
        sample_user_data['salaryHistory'] = [
            {'year': 2023, 'monthlySalary': 4800},
            {'year': 2024, 'monthlySalary': 5000},
        ]
        
        result = scoring_service.calculate_score(sample_user_data, sample_year_data)
        
        # Devrait avoir une recommandation positive pour excellent score
        if result['score'] >= 800:
            excellent_recs = [r for r in result['recommendations'] if 'excellent' in r['title'].lower()]
            assert len(excellent_recs) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

