"""
Système de monitoring et métriques de performance
"""
import time
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
from functools import wraps


class MetricsCollector:
    """
    Collecteur de métriques de performance
    """
    
    def __init__(self, metrics_dir: Path):
        self.metrics_dir = metrics_dir
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        
        # Métriques en mémoire pour performance
        self.request_times = defaultdict(deque)
        self.error_counts = defaultdict(int)
        self.success_counts = defaultdict(int)
        
        # Limite de taille pour éviter la consommation mémoire excessive
        self.max_entries = 1000
    
    def record_request(self, endpoint: str, method: str, duration: float, status_code: int):
        """
        Enregistrer une requête
        
        Args:
            endpoint: Endpoint appelé
            method: Méthode HTTP
            duration: Durée en secondes
            status_code: Code de statut HTTP
        """
        key = f"{method} {endpoint}"
        
        # Enregistrer le temps
        if len(self.request_times[key]) >= self.max_entries:
            self.request_times[key].popleft()
        self.request_times[key].append(duration)
        
        # Enregistrer le succès/échec
        if 200 <= status_code < 400:
            self.success_counts[key] += 1
        else:
            self.error_counts[key] += 1
    
    def get_metrics(self, endpoint: Optional[str] = None, method: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtenir les métriques
        
        Args:
            endpoint: Filtrer par endpoint
            method: Filtrer par méthode
            
        Returns:
            Dictionnaire avec les métriques
        """
        metrics = {}
        
        for key, times in self.request_times.items():
            method_part, endpoint_part = key.split(' ', 1)
            
            if method and method_part != method:
                continue
            if endpoint and endpoint_part != endpoint:
                continue
            
            if not times:
                continue
            
            times_list = list(times)
            metrics[key] = {
                'count': len(times_list),
                'avg_duration': sum(times_list) / len(times_list),
                'min_duration': min(times_list),
                'max_duration': max(times_list),
                'p95_duration': sorted(times_list)[int(len(times_list) * 0.95)] if len(times_list) > 20 else max(times_list),
                'success_count': self.success_counts.get(key, 0),
                'error_count': self.error_counts.get(key, 0),
                'success_rate': self.success_counts.get(key, 0) / (self.success_counts.get(key, 0) + self.error_counts.get(key, 0) + 1) * 100
            }
        
        return metrics
    
    def save_metrics(self):
        """Sauvegarder les métriques dans un fichier"""
        timestamp = datetime.now().strftime('%Y%m%d')
        metrics_file = self.metrics_dir / f"metrics_{timestamp}.json"
        
        metrics_data = {
            'timestamp': datetime.now().isoformat(),
            'metrics': self.get_metrics()
        }
        
        try:
            with open(metrics_file, 'w', encoding='utf-8') as f:
                json.dump(metrics_data, f, indent=2)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde des métriques: {e}")
    
    def cleanup_old_metrics(self, days_to_keep: int = 30):
        """Nettoyer les anciennes métriques"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        for metrics_file in self.metrics_dir.glob('metrics_*.json'):
            try:
                file_date = datetime.fromisoformat(metrics_file.stem.split('_', 1)[1])
                if file_date < cutoff_date:
                    metrics_file.unlink()
            except:
                # Si on ne peut pas parser la date, supprimer après 30 jours de modification
                if datetime.fromtimestamp(metrics_file.stat().st_mtime) < cutoff_date:
                    metrics_file.unlink()


def create_metrics_collector(metrics_dir: Path) -> MetricsCollector:
    """Créer une instance du collecteur de métriques"""
    return MetricsCollector(metrics_dir)


def monitor_endpoint(metrics_collector: MetricsCollector):
    """
    Decorator pour monitorer un endpoint Flask
    
    Usage:
        @app.route('/api/example')
        @monitor_endpoint(metrics_collector)
        def example():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            endpoint = request.endpoint or request.path
            method = request.method
            
            try:
                response = f(*args, **kwargs)
                
                # Obtenir le code de statut
                if hasattr(response, 'status_code'):
                    status_code = response.status_code
                elif isinstance(response, tuple):
                    status_code = response[1] if len(response) > 1 else 200
                else:
                    status_code = 200
                
                duration = time.time() - start_time
                metrics_collector.record_request(endpoint, method, duration, status_code)
                
                return response
            except Exception as e:
                duration = time.time() - start_time
                metrics_collector.record_request(endpoint, method, duration, 500)
                raise
        
        return decorated_function
    return decorator

