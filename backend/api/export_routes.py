"""
Routes API pour l'export de données
"""
from flask import request, jsonify, session, Response
from datetime import datetime
from api.export_service import create_exporter
from api.database import get_db
from api.db_service import load_user
from datetime import datetime


def require_auth(f):
    """Decorator to require authentication"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_export_routes(app):
    """Register export API routes"""
    
    exporter = create_exporter()
    
    @app.route('/api/export/json', methods=['GET'])
    @require_auth
    def export_json():
        """Exporter toutes les données en JSON"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            global_data = user_data.get('globalData', {})
            
            json_data = exporter.export_json(user_data, global_data)
            
            return Response(
                json_data,
                mimetype='application/json',
                headers={
                    'Content-Disposition': f'attachment; filename=budget_export_{user_email.replace("@", "_")}_{datetime.now().strftime("%Y%m%d")}.json'
                }
            )
        finally:
            db.close()
    
    @app.route('/api/export/csv/budget', methods=['GET'])
    @require_auth
    def export_csv_budget():
        """Exporter le budget en CSV"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            year = request.args.get('year', type=int)
            
            csv_data = exporter.export_csv_budget(user_data.get('datasets', {}), year)
            
            filename = f'budget_export_{datetime.now().strftime("%Y%m%d")}.csv'
            if year:
                filename = f'budget_{year}_export_{datetime.now().strftime("%Y%m%d")}.csv'
            
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename={filename}'
                }
            )
        finally:
            db.close()
    
    @app.route('/api/export/csv/transactions', methods=['GET'])
    @require_auth
    def export_csv_transactions():
        """Exporter les transactions en CSV"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            global_data = user_data.get('globalData', {})
            
            csv_data = exporter.export_csv_transactions(global_data)
            
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=transactions_export_{datetime.now().strftime("%Y%m%d")}.csv'
                }
            )
        finally:
            db.close()
    
    @app.route('/api/export/summary', methods=['GET'])
    @require_auth
    def export_summary():
        """Exporter un résumé textuel"""
        user_email = session['user_email']
        db = next(get_db())
        try:
            user_data = load_user(db, user_email)
            global_data = user_data.get('globalData', {})
            
            summary = exporter.export_summary(user_data, global_data)
            
            return Response(
                summary,
                mimetype='text/plain',
                headers={
                    'Content-Disposition': f'attachment; filename=budget_summary_{datetime.now().strftime("%Y%m%d")}.txt'
                }
            )
        finally:
            db.close()

