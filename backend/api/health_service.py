"""
Service de monitoring de santé de l'application
"""
import psutil
import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime


class HealthMonitor:
    """
    Monitoring de la santé de l'application
    """
    
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
    
    def get_system_health(self) -> Dict[str, Any]:
        """
        Obtenir la santé du système
        
        Returns:
            Dictionnaire avec les métriques de santé
        """
        try:
            # Utilisation CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Utilisation mémoire
            memory = psutil.virtual_memory()
            
            # Espace disque
            disk = psutil.disk_usage(self.data_dir.root if hasattr(self.data_dir, 'root') else '/')
            
            # Processus actuel
            process = psutil.Process(os.getpid())
            process_memory = process.memory_info()
            
            return {
                'status': 'healthy' if cpu_percent < 80 and memory.percent < 80 and disk.percent < 90 else 'degraded',
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': psutil.cpu_count()
                },
                'memory': {
                    'total_gb': memory.total / (1024**3),
                    'available_gb': memory.available / (1024**3),
                    'used_gb': memory.used / (1024**3),
                    'percent': memory.percent
                },
                'disk': {
                    'total_gb': disk.total / (1024**3),
                    'used_gb': disk.used / (1024**3),
                    'free_gb': disk.free / (1024**3),
                    'percent': disk.percent
                },
                'process': {
                    'memory_mb': process_memory.rss / (1024**2),
                    'cpu_percent': process.cpu_percent(interval=0.1),
                    'threads': process.num_threads()
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_data_health(self) -> Dict[str, Any]:
        """
        Obtenir la santé des données
        
        Returns:
            Dictionnaire avec les métriques des données
        """
        try:
            data_files = list(self.data_dir.glob('*.json'))
            total_size = sum(f.stat().st_size for f in data_files if f.is_file())
            
            # Compter les fichiers de backup
            backup_dir = self.data_dir.parent / 'backups'
            backup_files = []
            if backup_dir.exists():
                backup_files = list(backup_dir.rglob('*.json.gz'))
            
            return {
                'status': 'healthy',
                'data_files_count': len(data_files),
                'data_total_size_mb': total_size / (1024**2),
                'backups_count': len(backup_files),
                'data_dir': str(self.data_dir),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_ml_health(self, models_dir: Path) -> Dict[str, Any]:
        """
        Obtenir la santé des modèles ML
        
        Returns:
            Dictionnaire avec les métriques des modèles ML
        """
        try:
            model_files = list(models_dir.glob('*.pkl')) + list(models_dir.glob('*.h5'))
            total_size = sum(f.stat().st_size for f in model_files if f.is_file())
            
            return {
                'status': 'healthy',
                'models_count': len(model_files),
                'models_total_size_mb': total_size / (1024**2),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_full_health(self, models_dir: Path) -> Dict[str, Any]:
        """
        Obtenir un rapport de santé complet
        
        Returns:
            Dictionnaire complet avec toutes les métriques
        """
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'system': self.get_system_health(),
            'data': self.get_data_health(),
            'ml': self.get_ml_health(models_dir)
        }


def create_health_monitor(data_dir: Path) -> HealthMonitor:
    """Créer une instance du moniteur de santé"""
    return HealthMonitor(data_dir)

