"""
Système de logs structurés
Logs au format JSON pour faciliter l'analyse
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from logging.handlers import RotatingFileHandler


class StructuredLogger:
    """
    Logger qui produit des logs structurés au format JSON
    """
    
    def __init__(self, name: str, log_dir: Path, max_bytes: int = 10 * 1024 * 1024, backup_count: int = 5):
        """
        Initialiser le logger structuré
        
        Args:
            name: Nom du logger
            log_dir: Répertoire pour les logs
            max_bytes: Taille max d'un fichier de log (défaut: 10MB)
            backup_count: Nombre de fichiers de backup à conserver
        """
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Créer le logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Éviter les handlers dupliqués
        if not self.logger.handlers:
            # Handler pour fichier avec rotation
            log_file = self.log_dir / f"{name}.json.log"
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_handler.setLevel(logging.INFO)
            
            # Formatter JSON
            file_handler.setFormatter(StructuredFormatter())
            
            self.logger.addHandler(file_handler)
    
    def log(self, level: str, message: str, **kwargs):
        """
        Logger un message structuré
        
        Args:
            level: Niveau de log (info, warning, error, debug)
            message: Message principal
            **kwargs: Données supplémentaires à inclure dans le log
        """
        log_method = getattr(self.logger, level.lower(), self.logger.info)
        log_method(message, extra={'structured_data': kwargs})
    
    def info(self, message: str, **kwargs):
        """Logger un message info"""
        self.log('info', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Logger un message warning"""
        self.log('warning', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Logger un message error"""
        self.log('error', message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Logger un message debug"""
        self.log('debug', message, **kwargs)


class StructuredFormatter(logging.Formatter):
    """
    Formatter qui produit des logs au format JSON
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Formatter un log en JSON"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Ajouter les données structurées si présentes
        if hasattr(record, 'structured_data'):
            log_data.update(record.structured_data)
        
        # Ajouter l'exception si présente
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


def create_structured_logger(name: str, log_dir: Path) -> StructuredLogger:
    """Créer un logger structuré"""
    return StructuredLogger(name, log_dir)

