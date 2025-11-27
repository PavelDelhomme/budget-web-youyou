#!/usr/bin/env python3
"""
Script pour générer des données de test complètes et réalistes
pour 2024 et 2025 pour un utilisateur lambda
"""
import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
BACKEND_DIR = Path(__file__).resolve().parent.parent / 'backend'
DATA_DIR = BACKEND_DIR / 'data'
# Modifier cette ligne avec votre email pour générer les données
TEST_EMAIL = 'dev@delhomme.ovh'  # Changez avec votre email

def generate_uuid():
    """Génère un UUID comme string"""
    return str(uuid.uuid4())

def generate_date(year, month, day):
    """Génère une date ISO"""
    return f"{year}-{month:02d}-{day:02d}"

def generate_complete_test_data():
    """Génère des données complètes de test pour 2024 et 2025"""
    
    # Données globales
    global_data = {
        'initializationComplete': True,
        'monthlySalary': 2500.0,
        'monthlySalaryStartDate': '2023-01-01',
        'bankAccounts': [
            {
                'id': generate_uuid(),
                'name': 'Compte Courant Principal',
                'currentBalance': 3200.50,
                'accountType': 'checking',
                'note': 'Compte principal pour les dépenses courantes'
            },
            {
                'id': generate_uuid(),
                'name': 'Livret A',
                'currentBalance': 8500.0,
                'accountType': 'savings',
                'note': 'Épargne de sécurité'
            },
            {
                'id': generate_uuid(),
                'name': 'Revolut',
                'currentBalance': 450.75,
                'accountType': 'pocket',
                'note': 'Compte pour dépenses quotidiennes'
            }
        ],
        'investments': [
            {
                'id': generate_uuid(),
                'type': 'stocks',
                'name': 'Portefeuille Actions',
                'platform': 'Revolut',
                'currentValue': 2800.0,
                'monthlyContribution': 100.0,
                'initialAmount': 500.0,
                'startDate': '2023-06-01',
                'transactions': [
                    {
                        'id': generate_uuid(),
                        'date': '2024-03-15',
                        'amount': 500.0,
                        'note': 'Achat opportuniste'
                    },
                    {
                        'id': generate_uuid(),
                        'date': '2024-09-20',
                        'amount': 300.0,
                        'note': 'Bonus investi'
                    },
                    {
                        'id': generate_uuid(),
                        'date': '2024-12-10',
                        'amount': 400.0,
                        'note': 'Fin d\'année'
                    }
                ],
                'note': 'ETF World'
            },
            {
                'id': generate_uuid(),
                'type': 'crypto',
                'name': 'Bitcoin & Ethereum',
                'platform': 'Binance',
                'currentValue': 1200.0,
                'monthlyContribution': 50.0,
                'initialAmount': 200.0,
                'startDate': '2024-01-15',
                'transactions': [
                    {
                        'id': generate_uuid(),
                        'date': '2024-05-10',
                        'amount': 200.0,
                        'note': 'Achat BTC'
                    },
                    {
                        'id': generate_uuid(),
                        'date': '2024-11-15',
                        'amount': 150.0,
                        'note': 'Achat ETH'
                    }
                ],
                'note': 'Crypto long terme'
            }
        ],
        'savingsGoals': [
            {
                'id': generate_uuid(),
                'name': 'Épargne de précaution',
                'type': 'precaution',
                'targetAmount': 6000.0,
                'currentAmount': 8500.0,
                'priority': 1,
                'accountId': None  # Pas de compte spécifique
            },
            {
                'id': generate_uuid(),
                'name': 'Épargne minimale',
                'type': 'minimum',
                'targetAmount': 3000.0,
                'currentAmount': 3200.50,
                'priority': 2,
                'accountId': None
            }
        ],
        'savingsProjects': [
            {
                'id': generate_uuid(),
                'name': 'Vacances été 2025',
                'targetAmount': 2500.0,
                'currentAmount': 1200.0,
                'targetDate': '2025-07-01',
                'monthlyContribution': 150.0,
                'description': 'Road trip en Europe'
            },
            {
                'id': generate_uuid(),
                'name': 'Nouveau laptop',
                'targetAmount': 1500.0,
                'currentAmount': 800.0,
                'targetDate': '2025-04-01',
                'monthlyContribution': 100.0,
                'description': 'MacBook Pro'
            }
        ],
        'temporaryIncomes': [
            {
                'id': generate_uuid(),
                'name': 'Prime annuelle',
                'type': 'bonus',
                'amount': 1500.0,
                'duration': 'once',
                'startDate': '2024-12-15',
                'endDate': None,
                'numberOfMonths': None
            }
        ],
        'sharedExpensePersons': [
            {
                'id': generate_uuid(),
                'name': 'Copain/ine',
                'defaultSharePercentage': 50.0,
                'note': 'Partage équitable'
            }
        ],
        'personTransactions': [],
        'salaryHistory': [
            {
                'id': generate_uuid(),
                'amount': 2500.0,
                'startDate': '2023-01-01',
                'endDate': None,
                'type': 'salary',
                'note': 'Poste actuel'
            }
        ],
        'lockedYears': [],
        'excludedPredictedYears': [],
        'maxPredictedYears': 3
    }
    
    # Données pour 2024
    year_2024_data = {
        'categories': [
            {
                'id': 'alimentation',
                'name': 'Alimentation',
                'target': 2400.0,
                'monthlyTargets': [200.0, 190.0, 210.0, 205.0, 220.0, 230.0, 215.0, 200.0, 210.0, 225.0, 240.0, 255.0]
            },
            {
                'id': 'transport',
                'name': 'Transport',
                'target': 1200.0,
                'monthlyTargets': [100.0] * 12
            },
            {
                'id': 'logement',
                'name': 'Logement',
                'target': 7200.0,
                'monthlyTargets': [600.0] * 12
            },
            {
                'id': 'loisirs',
                'name': 'Loisirs & Sorties',
                'target': 1800.0,
                'monthlyTargets': [120.0, 100.0, 150.0, 180.0, 200.0, 250.0, 180.0, 150.0, 120.0, 140.0, 110.0, 100.0]
            },
            {
                'id': 'sante',
                'name': 'Santé',
                'target': 600.0,
                'monthlyTargets': [50.0] * 12
            },
            {
                'id': 'vetements',
                'name': 'Vêtements',
                'target': 800.0,
                'monthlyTargets': [50.0, 50.0, 100.0, 80.0, 50.0, 100.0, 50.0, 80.0, 100.0, 50.0, 60.0, 30.0]
            },
            {
                'id': 'high-tech',
                'name': 'High-Tech',
                'target': 1200.0,
                'monthlyTargets': [50.0, 50.0, 200.0, 50.0, 50.0, 150.0, 50.0, 100.0, 200.0, 100.0, 100.0, 100.0]
            }
        ],
        'expenses': [
            # Janvier 2024
            {'id': generate_uuid(), 'date': '2024-01-05', 'amount': 85.50, 'categoryId': 'alimentation', 'note': 'Courses Carrefour'},
            {'id': generate_uuid(), 'date': '2024-01-12', 'amount': 92.30, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-01-19', 'amount': 78.90, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-01-15', 'amount': 45.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-01-20', 'amount': 65.0, 'categoryId': 'loisirs', 'note': 'Cinéma + resto'},
            {'id': generate_uuid(), 'date': '2024-01-25', 'amount': 120.0, 'categoryId': 'vetements', 'note': 'Jeans + t-shirts'},
            # Février 2024
            {'id': generate_uuid(), 'date': '2024-02-03', 'amount': 88.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-02-10', 'amount': 95.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-02-17', 'amount': 72.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-02-08', 'amount': 50.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-02-14', 'amount': 55.0, 'categoryId': 'loisirs', 'note': 'Restaurant'},
            # Mars 2024
            {'id': generate_uuid(), 'date': '2024-03-02', 'amount': 105.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-03-09', 'amount': 98.50, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-03-16', 'amount': 85.70, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-03-22', 'amount': 89.30, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-03-12', 'amount': 48.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-03-18', 'amount': 180.0, 'categoryId': 'loisirs', 'note': 'Concert'},
            {'id': generate_uuid(), 'date': '2024-03-25', 'amount': 250.0, 'categoryId': 'high-tech', 'note': 'Nouveau smartphone'},
            {'id': generate_uuid(), 'date': '2024-03-28', 'amount': 150.0, 'categoryId': 'vetements', 'note': 'Manteau printemps'},
            # Avril 2024
            {'id': generate_uuid(), 'date': '2024-04-05', 'amount': 102.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-04-12', 'amount': 96.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-04-19', 'amount': 91.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-04-26', 'amount': 88.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-04-10', 'amount': 52.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-04-15', 'amount': 200.0, 'categoryId': 'loisirs', 'note': 'Week-end à la mer'},
            {'id': generate_uuid(), 'date': '2024-04-22', 'amount': 120.0, 'categoryId': 'vetements', 'note': 'Chaussures'},
            # Mai 2024
            {'id': generate_uuid(), 'date': '2024-05-03', 'amount': 108.90, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-05-10', 'amount': 103.50, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-05-17', 'amount': 97.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-05-24', 'amount': 95.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-05-31', 'amount': 101.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-05-08', 'amount': 55.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-05-20', 'amount': 240.0, 'categoryId': 'loisirs', 'note': 'Festival'},
            {'id': generate_uuid(), 'date': '2024-05-12', 'amount': 80.0, 'categoryId': 'vetements', 'note': 'T-shirts été'},
            # Juin 2024
            {'id': generate_uuid(), 'date': '2024-06-01', 'amount': 112.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-06-08', 'amount': 106.30, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-06-15', 'amount': 99.70, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-06-22', 'amount': 98.90, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-06-29', 'amount': 104.50, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-06-05', 'amount': 58.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-06-18', 'amount': 300.0, 'categoryId': 'loisirs', 'note': 'Vacances début été'},
            {'id': generate_uuid(), 'date': '2024-06-25', 'amount': 150.0, 'categoryId': 'high-tech', 'note': 'Écouteurs'},
            {'id': generate_uuid(), 'date': '2024-06-20', 'amount': 150.0, 'categoryId': 'vetements', 'note': 'Maillots de bain'},
            # Juillet 2024
            {'id': generate_uuid(), 'date': '2024-07-05', 'amount': 115.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-07-12', 'amount': 109.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-07-19', 'amount': 103.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-07-26', 'amount': 100.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-07-08', 'amount': 60.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-07-15', 'amount': 220.0, 'categoryId': 'loisirs', 'note': 'Sorties été'},
            {'id': generate_uuid(), 'date': '2024-07-22', 'amount': 50.0, 'categoryId': 'vetements', 'note': 'Short'},
            # Août 2024
            {'id': generate_uuid(), 'date': '2024-08-02', 'amount': 110.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-08-09', 'amount': 105.90, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-08-16', 'amount': 98.50, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-08-23', 'amount': 96.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-08-30', 'amount': 102.30, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-08-07', 'amount': 62.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-08-18', 'amount': 190.0, 'categoryId': 'loisirs', 'note': 'Week-end montagne'},
            {'id': generate_uuid(), 'date': '2024-08-25', 'amount': 100.0, 'categoryId': 'high-tech', 'note': 'Câble USB-C'},
            {'id': generate_uuid(), 'date': '2024-08-12', 'amount': 120.0, 'categoryId': 'vetements', 'note': 'Pull'},
            # Septembre 2024
            {'id': generate_uuid(), 'date': '2024-09-06', 'amount': 107.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-09-13', 'amount': 101.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-09-20', 'amount': 95.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-09-27', 'amount': 99.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-09-10', 'amount': 50.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-09-22', 'amount': 150.0, 'categoryId': 'loisirs', 'note': 'Concert'},
            {'id': generate_uuid(), 'date': '2024-09-15', 'amount': 150.0, 'categoryId': 'vetements', 'note': 'Veste automne'},
            # Octobre 2024
            {'id': generate_uuid(), 'date': '2024-10-04', 'amount': 113.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-10-11', 'amount': 108.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-10-18', 'amount': 102.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-10-25', 'amount': 100.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-10-08', 'amount': 55.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-10-20', 'amount': 160.0, 'categoryId': 'loisirs', 'note': 'Théâtre'},
            {'id': generate_uuid(), 'date': '2024-10-14', 'amount': 140.0, 'categoryId': 'vetements', 'note': 'Chaussures automne'},
            {'id': generate_uuid(), 'date': '2024-10-28', 'amount': 200.0, 'categoryId': 'high-tech', 'note': 'SSD externe'},
            # Novembre 2024
            {'id': generate_uuid(), 'date': '2024-11-01', 'amount': 117.40, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-11-08', 'amount': 111.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-11-15', 'amount': 106.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-11-22', 'amount': 104.80, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-11-29', 'amount': 110.00, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-11-06', 'amount': 52.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-11-18', 'amount': 130.0, 'categoryId': 'loisirs', 'note': 'Restaurant'},
            {'id': generate_uuid(), 'date': '2024-11-25', 'amount': 110.0, 'categoryId': 'vetements', 'note': 'Pull hiver'},
            {'id': generate_uuid(), 'date': '2024-11-12', 'amount': 120.0, 'categoryId': 'high-tech', 'note': 'Clavier mécanique'},
            # Décembre 2024
            {'id': generate_uuid(), 'date': '2024-12-06', 'amount': 120.20, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-12-13', 'amount': 125.80, 'categoryId': 'alimentation', 'note': 'Courses fêtes'},
            {'id': generate_uuid(), 'date': '2024-12-20', 'amount': 150.40, 'categoryId': 'alimentation', 'note': 'Réveillon'},
            {'id': generate_uuid(), 'date': '2024-12-27', 'amount': 108.60, 'categoryId': 'alimentation', 'note': 'Courses'},
            {'id': generate_uuid(), 'date': '2024-12-10', 'amount': 60.0, 'categoryId': 'transport', 'note': 'Essence'},
            {'id': generate_uuid(), 'date': '2024-12-22', 'amount': 280.0, 'categoryId': 'loisirs', 'note': 'Cadeaux + sorties'},
            {'id': generate_uuid(), 'date': '2024-12-15', 'amount': 100.0, 'categoryId': 'high-tech', 'note': 'Cadeaux tech'},
        ],
        'subs': [
            {
                'id': generate_uuid(),
                'name': 'Netflix',
                'monthly': 15.99,
                'startMonth': 1,
                'endMonth': 12,
                'ongoing': True,
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Spotify',
                'monthly': 9.99,
                'startMonth': 1,
                'endMonth': 12,
                'ongoing': True,
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Assurance voiture',
                'monthly': 65.0,
                'startMonth': 1,
                'endMonth': 12,
                'ongoing': True,
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Abonnement téléphone',
                'monthly': 25.99,
                'startMonth': 1,
                'endMonth': 12,
                'ongoing': True,
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Salle de sport',
                'monthly': 35.0,
                'startMonth': 1,
                'endMonth': 12,
                'ongoing': True,
                'accountId': None
            }
        ],
        'annualFixedExpenses': [
            {
                'id': generate_uuid(),
                'name': 'Assurance habitation',
                'amount': 350.0,
                'month': 3,
                'note': 'Renouvellement annuel',
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Contrôle technique',
                'amount': 120.0,
                'month': 6,
                'note': 'Voiture',
                'accountId': None
            },
            {
                'id': generate_uuid(),
                'name': 'Carte grise',
                'amount': 80.0,
                'month': 8,
                'note': 'Frais annuels',
                'accountId': None
            }
        ],
        'monthlySalary': 2500.0,
        'variableMonthlyIncomes': None,
        'additionalMonthlyIncomes': [
            {
                'id': generate_uuid(),
                'name': 'Prime de Noël',
                'amount': 500.0,
                'month': 12,
                'note': 'Prime exceptionnelle'
            }
        ],
        'currentSavings': 8500.0,
        'savingsTransactions': [
            {
                'id': generate_uuid(),
                'date': '2024-01-15',
                'amount': 300.0,
                'note': 'Épargne janvier'
            },
            {
                'id': generate_uuid(),
                'date': '2024-02-15',
                'amount': 350.0,
                'note': 'Épargne février'
            },
            {
                'id': generate_uuid(),
                'date': '2024-03-20',
                'amount': 200.0,
                'note': 'Épargne mars'
            },
            {
                'id': generate_uuid(),
                'date': '2024-04-15',
                'amount': 400.0,
                'note': 'Épargne avril'
            },
            {
                'id': generate_uuid(),
                'date': '2024-05-15',
                'amount': 300.0,
                'note': 'Épargne mai'
            },
            {
                'id': generate_uuid(),
                'date': '2024-06-15',
                'amount': 250.0,
                'note': 'Épargne juin'
            },
            {
                'id': generate_uuid(),
                'date': '2024-07-15',
                'amount': 200.0,
                'note': 'Épargne juillet'
            },
            {
                'id': generate_uuid(),
                'date': '2024-08-15',
                'amount': 180.0,
                'note': 'Épargne août'
            },
            {
                'id': generate_uuid(),
                'date': '2024-09-15',
                'amount': 320.0,
                'note': 'Épargne septembre'
            },
            {
                'id': generate_uuid(),
                'date': '2024-10-15',
                'amount': 280.0,
                'note': 'Épargne octobre'
            },
            {
                'id': generate_uuid(),
                'date': '2024-11-15',
                'amount': 300.0,
                'note': 'Épargne novembre'
            },
            {
                'id': generate_uuid(),
                'date': '2024-12-20',
                'amount': 500.0,
                'note': 'Prime investie'
            }
        ]
    }
    
    # Données pour 2025 (avec variations)
    year_2025_data = year_2024_data.copy()
    # Mettre à jour les budgets avec une légère augmentation
    for cat in year_2025_data['categories']:
        if 'monthlyTargets' in cat:
            cat['monthlyTargets'] = [t * 1.03 for t in cat['monthlyTargets']]  # +3% pour inflation
            cat['target'] = sum(cat['monthlyTargets'])
    
    # Réduire les dépenses (moins de données pour 2025 car on est en début d'année)
    year_2025_data['expenses'] = [
        # Janvier 2025
        {'id': generate_uuid(), 'date': '2025-01-04', 'amount': 90.50, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-01-11', 'amount': 95.30, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-01-18', 'amount': 88.90, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-01-25', 'amount': 92.70, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-01-10', 'amount': 48.0, 'categoryId': 'transport', 'note': 'Essence'},
        {'id': generate_uuid(), 'date': '2025-01-20', 'amount': 70.0, 'categoryId': 'loisirs', 'note': 'Cinéma'},
        # Février 2025
        {'id': generate_uuid(), 'date': '2025-02-01', 'amount': 93.20, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-02-08', 'amount': 97.60, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-02-15', 'amount': 91.40, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-02-22', 'amount': 89.80, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-02-12', 'amount': 52.0, 'categoryId': 'transport', 'note': 'Essence'},
        {'id': generate_uuid(), 'date': '2025-02-14', 'amount': 120.0, 'categoryId': 'loisirs', 'note': 'Restaurant Saint-Valentin'},
        # Mars 2025 (jusqu'à aujourd'hui)
        {'id': generate_uuid(), 'date': '2025-03-02', 'amount': 96.80, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-03-09', 'amount': 99.50, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-03-16', 'amount': 94.70, 'categoryId': 'alimentation', 'note': 'Courses'},
        {'id': generate_uuid(), 'date': '2025-03-10', 'amount': 50.0, 'categoryId': 'transport', 'note': 'Essence'},
        {'id': generate_uuid(), 'date': '2025-03-18', 'amount': 85.0, 'categoryId': 'loisirs', 'note': 'Bar avec amis'},
    ]
    
    # Mettre à jour le salaire avec une légère augmentation
    year_2025_data['monthlySalary'] = 2600.0
    
    # Mettre à jour l'épargne actuelle
    year_2025_data['currentSavings'] = 9500.0
    
    # Ajouter quelques transactions d'épargne pour 2025
    year_2025_data['savingsTransactions'] = [
        {
            'id': generate_uuid(),
            'date': '2025-01-15',
            'amount': 350.0,
            'note': 'Épargne janvier'
        },
        {
            'id': generate_uuid(),
            'date': '2025-02-15',
            'amount': 380.0,
            'note': 'Épargne février'
        },
        {
            'id': generate_uuid(),
            'date': '2025-03-15',
            'amount': 320.0,
            'note': 'Épargne mars'
        }
    ]
    
    # Structure complète
    complete_data = {
        'years': [2024, 2025],
        'datasets': {
            '2024': year_2024_data,
            '2025': year_2025_data
        },
        'globalData': global_data
    }
    
    return complete_data

def main():
    """Point d'entrée principal"""
    print("🚀 Génération de données de test complètes...")
    
    # Créer le dossier data s'il n'existe pas
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Générer les données
    test_data = generate_complete_test_data()
    
    # Sauvegarder dans un fichier temporaire (script directory)
    script_dir = Path(__file__).parent
    temp_file = script_dir / f'generated_data_{TEST_EMAIL.replace("@", "_")}.json'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    print(f"✅ Données générées avec succès dans: {temp_file}")
    print(f"\n📊 Résumé des données générées:")
    print(f"   - Années: {test_data['years']}")
    print(f"   - Comptes bancaires: {len(test_data['globalData']['bankAccounts'])}")
    print(f"   - Investissements: {len(test_data['globalData']['investments'])}")
    print(f"   - Objectifs d'épargne: {len(test_data['globalData']['savingsGoals'])}")
    print(f"   - Projets d'épargne: {len(test_data['globalData']['savingsProjects'])}")
    print(f"   - Dépenses 2024: {len(test_data['datasets']['2024']['expenses'])}")
    print(f"   - Dépenses 2025: {len(test_data['datasets']['2025']['expenses'])}")
    print(f"   - Abonnements: {len(test_data['datasets']['2024']['subs'])}")
    print(f"   - Dépenses fixes annuelles: {len(test_data['datasets']['2024']['annualFixedExpenses'])}")
    
    target_file = DATA_DIR / f'{TEST_EMAIL.replace("@", "_")}.json'
    print(f"\n💡 Pour utiliser ces données:")
    print(f"   1. Copiez le fichier vers: {target_file}")
    print(f"   2. Commandes possibles:")
    print(f"      - Via Docker: docker cp {temp_file} budget-web-backend:/app/data/{TEST_EMAIL.replace('@', '_')}.json")
    print(f"      - Ou manuellement: cp {temp_file} {target_file} (nécessite sudo si permissions)")
    print(f"   3. Connectez-vous avec l'email: {TEST_EMAIL}")

if __name__ == '__main__':
    main()

