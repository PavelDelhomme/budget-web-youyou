"""
Routes API pour le service de backup
"""
from flask import request, jsonify, session
from pathlib import Path
from api.backup_service import create_backup_service
from api.utils import DATA_DIR


def require_auth(f):
    """Decorator to require authentication"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function


def register_backup_routes(app):
    """Register backup API routes"""
    
    DATA_DIR = BASE_DIR / 'data'
    backup_service = create_backup_service(DATA_DIR)
    
    @app.route('/api/backup/create', methods=['POST'])
    @require_auth
    def create_backup():
        """Créer une sauvegarde des données utilisateur"""
        user_email = session['user_email']
        data = request.get_json() or {}
        backup_type = data.get('type', 'daily')  # daily, weekly, monthly
        
        backup_path = backup_service.create_backup(user_email, backup_type)
        
        if backup_path:
            return jsonify({
                'success': True,
                'message': 'Sauvegarde créée avec succès',
                'backup_path': str(backup_path),
                'type': backup_type
            })
        else:
            return jsonify({
                'error': 'Impossible de créer la sauvegarde'
            }), 500
    
    @app.route('/api/backup/list', methods=['GET'])
    @require_auth
    def list_backups():
        """Lister les sauvegardes disponibles"""
        user_email = session['user_email']
        backup_type = request.args.get('type')  # daily, weekly, monthly, ou None pour tous
        
        backups = backup_service.list_backups(user_email, backup_type)
        
        return jsonify({
            'success': True,
            'backups': backups,
            'count': len(backups)
        })
    
    @app.route('/api/backup/restore', methods=['POST'])
    @require_auth
    def restore_backup():
        """Restaurer une sauvegarde"""
        user_email = session['user_email']
        data = request.get_json() or {}
        backup_path = data.get('backup_path')
        
        if not backup_path:
            return jsonify({'error': 'Chemin de sauvegarde requis'}), 400
        
        from pathlib import Path
        backup_file = Path(backup_path)
        
        if not backup_file.exists():
            return jsonify({'error': 'Fichier de sauvegarde introuvable'}), 404
        
        success = backup_service.restore_backup(backup_file, user_email)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Sauvegarde restaurée avec succès'
            })
        else:
            return jsonify({
                'error': 'Impossible de restaurer la sauvegarde'
            }), 500
    
    @app.route('/api/backup/cleanup', methods=['POST'])
    @require_auth
    def cleanup_backups():
        """Nettoyer les anciennes sauvegardes"""
        data = request.get_json() or {}
        days_to_keep = data.get('days_to_keep', 30)
        
        backup_service.cleanup_old_backups(days_to_keep)
        
        return jsonify({
            'success': True,
            'message': f'Anciennes sauvegardes supprimées (conservées: {days_to_keep} jours)'
        })

