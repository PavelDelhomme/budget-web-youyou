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
from api.utils import load_user


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
                    for d in declaration.deductions
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
        """Get fiscal calendar for a year"""
        try:
            calendar = FiscalCalendar(year)
            
            return jsonify({
                'success': True,
                'year': year,
                'important_dates': calendar.important_dates,
                'upcoming_deadlines': calendar.get_upcoming_deadlines(days_ahead=60),
                'next_deadline': calendar.get_next_deadline()
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/regulations', methods=['GET'])
    @require_auth
    def get_regulations():
        """Get applicable fiscal regulations"""
        year = request.args.get('year', type=int) or datetime.now().year
        category = request.args.get('category')
        
        try:
            tracker = FiscalRegulationTracker()
            regulations = tracker.get_applicable_regulations(year, category)
            
            regulations_dict = [
                {
                    'id': r.id,
                    'title': r.title,
                    'description': r.description,
                    'category': r.category,
                    'effective_date': r.effective_date,
                    'expiration_date': r.expiration_date,
                    'source': r.source,
                    'impact': r.impact,
                    'url': r.url
                }
                for r in regulations
            ]
            
            return jsonify({
                'success': True,
                'year': year,
                'regulations': regulations_dict,
                'last_update': tracker.last_update.isoformat() if tracker.last_update else None
            })
        except Exception as e:
            return jsonify({
                'error': f'Erreur: {str(e)}'
            }), 500
    
    @app.route('/api/fiscal/deductions/available', methods=['GET'])
    @require_auth
    def get_available_deductions():
        """Get available fiscal deductions and credits"""
        category = request.args.get('category')
        
        try:
            manager = FiscalDeductionManager()
            deductions = manager.get_available_deductions(category)
            
            return jsonify({
                'success': True,
                'deductions': deductions,
                'category': category
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

