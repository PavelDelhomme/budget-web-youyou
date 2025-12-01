"""
Security utilities for data validation and sanitization
"""
import re
from datetime import datetime
from typing import Any, Optional, List, Dict
from decimal import Decimal, InvalidOperation


# Constants for validation
MAX_AMOUNT = 10_000_000_000  # 10 billions
MIN_AMOUNT = -10_000_000_000
MAX_YEAR = 2100
MIN_YEAR = 1900
MAX_STRING_LENGTH = 500
MAX_LIST_LENGTH = 10000


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    email = email.strip().lower()
    email_regex = r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    return bool(re.match(email_regex, email)) and len(email) <= 320


def sanitize_email(email: str) -> Optional[str]:
    """Sanitize and validate email"""
    if not email or not isinstance(email, str):
        return None
    email = email.strip().lower()
    if validate_email(email):
        return email
    return None


def validate_amount(amount: Any) -> Optional[float]:
    """Validate and sanitize amount"""
    if amount is None:
        return None
    
    # Convert to float if possible
    try:
        if isinstance(amount, str):
            # Replace comma with dot for European format
            amount = amount.replace(',', '.').strip()
        amount_float = float(amount)
        
        # Check range
        if amount_float < MIN_AMOUNT or amount_float > MAX_AMOUNT:
            return None
            
        # Round to 2 decimal places
        return round(amount_float, 2)
    except (ValueError, TypeError, InvalidOperation):
        return None


def validate_year(year: Any) -> Optional[int]:
    """Validate year"""
    try:
        if isinstance(year, str):
            year = int(year.strip())
        elif not isinstance(year, int):
            return None
            
        if MIN_YEAR <= year <= MAX_YEAR:
            return year
        return None
    except (ValueError, TypeError):
        return None


def validate_month(month: Any) -> Optional[int]:
    """Validate month (1-12)"""
    try:
        if isinstance(month, str):
            month = int(month.strip())
        elif not isinstance(month, int):
            return None
            
        if 1 <= month <= 12:
            return month
        return None
    except (ValueError, TypeError):
        return None


def validate_string(value: Any, max_length: int = MAX_STRING_LENGTH, allow_empty: bool = False) -> Optional[str]:
    """Validate and sanitize string"""
    if value is None:
        return None if not allow_empty else ""
    
    if not isinstance(value, str):
        value = str(value)
    
    value = value.strip()
    
    if not value and not allow_empty:
        return None
        
    if len(value) > max_length:
        value = value[:max_length]
    
    return value


def validate_id(value: Any) -> Optional[str]:
    """Validate ID (alphanumeric, dash, underscore)"""
    if not value or not isinstance(value, str):
        return None
    
    value = value.strip()
    if not value or len(value) > 100:
        return None
    
    # Only allow alphanumeric, dash, underscore
    if not re.match(r'^[a-zA-Z0-9_-]+$', value):
        return None
        
    return value


def validate_date(date_str: Any) -> Optional[str]:
    """Validate ISO date format (YYYY-MM-DD)"""
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # Check format
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return None
    
    # Try to parse
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except ValueError:
        return None


def validate_category(category: Any) -> Optional[Dict]:
    """Validate category structure"""
    if not isinstance(category, dict):
        return None
    
    category_id = validate_id(category.get('id'))
    if not category_id:
        return None
    
    name = validate_string(category.get('name'), max_length=100)
    if not name:
        return None
    
    target = validate_amount(category.get('target'))
    if target is None:
        target = 0
    
    # Validate monthlyTargets if present
    monthly_targets = category.get('monthlyTargets')
    validated_monthly_targets = None
    if monthly_targets is not None:
        if isinstance(monthly_targets, list) and len(monthly_targets) == 12:
            validated_targets = []
            for target in monthly_targets:
                validated = validate_amount(target)
                validated_targets.append(validated if validated is not None else 0)
            validated_monthly_targets = validated_targets
    
    return {
        'id': category_id,
        'name': name,
        'target': target,
        'monthlyTargets': validated_monthly_targets
    }


def validate_expense(expense: Any) -> Optional[Dict]:
    """Validate expense structure"""
    if not isinstance(expense, dict):
        return None
    
    expense_id = validate_id(expense.get('id'))
    if not expense_id:
        return None
    
    amount = validate_amount(expense.get('amount'))
    if amount is None:
        return None
    
    date = validate_date(expense.get('date'))
    if not date:
        return None
    
    category_id = validate_id(expense.get('categoryId'))
    if not category_id:
        return None
    
    # Optional fields
    note = validate_string(expense.get('note'), max_length=500, allow_empty=True) or ""
    
    # Validate share if present
    share = None
    if 'share' in expense and expense['share']:
        share_data = expense['share']
        if isinstance(share_data, dict):
            share_amount = validate_amount(share_data.get('yourAmount'))
            if share_amount is not None:
                share = {'yourAmount': share_amount}
    
    return {
        'id': expense_id,
        'amount': amount,
        'date': date,
        'categoryId': category_id,
        'note': note,
        'share': share
    }


def validate_subscription(sub: Any) -> Optional[Dict]:
    """Validate subscription structure"""
    if not isinstance(sub, dict):
        return None
    
    sub_id = validate_id(sub.get('id'))
    if not sub_id:
        return None
    
    name = validate_string(sub.get('name'), max_length=200)
    if not name:
        return None
    
    monthly = validate_amount(sub.get('monthly'))
    if monthly is None or monthly < 0:
        return None
    
    start_month = validate_month(sub.get('startMonth'))
    if start_month is None:
        return None
    
    end_month = validate_month(sub.get('endMonth'))
    if end_month is None:
        end_month = 12
    
    ongoing = sub.get('ongoing', False)
    if not isinstance(ongoing, bool):
        ongoing = False
    
    account_id = validate_id(sub.get('accountId')) if sub.get('accountId') else None
    
    return {
        'id': sub_id,
        'name': name,
        'monthly': monthly,
        'startMonth': start_month,
        'endMonth': end_month,
        'ongoing': ongoing,
        'accountId': account_id
    }


def validate_list(items: Any, validator_func, max_items: int = MAX_LIST_LENGTH) -> Optional[List]:
    """Validate a list of items using a validator function"""
    if not isinstance(items, list):
        return None
    
    if len(items) > max_items:
        return None
    
    validated_items = []
    for item in items:
        validated = validator_func(item)
        if validated is not None:
            validated_items.append(validated)
    
    return validated_items


def validate_year_data(data: Any) -> Optional[Dict]:
    """Validate complete year data structure"""
    if not isinstance(data, dict):
        return None
    
    validated_data = {}
    
    # Categories
    categories = data.get('categories', [])
    validated_categories = validate_list(categories, validate_category, max_items=100)
    if validated_categories is not None:
        validated_data['categories'] = validated_categories
    else:
        validated_data['categories'] = []
    
    # Expenses
    expenses = data.get('expenses', [])
    validated_expenses = validate_list(expenses, validate_expense, max_items=10000)
    if validated_expenses is not None:
        validated_data['expenses'] = validated_expenses
    else:
        validated_data['expenses'] = []
    
    # Subscriptions
    subs = data.get('subs', [])
    validated_subs = validate_list(subs, validate_subscription, max_items=100)
    if validated_subs is not None:
        validated_data['subs'] = validated_subs
    else:
        validated_data['subs'] = []
    
    # Annual fixed expenses
    annual_fixed = data.get('annualFixedExpenses', [])
    validated_annual = validate_list(annual_fixed, validate_expense, max_items=100)
    if validated_annual is not None:
        validated_data['annualFixedExpenses'] = validated_annual
    else:
        validated_data['annualFixedExpenses'] = []
    
    # Monthly salary
    monthly_salary = validate_amount(data.get('monthlySalary'))
    validated_data['monthlySalary'] = monthly_salary if monthly_salary is not None else 0
    
    # Current savings
    current_savings = validate_amount(data.get('currentSavings'))
    validated_data['currentSavings'] = current_savings if current_savings is not None else 0
    
    # Variable monthly incomes (array of 12 numbers)
    variable_incomes = data.get('variableMonthlyIncomes')
    if variable_incomes is not None:
        if isinstance(variable_incomes, list) and len(variable_incomes) == 12:
            validated_incomes = []
            for income in variable_incomes:
                validated = validate_amount(income)
                validated_incomes.append(validated if validated is not None else 0)
            validated_data['variableMonthlyIncomes'] = validated_incomes
    
    # Additional monthly incomes (list)
    additional_incomes = data.get('additionalMonthlyIncomes', [])
    if isinstance(additional_incomes, list) and len(additional_incomes) <= 100:
        validated_additional = []
        for inc in additional_incomes:
            if isinstance(inc, dict):
                validated_inc = {
                    'month': validate_month(inc.get('month')) or 1,
                    'amount': validate_amount(inc.get('amount')) or 0
                }
                validated_additional.append(validated_inc)
        validated_data['additionalMonthlyIncomes'] = validated_additional
    
    # Savings transactions (list)
    savings_transactions = data.get('savingsTransactions', [])
    if isinstance(savings_transactions, list) and len(savings_transactions) <= 1000:
        validated_transactions = []
        for trans in savings_transactions:
            if isinstance(trans, dict):
                trans_id = validate_id(trans.get('id'))
                if trans_id:
                    validated_trans = {
                        'id': trans_id,
                        'amount': validate_amount(trans.get('amount')) or 0,
                        'date': validate_date(trans.get('date')) or datetime.now().strftime('%Y-%m-%d'),
                        'note': validate_string(trans.get('note'), max_length=500, allow_empty=True) or ""
                    }
                    validated_transactions.append(validated_trans)
        validated_data['savingsTransactions'] = validated_transactions
    
    return validated_data

