"""
Database service layer - replaces JSON file operations
"""
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
from datetime import datetime
from .database import (
    User, UserYear, YearData, UserGlobalData, CacheEntry,
    get_db, get_or_create_user, get_user_by_email
)
from .utils import get_default_year_data, get_default_global_data, get_default_years


def load_user(db: Session, email: str) -> Dict[str, Any]:
    """Load user data from PostgreSQL - replaces load_user from utils.py"""
    user = get_or_create_user(db, email)
    
    # Get years
    user_years = db.query(UserYear).filter(UserYear.user_id == user.id).all()
    years = [uy.year for uy in user_years]
    years.sort()
    
    # If no years, initialize with defaults
    if not years:
        default_years = get_default_years()
        for year in default_years:
            user_year = UserYear(user_id=user.id, year=year)
            db.add(user_year)
        db.commit()
        years = default_years
    
    # Get datasets (year data)
    datasets = {}
    for year in years:
        user_year = db.query(UserYear).filter(
            UserYear.user_id == user.id,
            UserYear.year == year
        ).first()
        
        if user_year and user_year.year_data:
            year_data = user_year.year_data
            datasets[str(year)] = {
                'categories': year_data.categories,
                'expenses': year_data.expenses,
                'subs': year_data.subs,
                'annualFixedExpenses': year_data.annual_fixed_expenses,
                'monthlySalary': year_data.monthly_salary,
                'variableMonthlyIncomes': year_data.variable_monthly_incomes,
                'additionalMonthlyIncomes': year_data.additional_monthly_incomes,
                'monthlyIncomeSources': year_data.monthly_income_sources,
                'currentSavings': year_data.current_savings,
                'savingsTransactions': year_data.savings_transactions,
            }
        else:
            # Initialize with defaults
            default_year_data = get_default_year_data()
            datasets[str(year)] = default_year_data
            
            # Create YearData if user_year exists but no year_data
            if user_year:
                year_data = YearData(
                    user_year_id=user_year.id,
                    categories=default_year_data['categories'],
                    expenses=default_year_data['expenses'],
                    subs=default_year_data['subs'],
                    annual_fixed_expenses=default_year_data['annualFixedExpenses'],
                    monthly_salary=default_year_data['monthlySalary'],
                    variable_monthly_incomes=default_year_data.get('variableMonthlyIncomes'),
                    additional_monthly_incomes=default_year_data['additionalMonthlyIncomes'],
                    monthly_income_sources=default_year_data.get('monthlyIncomeSources', []),
                    current_savings=default_year_data['currentSavings'],
                    savings_transactions=default_year_data['savingsTransactions'],
                )
                db.add(year_data)
                db.commit()
    
    # Get global data
    if user.global_data:
        global_data_dict = {
            'bankAccounts': user.global_data.bank_accounts,
            'investments': user.global_data.investments,
            'savingsGoals': user.global_data.savings_goals,
            'savingsProjects': user.global_data.savings_projects,
            'temporaryIncomes': user.global_data.temporary_incomes,
            'sharedExpensePersons': user.global_data.shared_expense_persons,
            'personTransactions': user.global_data.person_transactions,
            'salaryHistory': user.global_data.salary_history,
            'monthlySalary': user.global_data.monthly_salary,
            'monthlySalaryStartDate': user.global_data.monthly_salary_start_date.isoformat() if user.global_data.monthly_salary_start_date else None,
            'initializationComplete': user.global_data.initialization_complete,
            'lockedYears': user.global_data.locked_years or [],
            'excludedPredictedYears': user.global_data.excluded_predicted_years or [],
            'maxPredictedYears': user.global_data.max_predicted_years,
            'userProfile': user.global_data.user_profile,
        }
    else:
        # Initialize with defaults
        default_global = get_default_global_data()
        global_data_obj = UserGlobalData(
            user_id=user.id,
            bank_accounts=default_global['bankAccounts'],
            investments=default_global['investments'],
            savings_goals=default_global['savingsGoals'],
            savings_projects=default_global['savingsProjects'],
            temporary_incomes=default_global['temporaryIncomes'],
            shared_expense_persons=default_global['sharedExpensePersons'],
            person_transactions=default_global['personTransactions'],
            salary_history=default_global['salaryHistory'],
            monthly_salary=default_global['monthlySalary'],
            monthly_salary_start_date=None,
            initialization_complete=default_global['initializationComplete'],
            locked_years=default_global['lockedYears'],
            excluded_predicted_years=default_global['excludedPredictedYears'],
            max_predicted_years=default_global['maxPredictedYears'],
            user_profile=None,
        )
        db.add(global_data_obj)
        db.commit()
        db.refresh(global_data_obj)
        
        global_data_dict = default_global
    
    return {
        'years': years,
        'datasets': datasets,
        'globalData': global_data_dict
    }


def save_user(db: Session, email: str, data: Dict[str, Any]) -> None:
    """Save user data to PostgreSQL - replaces save_user from utils.py"""
    user = get_or_create_user(db, email)
    
    # Update years
    current_years = {uy.year: uy for uy in db.query(UserYear).filter(UserYear.user_id == user.id).all()}
    new_years = set(data.get('years', []))
    existing_years = set(current_years.keys())
    
    # Add new years
    for year in new_years - existing_years:
        user_year = UserYear(user_id=user.id, year=year)
        db.add(user_year)
        db.flush()  # Get the ID
        
        # Initialize year data with defaults
        default_year_data = get_default_year_data()
        year_data = YearData(
            user_year_id=user_year.id,
            categories=default_year_data['categories'],
            expenses=default_year_data['expenses'],
            subs=default_year_data['subs'],
            annual_fixed_expenses=default_year_data['annualFixedExpenses'],
            monthly_salary=default_year_data['monthlySalary'],
            variable_monthly_incomes=default_year_data.get('variableMonthlyIncomes'),
            additional_monthly_incomes=default_year_data['additionalMonthlyIncomes'],
            monthly_income_sources=default_year_data.get('monthlyIncomeSources', []),
            current_savings=default_year_data['currentSavings'],
            savings_transactions=default_year_data['savingsTransactions'],
        )
        db.add(year_data)
    
    # Remove deleted years
    for year in existing_years - new_years:
        user_year = current_years[year]
        db.delete(user_year)
    
    # Update year data
    datasets = data.get('datasets', {})
    for year_str, year_data_dict in datasets.items():
        year = int(year_str)
        user_year = current_years.get(year) or db.query(UserYear).filter(
            UserYear.user_id == user.id,
            UserYear.year == year
        ).first()
        
        if not user_year:
            continue
        
        year_data = user_year.year_data
        if not year_data:
            year_data = YearData(user_year_id=user_year.id)
            db.add(year_data)
        
        year_data.categories = year_data_dict.get('categories', [])
        year_data.expenses = year_data_dict.get('expenses', [])
        year_data.subs = year_data_dict.get('subs', [])
        year_data.annual_fixed_expenses = year_data_dict.get('annualFixedExpenses', [])
        year_data.monthly_salary = year_data_dict.get('monthlySalary', 0.0)
        year_data.variable_monthly_incomes = year_data_dict.get('variableMonthlyIncomes')
        year_data.additional_monthly_incomes = year_data_dict.get('additionalMonthlyIncomes', [])
        year_data.monthly_income_sources = year_data_dict.get('monthlyIncomeSources', [])
        year_data.current_savings = year_data_dict.get('currentSavings', 0.0)
        year_data.savings_transactions = year_data_dict.get('savingsTransactions', [])
        year_data.updated_at = datetime.utcnow()
    
    # Update global data
    global_data_dict = data.get('globalData', {})
    if user.global_data:
        global_data = user.global_data
    else:
        global_data = UserGlobalData(user_id=user.id)
        db.add(global_data)
    
    global_data.bank_accounts = global_data_dict.get('bankAccounts', [])
    global_data.investments = global_data_dict.get('investments', [])
    global_data.savings_goals = global_data_dict.get('savingsGoals', [])
    global_data.savings_projects = global_data_dict.get('savingsProjects', [])
    global_data.temporary_incomes = global_data_dict.get('temporaryIncomes', [])
    global_data.shared_expense_persons = global_data_dict.get('sharedExpensePersons', [])
    global_data.person_transactions = global_data_dict.get('personTransactions', [])
    global_data.salary_history = global_data_dict.get('salaryHistory', [])
    global_data.monthly_salary = global_data_dict.get('monthlySalary', 0.0)
    
    if global_data_dict.get('monthlySalaryStartDate'):
        from dateutil.parser import parse
        global_data.monthly_salary_start_date = parse(global_data_dict['monthlySalaryStartDate'])
    else:
        global_data.monthly_salary_start_date = None
    
    global_data.initialization_complete = global_data_dict.get('initializationComplete', False)
    global_data.locked_years = global_data_dict.get('lockedYears', [])
    global_data.excluded_predicted_years = global_data_dict.get('excludedPredictedYears', [])
    global_data.max_predicted_years = global_data_dict.get('maxPredictedYears', 3)
    global_data.user_profile = global_data_dict.get('userProfile')
    global_data.updated_at = datetime.utcnow()
    
    user.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        print(f"✅ Données sauvegardées pour {email} dans PostgreSQL")
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la sauvegarde pour {email}: {e}")
        raise


def get_year_data(db: Session, email: str, year: int) -> Dict[str, Any]:
    """Get data for a specific year"""
    user = get_user_by_email(db, email)
    if not user:
        return get_default_year_data()
    
    user_year = db.query(UserYear).filter(
        UserYear.user_id == user.id,
        UserYear.year == year
    ).first()
    
    if not user_year or not user_year.year_data:
        return get_default_year_data()
    
    year_data = user_year.year_data
    return {
        'categories': year_data.categories,
        'expenses': year_data.expenses,
        'subs': year_data.subs,
        'annualFixedExpenses': year_data.annual_fixed_expenses,
        'monthlySalary': year_data.monthly_salary,
        'variableMonthlyIncomes': year_data.variable_monthly_incomes,
        'additionalMonthlyIncomes': year_data.additional_monthly_incomes,
        'monthlyIncomeSources': year_data.monthly_income_sources,
        'currentSavings': year_data.current_savings,
        'savingsTransactions': year_data.savings_transactions,
    }


def save_year_data(db: Session, email: str, year: int, year_data_dict: Dict[str, Any]) -> None:
    """Save data for a specific year"""
    user = get_or_create_user(db, email)
    
    user_year = db.query(UserYear).filter(
        UserYear.user_id == user.id,
        UserYear.year == year
    ).first()
    
    if not user_year:
        user_year = UserYear(user_id=user.id, year=year)
        db.add(user_year)
        db.flush()
    
    year_data = user_year.year_data
    if not year_data:
        year_data = YearData(user_year_id=user_year.id)
        db.add(year_data)
    
    year_data.categories = year_data_dict.get('categories', [])
    year_data.expenses = year_data_dict.get('expenses', [])
    year_data.subs = year_data_dict.get('subs', [])
    year_data.annual_fixed_expenses = year_data_dict.get('annualFixedExpenses', [])
    year_data.monthly_salary = year_data_dict.get('monthlySalary', 0.0)
    year_data.variable_monthly_incomes = year_data_dict.get('variableMonthlyIncomes')
    year_data.additional_monthly_incomes = year_data_dict.get('additionalMonthlyIncomes', [])
    year_data.monthly_income_sources = year_data_dict.get('monthlyIncomeSources', [])
    year_data.current_savings = year_data_dict.get('currentSavings', 0.0)
    year_data.savings_transactions = year_data_dict.get('savingsTransactions', [])
    year_data.updated_at = datetime.utcnow()
    
    db.commit()


def get_global_data(db: Session, email: str) -> Dict[str, Any]:
    """Get global data for a user"""
    user = get_user_by_email(db, email)
    if not user or not user.global_data:
        return get_default_global_data()
    
    global_data = user.global_data
    return {
        'bankAccounts': global_data.bank_accounts,
        'investments': global_data.investments,
        'savingsGoals': global_data.savings_goals,
        'savingsProjects': global_data.savings_projects,
        'temporaryIncomes': global_data.temporary_incomes,
        'sharedExpensePersons': global_data.shared_expense_persons,
        'personTransactions': global_data.person_transactions,
        'salaryHistory': global_data.salary_history,
        'monthlySalary': global_data.monthly_salary,
        'monthlySalaryStartDate': global_data.monthly_salary_start_date.isoformat() if global_data.monthly_salary_start_date else None,
        'initializationComplete': global_data.initialization_complete,
        'lockedYears': global_data.locked_years or [],
        'excludedPredictedYears': global_data.excluded_predicted_years or [],
        'maxPredictedYears': global_data.max_predicted_years,
        'userProfile': global_data.user_profile,
    }


def save_global_data(db: Session, email: str, global_data_dict: Dict[str, Any]) -> None:
    """Save global data for a user"""
    user = get_or_create_user(db, email)
    
    if user.global_data:
        global_data = user.global_data
    else:
        global_data = UserGlobalData(user_id=user.id)
        db.add(global_data)
    
    global_data.bank_accounts = global_data_dict.get('bankAccounts', [])
    global_data.investments = global_data_dict.get('investments', [])
    global_data.savings_goals = global_data_dict.get('savingsGoals', [])
    global_data.savings_projects = global_data_dict.get('savingsProjects', [])
    global_data.temporary_incomes = global_data_dict.get('temporaryIncomes', [])
    global_data.shared_expense_persons = global_data_dict.get('sharedExpensePersons', [])
    global_data.person_transactions = global_data_dict.get('personTransactions', [])
    global_data.salary_history = global_data_dict.get('salaryHistory', [])
    global_data.monthly_salary = global_data_dict.get('monthlySalary', 0.0)
    
    if global_data_dict.get('monthlySalaryStartDate'):
        from dateutil.parser import parse
        global_data.monthly_salary_start_date = parse(global_data_dict['monthlySalaryStartDate'])
    else:
        global_data.monthly_salary_start_date = None
    
    global_data.initialization_complete = global_data_dict.get('initializationComplete', False)
    global_data.locked_years = global_data_dict.get('lockedYears', [])
    global_data.excluded_predicted_years = global_data_dict.get('excludedPredictedYears', [])
    global_data.max_predicted_years = global_data_dict.get('maxPredictedYears', 3)
    global_data.user_profile = global_data_dict.get('userProfile')
    global_data.updated_at = datetime.utcnow()
    
    db.commit()

