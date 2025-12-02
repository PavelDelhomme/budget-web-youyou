"""
Service d'export de données utilisateur
Export JSON, CSV et autres formats
"""
import json
import csv
import io
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime


class DataExporter:
    """
    Service pour exporter les données utilisateur dans différents formats
    """
    
    def __init__(self):
        pass
    
    def export_json(self, user_data: Dict[str, Any], global_data: Dict[str, Any]) -> str:
        """
        Exporter toutes les données en JSON
        
        Args:
            user_data: Données utilisateur (years, datasets)
            global_data: Données globales
            
        Returns:
            JSON string avec toutes les données
        """
        export_data = {
            'export_date': datetime.now().isoformat(),
            'version': '1.0',
            'user_data': user_data,
            'global_data': global_data
        }
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)
    
    def export_csv_budget(self, datasets: Dict[str, Any], year: Optional[int] = None) -> str:
        """
        Exporter le budget d'une année en CSV
        
        Args:
            datasets: Dictionnaire des datasets par année
            year: Année à exporter (None pour toutes les années)
            
        Returns:
            CSV string
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Type', 'Catégorie/Description', 'Mois', 'Montant (€)', 'Année'])
        
        years_to_export = [year] if year else datasets.keys()
        
        for y in years_to_export:
            if y not in datasets:
                continue
            
            data = datasets[str(y)] if isinstance(y, int) else datasets.get(str(y), {})
            
            # Dépenses
            for expense in data.get('expenses', []):
                writer.writerow([
                    'Dépense',
                    expense.get('description', ''),
                    expense.get('month', ''),
                    expense.get('amount', 0),
                    y
                ])
            
            # Abonnements
            for sub in data.get('subs', []):
                months = range(sub.get('startMonth', 1), (sub.get('endMonth', 12) if not sub.get('ongoing', True) else 13))
                for month in months:
                    writer.writerow([
                        'Abonnement',
                        sub.get('name', ''),
                        month,
                        sub.get('monthly', 0),
                        y
                    ])
            
            # Dépenses fixes annuelles
            for fixed in data.get('annualFixedExpenses', []):
                writer.writerow([
                    'Dépense Fixe',
                    fixed.get('name', ''),
                    'Annuel',
                    fixed.get('amount', 0),
                    y
                ])
            
            # Revenus
            if data.get('monthlySalary', 0) > 0:
                for month in range(1, 13):
                    writer.writerow([
                        'Revenu',
                        'Salaire Mensuel',
                        month,
                        data.get('monthlySalary', 0),
                        y
                    ])
        
        return output.getvalue()
    
    def export_csv_transactions(self, global_data: Dict[str, Any]) -> str:
        """
        Exporter les transactions d'épargne en CSV
        
        Args:
            global_data: Données globales avec transactions
            
        Returns:
            CSV string
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Date', 'Type', 'Montant (€)', 'Description', 'Compte'])
        
        # Transactions d'épargne par année
        for year_data_key, year_data in global_data.get('datasets', {}).items():
            for transaction in year_data.get('savingsTransactions', []):
                writer.writerow([
                    transaction.get('date', ''),
                    transaction.get('type', ''),
                    transaction.get('amount', 0),
                    transaction.get('description', ''),
                    transaction.get('accountId', '')
                ])
        
        return output.getvalue()
    
    def export_summary(self, user_data: Dict[str, Any], global_data: Dict[str, Any]) -> str:
        """
        Exporter un résumé textuel des données
        
        Args:
            user_data: Données utilisateur
            global_data: Données globales
            
        Returns:
            Résumé textuel formaté
        """
        lines = []
        lines.append("=" * 60)
        lines.append("RÉSUMÉ BUDGET - Export du " + datetime.now().strftime("%d/%m/%Y %H:%M"))
        lines.append("=" * 60)
        lines.append("")
        
        # Années
        years = user_data.get('years', [])
        lines.append(f"Années gérées : {', '.join(map(str, years))}")
        lines.append("")
        
        # Comptes bancaires
        bank_accounts = global_data.get('bankAccounts', [])
        if bank_accounts:
            lines.append("COMPTES BANCAIRES :")
            total_balance = 0
            for account in bank_accounts:
                balance = account.get('currentBalance', 0)
                total_balance += balance
                lines.append(f"  - {account.get('name', '')}: {balance:,.2f} €")
            lines.append(f"  Total: {total_balance:,.2f} €")
            lines.append("")
        
        # Investissements
        investments = global_data.get('investments', [])
        if investments:
            lines.append("INVESTISSEMENTS :")
            total_investments = 0
            for inv in investments:
                value = inv.get('currentValue', 0)
                total_investments += value
                lines.append(f"  - {inv.get('name', '')}: {value:,.2f} €")
            lines.append(f"  Total: {total_investments:,.2f} €")
            lines.append("")
        
        # Objectifs d'épargne
        goals = global_data.get('savingsGoals', [])
        if goals:
            lines.append("OBJECTIFS D'ÉPARGNE :")
            for goal in goals:
                current = goal.get('currentAmount', 0)
                target = goal.get('targetAmount', 0)
                progress = (current / target * 100) if target > 0 else 0
                lines.append(f"  - {goal.get('name', '')}: {current:,.2f} € / {target:,.2f} € ({progress:.1f}%)")
            lines.append("")
        
        # Résumé par année
        datasets = user_data.get('datasets', {})
        for year in sorted(years):
            if str(year) not in datasets:
                continue
            
            data = datasets[str(year)]
            lines.append(f"ANNÉE {year} :")
            
            # Revenus annuels
            monthly_salary = data.get('monthlySalary', 0)
            annual_income = monthly_salary * 12
            if annual_income > 0:
                lines.append(f"  Revenus annuels: {annual_income:,.2f} €")
            
            # Dépenses totales
            expenses_total = sum(e.get('amount', 0) for e in data.get('expenses', []))
            subs_total = sum(s.get('monthly', 0) * 12 for s in data.get('subs', []))
            fixed_total = sum(f.get('amount', 0) for f in data.get('annualFixedExpenses', []))
            total_expenses = expenses_total + subs_total + fixed_total
            
            if total_expenses > 0:
                lines.append(f"  Dépenses totales: {total_expenses:,.2f} €")
            
            # Épargne
            current_savings = data.get('currentSavings', 0)
            if current_savings > 0:
                lines.append(f"  Épargne: {current_savings:,.2f} €")
            
            lines.append("")
        
        lines.append("=" * 60)
        
        return "\n".join(lines)


def create_exporter() -> DataExporter:
    """Créer une instance de l'exporteur"""
    return DataExporter()

