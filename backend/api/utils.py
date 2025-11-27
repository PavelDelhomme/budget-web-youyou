"""
Utilities for data management
"""
import json
import re
import os
from pathlib import Path
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


# Data directory path
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)


def sanitize_email(email: str) -> str:
    """Sanitize email for filename"""
    email = email.lower().strip()
    return re.sub(r'[^a-z0-9._-]+', '_', email)


def get_user_file_path(email: str) -> Path:
    """Get file path for user data"""
    safe = sanitize_email(email)
    return DATA_DIR / f"{safe}.json"


def get_default_years() -> list:
    """Get default years based on current year"""
    current_year = datetime.now().year
    return [current_year - 1, current_year, current_year + 1, current_year + 2, current_year + 3]


def load_user(email: str) -> dict:
    """Load user data from JSON file"""
    file_path = get_user_file_path(email)
    default_years = get_default_years()
    default_global = get_default_global_data()
    
    if not file_path.exists():
        # Initialize default data
        initial = {
            'years': default_years,
            'datasets': {},
            'globalData': default_global
        }
        save_user(email, initial)
        return initial
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {
                'years': data.get('years', default_years),
                'datasets': data.get('datasets', {}),
                'globalData': data.get('globalData', default_global)
            }
    except (json.JSONDecodeError, IOError):
        # Return default if file is corrupted
        return {
            'years': default_years,
            'datasets': {},
            'globalData': default_global
        }


def save_user(email: str, data: dict) -> None:
    """Save user data to JSON file"""
    file_path = get_user_file_path(email)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def get_default_year_data() -> dict:
    """Get default year data structure"""
    return {
        'categories': [
            {'id': 'achats', 'name': 'Achats & Loisirs', 'target': 2400},
            {'id': 'alimentation', 'name': 'Alimentation', 'target': 2400}
        ],
        'expenses': [],
        'subs': [],
        'annualFixedExpenses': [],
        'monthlySalary': 0,
        'variableMonthlyIncomes': None,
        'additionalMonthlyIncomes': [],
        'currentSavings': 0,
        'savingsTransactions': []
    }


def get_default_global_data() -> dict:
    """Get default global user data structure"""
    return {
        'bankAccounts': [],
        'investments': [],
        'savingsGoals': [],
        'savingsProjects': [],
        'temporaryIncomes': [],
        'sharedExpensePersons': [],
        'personTransactions': [],
        'salaryHistory': [],
        'initializationComplete': False,
        'monthlySalary': 0,
        'monthlySalaryStartDate': None,
        'lockedYears': [],
        'excludedPredictedYears': [],
        'maxPredictedYears': 3
    }
