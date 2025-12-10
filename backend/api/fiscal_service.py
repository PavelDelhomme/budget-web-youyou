"""
Service fiscal complet avec endpoints API
Intègre le suivi fiscal, les réglementations et la préparation des déclarations
"""
from flask import request, jsonify, session
from functools import wraps
from datetime import datetime
from typing import Dict, Any, Optional

from api.fiscal_tracking import (
    FiscalService, FiscalDeclarationManager, FiscalDeductionManager,
    FiscalCalendar, FiscalRegulationTracker
)
from api.fiscal_country_manager import CountryFiscalManager
from api.government_fiscal_regulations import GovernmentFiscalRegulationsService
from api.database import get_db
from api.db_service import load_user


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_fiscal_routes(app):
    """Register fiscal management API routes"""
    
    @app.route('/api/fiscal/declarations', methods=['GET'])
    @require_auth
    def list_declarations():
        """List all fiscal declarations for the user"""
        user_email = session['user_email']
        
        try:
            manager = FiscalDeclarationManager(user_email)
            declarations = manager.list_declarations()
            
            # Convert to dict for JSON serialization
            declarations_dict = []
            for decl in declarations:
                decl_dict = {
                    'year': decl.year,
                    'status': decl.status,
                    'submission_date': decl.submission_date,
                    'validation_date': decl.validation_date,
                    'tax_amount': decl.tax_amount,
                    'refund_amount': decl.refund_amount,
                    'net_tax_amount': decl.net_tax_amount,
                    'rfr': decl.rfr,
                    'taxable_income': decl.taxable_income,
                    'deductions': [
                        {
                            'id': d.id,
                            'name': d.name,
                            'type': d.type,
                            'amount': d.amount,
                            'category': d.category,
                            'status': d.status
                        }
                        for d in decl.deductions
                    ]
                }
                declarations_dict.append(decl_dict)
            
            return jsonify({
                'success': True,
                'declarations': declarations_dict
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la récupération: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/declaration/<int:year>', methods=['GET'])
    @require_auth
    def get_declaration(year: int):
        """Get a specific fiscal declaration"""
        user_email = session['user_email']
        
        try:
            manager = FiscalDeclarationManager(user_email)
            declaration = manager.load_declaration(year)
            
            if not declaration:
                return jsonify({
                    'error': f'Déclaration {year} non trouvée'
                }), 404
            
            decl_dict = {
                'year': declaration.year,
                'status': declaration.status,
                'submission_date': declaration.submission_date,
                'validation_date': declaration.validation_date,
                'tax_amount': declaration.tax_amount,
                'refund_amount': declaration.refund_amount,
                'net_tax_amount': declaration.net_tax_amount,
                'rfr': declaration.rfr,
                'taxable_income': declaration.taxable_income,
                'deductions': [
                    {
                        'id': d.id,
                        'name': d.name,
                        'type': d.type,
                        'amount': d.amount,
                        'category': d.category,
                        'description': d.description,
                        'status': d.status,
                        'documentation_url': d.documentation_url,
                        'receipt_path': d.receipt_path
                    }
                    for d in decl.deductions
                ],
                'notes': declaration.notes,
                'documents': declaration.documents
            }
            
            return jsonify({
                'success': True,
                'declaration': decl_dict
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/declaration/prepare', methods=['POST'])
    @require_auth
    def prepare_declaration():
        """Prepare a fiscal declaration from budget data"""
        user_email = session['user_email']
        data = request.get_json() or {}
        
        year = data.get('year', datetime.now().year)
        annual_income = data.get('annual_income', 0)
        situation = data.get('situation', {})
        deductions = data.get('deductions', [])
        
        if annual_income <= 0:
            return jsonify({
                'error': 'Revenu annuel requis'
            }), 400
        
        try:
            service = FiscalService(user_email)
            declaration = service.prepare_declaration_from_budget(
                year=year,
                annual_income=annual_income,
                situation=situation,
                deductions=deductions
            )
            
            # Sauvegarder la déclaration
            service.declaration_manager.save_declaration(declaration)
            
            # Convertir en dict pour la réponse
            decl_dict = {
                'year': declaration.year,
                'status': declaration.status,
                'tax_amount': declaration.tax_amount,
                'refund_amount': declaration.refund_amount,
                'net_tax_amount': declaration.net_tax_amount,
                'rfr': declaration.rfr,
                'taxable_income': declaration.taxable_income,
                'deductions': [
                    {
                        'id': d.id,
                        'name': d.name,
                        'type': d.type,
                        'amount': d.amount,
                        'category': d.category
                    }
                    for d in declaration.deductions
                ]
            }
            
            return jsonify({
                'success': True,
                'declaration': decl_dict,
                'message': f'Déclaration {year} préparée avec succès'
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur lors de la préparation: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/calendar/<int:year>', methods=['GET'])
    @require_auth
    def get_fiscal_calendar(year: int):
        """Get fiscal calendar for a year, with live data from government websites"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            global_data = user_data.get('globalData', {})
            user_profile = global_data.get('userProfile', {})
            geographic_location = user_profile.get('geographic_location', {})
            country_code = geographic_location.get('country', 'FR')  # Default to FR
            
            try:
            # Utiliser le service de réglementations gouvernementales pour récupérer les dates en temps réel
            gov_service = GovernmentFiscalRegulationsService()
            live_dates = gov_service.fetch_live_calendar_dates(year)
            
            # Use country-specific calendar if available
            country_manager = CountryFiscalManager()
            country_calendar = country_manager.get_fiscal_calendar(country_code, year)
            
            # Merge with default calendar
            calendar = FiscalCalendar(year)
            default_dates = calendar.important_dates
            
            # Combiner les dates : priorités aux dates en temps réel, puis country-specific, puis défaut
            all_dates = {}
            for date_info in default_dates:
                key = date_info['date']
                all_dates[key] = date_info
            for date_info in country_calendar:
                key = date_info['date']
                all_dates[key] = date_info  # Override if exists
            for date_info in live_dates:
                key = date_info['date']
                all_dates[key] = date_info  # Highest priority - override if exists
            
            combined_dates = sorted(all_dates.values(), key=lambda x: x['date'])
            
            # Get fiscal info for country
            fiscal_info = country_manager.get_tax_info(country_code)
            
                return jsonify({
                    'success': True,
                    'year': year,
                    'country': country_code,
                    'important_dates': combined_dates,
                    'upcoming_deadlines': calendar.get_upcoming_deadlines(days_ahead=60),
                    'next_deadline': calendar.get_next_deadline(),
                    'fiscal_info': fiscal_info,
                    'source': 'live_government_data',
                    'last_update': datetime.now().isoformat()
                })
            except Exception as e:
                return jsonify({
                    'error': f'Erreur: {str(e)}'
                }), 500
        finally:
            db.close()
    
    @app.route('/api/fiscal/regulations', methods=['GET'])
    @require_auth
    def get_regulations():
        """Get applicable fiscal regulations from live government sources"""
        year = request.args.get('year', type=int) or datetime.now().year
        category = request.args.get('category')
        
        try:
            # Utiliser le service de réglementations gouvernementales
            gov_service = GovernmentFiscalRegulationsService()
            regulations_data = gov_service.get_fiscal_regulations(year, use_cache=True)
            
            # Vérifier que des données ont été récupérées
            if not regulations_data or len(regulations_data) == 0:
                # Essayer sans cache si le cache est vide
                regulations_data = gov_service.get_fiscal_regulations(year, use_cache=False)
            
            # Filtrer par catégorie si demandé
            if category:
                regulations_data = [r for r in regulations_data if r.get('category') == category]
            
            response_data = {
                'success': True,
                'year': year,
                'regulations': regulations_data or [],
                'total_count': len(regulations_data) if regulations_data else 0,
                'source': 'live_government_data',
                'last_update': datetime.now().isoformat()
            }
            # Ne pas inclure category si None/null (aucun filtre)
            if category:
                response_data['category'] = category
            return jsonify(response_data)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ Erreur dans get_regulations pour {year}: {str(e)}")
            print(error_trace)
            return jsonify({
                'success': False,
                'error': f'Erreur: {str(e)}',
                'year': year,
                'regulations': []
            }), 500
    
    @app.route('/api/fiscal/deductions/available', methods=['GET'])
    @require_auth
    def get_available_deductions():
        """Get available fiscal deductions and credits from official government sources"""
        category = request.args.get('category')
        year = request.args.get('year', type=int) or datetime.now().year
        
        try:
            # Utiliser le service de réglementations gouvernementales
            gov_service = GovernmentFiscalRegulationsService()
            deductions = gov_service.get_all_available_deductions(year)
            
            # Filtrer par catégorie si demandé
            if category:
                deductions = [d for d in deductions if d.get('category') == category]
            
            return jsonify({
                'success': True,
                'deductions': deductions,
                'category': category,
                'year': year,
                'total_count': len(deductions),
                'source': 'live_government_data',
                'last_update': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/declaration/<int:year>/export', methods=['GET'])
    @require_auth
    def export_declaration(year: int):
        """Export declaration summary"""
        user_email = session['user_email']
        format_type = request.args.get('format', 'text')  # 'text', 'json', 'csv'
        
        try:
            manager = FiscalDeclarationManager(user_email)
            declaration = manager.load_declaration(year)
            
            if not declaration:
                return jsonify({
                    'error': f'Déclaration {year} non trouvée'
                }), 404
            
            service = FiscalService(user_email)
            
            if format_type == 'text':
                summary = service.export_declaration_summary(declaration)
                return jsonify({
                    'success': True,
                    'format': 'text',
                    'content': summary
                })
            elif format_type == 'json':
                decl_dict = {
                    'year': declaration.year,
                    'status': declaration.status,
                    'tax_amount': declaration.tax_amount,
                    'refund_amount': declaration.refund_amount,
                    'net_tax_amount': declaration.net_tax_amount,
                    'rfr': declaration.rfr,
                    'taxable_income': declaration.taxable_income,
                    'deductions': [
                        {
                            'id': d.id,
                            'name': d.name,
                            'type': d.type,
                            'amount': d.amount,
                            'category': d.category
                        }
                        for d in declaration.deductions
                    ]
                }
                return jsonify({
                    'success': True,
                    'format': 'json',
                    'declaration': decl_dict
                })
            else:
                return jsonify({
                    'error': f'Format non supporté: {format_type}'
                }), 400
                
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/payroll-summary/<int:year>', methods=['GET'])
    @require_auth
    def get_payroll_summary(year: int):
        """Get summary of payroll slips for a year to prepare tax declaration"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            global_data = user_data.get('globalData', {})
            payroll_slips = global_data.get('payrollSlips', [])
            
            try:
                # Filtrer les fiches de paie pour l'année
                year_slips = [slip for slip in payroll_slips if slip.get('year') == year]
                
                # Calculer les totaux
                total_gross = sum(slip.get('grossSalary', 0) for slip in year_slips)
                total_net = sum(slip.get('netSalary', 0) for slip in year_slips)
                total_contributions = sum(slip.get('socialContributions', 0) for slip in year_slips)
                total_tax_withheld = sum(slip.get('incomeTaxWithheld', 0) for slip in year_slips)
                
                # Groupement par employeur
                by_employer = {}
                for slip in year_slips:
                    employer = slip.get('employer', 'Inconnu')
                    if employer not in by_employer:
                        by_employer[employer] = {
                            'count': 0,
                            'total_gross': 0,
                            'total_net': 0,
                            'contract_type': slip.get('contractType', 'Unknown')
                        }
                    by_employer[employer]['count'] += 1
                    by_employer[employer]['total_gross'] += slip.get('grossSalary', 0)
                    by_employer[employer]['total_net'] += slip.get('netSalary', 0)
                
                return jsonify({
                'success': True,
                'year': year,
                'summary': {
                    'total_slips': len(year_slips),
                    'total_gross_salary': total_gross,
                    'total_net_salary': total_net,
                    'total_social_contributions': total_contributions,
                    'total_tax_withheld': total_tax_withheld,
                    'by_employer': by_employer
                },
                'slips': year_slips
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
