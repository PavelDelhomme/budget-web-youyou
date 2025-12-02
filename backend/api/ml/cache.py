"""
Cache pour les modèles ML et prédictions
Améliore les performances en évitant de recalculer les prédictions
"""
import hashlib
import json
import pickle
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os


class MLCache:
    """
    Cache pour les modèles ML et leurs prédictions
    """
    
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl = timedelta(hours=24)  # Cache valide 24h par défaut
    
    def _get_cache_key(self, user_email: str, operation: str, params: Dict[str, Any]) -> str:
        """Générer une clé de cache unique"""
        cache_data = {
            'user': user_email,
            'operation': operation,
            'params': params
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(cache_string.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Obtenir le chemin du fichier de cache"""
        return self.cache_dir / f"{cache_key}.cache"
    
    def _get_metadata_path(self, cache_key: str) -> Path:
        """Obtenir le chemin des métadonnées de cache"""
        return self.cache_dir / f"{cache_key}.meta.json"
    
    def get(self, user_email: str, operation: str, params: Dict[str, Any], ttl: Optional[timedelta] = None) -> Optional[Any]:
        """
        Récupérer une valeur du cache
        
        Args:
            user_email: Email de l'utilisateur
            operation: Type d'opération ('prediction', 'training_scores', etc.)
            params: Paramètres de l'opération
            ttl: Durée de vie du cache (défaut: 24h)
            
        Returns:
            Valeur mise en cache ou None si inexistante ou expirée
        """
        cache_key = self._get_cache_key(user_email, operation, params)
        cache_path = self._get_cache_path(cache_key)
        metadata_path = self._get_metadata_path(cache_key)
        
        if not cache_path.exists() or not metadata_path.exists():
            return None
        
        try:
            # Vérifier l'expiration
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            cache_time = datetime.fromisoformat(metadata.get('created_at', ''))
            cache_ttl = timedelta(seconds=metadata.get('ttl_seconds', self.default_ttl.total_seconds()))
            
            if ttl:
                cache_ttl = ttl
            
            if datetime.now() - cache_time > cache_ttl:
                # Cache expiré, supprimer
                cache_path.unlink()
                metadata_path.unlink()
                return None
            
            # Charger depuis le cache
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
                
        except Exception as e:
            print(f"Erreur lors de la lecture du cache: {e}")
            # Supprimer le cache corrompu
            if cache_path.exists():
                cache_path.unlink()
            if metadata_path.exists():
                metadata_path.unlink()
            return None
    
    def set(self, user_email: str, operation: str, params: Dict[str, Any], value: Any, ttl: Optional[timedelta] = None):
        """
        Stocker une valeur dans le cache
        
        Args:
            user_email: Email de l'utilisateur
            operation: Type d'opération
            params: Paramètres de l'opération
            value: Valeur à mettre en cache
            ttl: Durée de vie du cache
        """
        cache_key = self._get_cache_key(user_email, operation, params)
        cache_path = self._get_cache_path(cache_key)
        metadata_path = self._get_metadata_path(cache_key)
        
        try:
            # Sauvegarder la valeur
            with open(cache_path, 'wb') as f:
                pickle.dump(value, f)
            
            # Sauvegarder les métadonnées
            ttl_seconds = (ttl or self.default_ttl).total_seconds()
            metadata = {
                'user_email': user_email,
                'operation': operation,
                'params': params,
                'created_at': datetime.now().isoformat(),
                'ttl_seconds': ttl_seconds
            }
            
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
                
        except Exception as e:
            print(f"Erreur lors de l'écriture du cache: {e}")
    
    def invalidate(self, user_email: str, operation: Optional[str] = None):
        """
        Invalider le cache pour un utilisateur
        
        Args:
            user_email: Email de l'utilisateur
            operation: Type d'opération à invalider (None pour tout invalider)
        """
        safe_email = user_email.replace('@', '_at_').replace('.', '_')
        
        for cache_file in self.cache_dir.glob('*.cache'):
            metadata_path = cache_file.with_suffix('.meta.json')
            
            if not metadata_path.exists():
                continue
            
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                if metadata.get('user_email') == user_email:
                    if operation is None or metadata.get('operation') == operation:
                        cache_file.unlink()
                        metadata_path.unlink()
                        
            except Exception:
                continue
    
    def cleanup_expired(self):
        """Nettoyer tous les caches expirés"""
        for cache_file in self.cache_dir.glob('*.cache'):
            metadata_path = cache_file.with_suffix('.meta.json')
            
            if not metadata_path.exists():
                cache_file.unlink()
                continue
            
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                cache_time = datetime.fromisoformat(metadata.get('created_at', ''))
                cache_ttl = timedelta(seconds=metadata.get('ttl_seconds', self.default_ttl.total_seconds()))
                
                if datetime.now() - cache_time > cache_ttl:
                    cache_file.unlink()
                    metadata_path.unlink()
                    
            except Exception:
                # Supprimer le cache corrompu
                cache_file.unlink()
                if metadata_path.exists():
                    metadata_path.unlink()


def create_ml_cache(cache_dir: Path) -> MLCache:
    """Créer une instance du cache ML"""
    return MLCache(cache_dir)

