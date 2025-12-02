"""
Routes API pour le monitoring de santé
"""
from flask import jsonify
from pathlib import Path
from api.health_service import create_health_monitor
from api.utils import DATA_DIR, BASE_DIR


def register_health_routes(app):
    """Register health monitoring API routes"""
    
    DATA_DIR = BASE_DIR / 'data'
    MODELS_DIR = BASE_DIR / 'data' / 'models'
    health_monitor = create_health_monitor(DATA_DIR)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check basique"""
        return jsonify({
            'status': 'healthy',
            'timestamp': __import__('datetime').datetime.now().isoformat()
        })
    
    @app.route('/api/health/detailed', methods=['GET'])
    def detailed_health():
        """Rapport de santé détaillé"""
        health_report = health_monitor.get_full_health(MODELS_DIR)
        status_code = 200 if health_report.get('status') == 'healthy' else 503
        return jsonify(health_report), status_code
    
    @app.route('/api/health/system', methods=['GET'])
    def system_health():
        """Santé du système"""
        return jsonify(health_monitor.get_system_health())
    
    @app.route('/api/health/data', methods=['GET'])
    def data_health():
        """Santé des données"""
        return jsonify(health_monitor.get_data_health())
    
    @app.route('/api/health/ml', methods=['GET'])
    def ml_health():
        """Santé des modèles ML"""
        return jsonify(health_monitor.get_ml_health(MODELS_DIR))

