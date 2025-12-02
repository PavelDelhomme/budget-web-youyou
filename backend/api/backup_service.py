"""
Système de sauvegarde automatique des données utilisateur
Backup et restauration des données
"""
import json
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import gzip
import os


class BackupService:
    """
    Service de sauvegarde et restauration des données utilisateur
    """
    
    def __init__(self, data_dir: Path, backup_dir: Path):
        self.data_dir = data_dir
        self.backup_dir = backup_dir
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Créer sous-répertoires
        (self.backup_dir / 'daily').mkdir(exist_ok=True)
        (self.backup_dir / 'weekly').mkdir(exist_ok=True)
        (self.backup_dir / 'monthly').mkdir(exist_ok=True)
    
    def create_backup(self, user_email: str, backup_type: str = 'daily') -> Optional[Path]:
        """
        Créer une sauvegarde des données utilisateur
        
        Args:
            user_email: Email de l'utilisateur
            backup_type: Type de backup ('daily', 'weekly', 'monthly')
            
        Returns:
            Chemin du fichier de backup créé ou None en cas d'erreur
        """
        try:
            # Chemin du fichier source
            safe_email = user_email.replace('@', '_at_').replace('.', '_')
            source_file = self.data_dir / f"{safe_email}.json"
            
            if not source_file.exists():
                return None
            
            # Nom du fichier de backup avec timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"{safe_email}_{timestamp}.json.gz"
            backup_path = self.backup_dir / backup_type / backup_filename
            
            # Créer la sauvegarde compressée
            with open(source_file, 'rb') as f_in:
                with gzip.open(backup_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Ajouter métadonnées
            metadata = {
                'user_email': user_email,
                'timestamp': timestamp,
                'backup_type': backup_type,
                'file_size': source_file.stat().st_size,
                'backup_size': backup_path.stat().st_size
            }
            
            metadata_path = backup_path.with_suffix('.meta.json')
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
            
            return backup_path
            
        except Exception as e:
            print(f"Erreur lors de la création du backup: {e}")
            return None
    
    def restore_backup(self, backup_path: Path, user_email: str) -> bool:
        """
        Restaurer une sauvegarde
        
        Args:
            backup_path: Chemin du fichier de backup
            user_email: Email de l'utilisateur
            
        Returns:
            True si succès, False sinon
        """
        try:
            safe_email = user_email.replace('@', '_at_').replace('.', '_')
            target_file = self.data_dir / f"{safe_email}.json"
            
            # Sauvegarder le fichier actuel avant restauration
            if target_file.exists():
                backup_current = target_file.with_suffix('.json.pre_restore')
                shutil.copy2(target_file, backup_current)
            
            # Décompresser et restaurer
            with gzip.open(backup_path, 'rb') as f_in:
                with open(target_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            return True
            
        except Exception as e:
            print(f"Erreur lors de la restauration: {e}")
            return False
    
    def list_backups(self, user_email: str, backup_type: Optional[str] = None) -> List[Dict]:
        """
        Lister les sauvegardes disponibles pour un utilisateur
        
        Args:
            user_email: Email de l'utilisateur
            backup_type: Type de backup à lister ('daily', 'weekly', 'monthly') ou None pour tous
            
        Returns:
            Liste des sauvegardes avec métadonnées
        """
        safe_email = user_email.replace('@', '_at_').replace('.', '_')
        backups = []
        
        types_to_check = [backup_type] if backup_type else ['daily', 'weekly', 'monthly']
        
        for backup_type_folder in types_to_check:
            backup_type_dir = self.backup_dir / backup_type_folder
            
            if not backup_type_dir.exists():
                continue
            
            for backup_file in backup_type_dir.glob(f"{safe_email}_*.json.gz"):
                metadata_path = backup_file.with_suffix('.meta.json')
                
                metadata = {}
                if metadata_path.exists():
                    try:
                        with open(metadata_path, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                    except:
                        pass
                
                # Ajouter infos du fichier
                stat = backup_file.stat()
                backups.append({
                    'path': str(backup_file),
                    'type': backup_type_folder,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    **metadata
                })
        
        # Trier par date (plus récent en premier)
        backups.sort(key=lambda x: x.get('created', ''), reverse=True)
        
        return backups
    
    def cleanup_old_backups(self, days_to_keep: int = 30):
        """
        Nettoyer les anciennes sauvegardes
        
        Args:
            days_to_keep: Nombre de jours à conserver
        """
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        for backup_type in ['daily', 'weekly', 'monthly']:
            backup_dir = self.backup_dir / backup_type
            
            if not backup_dir.exists():
                continue
            
            for backup_file in backup_dir.glob('*.json.gz'):
                if datetime.fromtimestamp(backup_file.stat().st_mtime) < cutoff_date:
                    # Supprimer le backup et ses métadonnées
                    backup_file.unlink()
                    metadata_path = backup_file.with_suffix('.meta.json')
                    if metadata_path.exists():
                        metadata_path.unlink()
    
    def auto_backup_all_users(self):
        """
        Créer une sauvegarde automatique pour tous les utilisateurs
        """
        if not self.data_dir.exists():
            return
        
        for json_file in self.data_dir.glob('*.json'):
            if json_file.name.endswith('.backup') or json_file.name.endswith('.pre_restore'):
                continue
            
            # Extraire l'email du nom de fichier
            safe_email = json_file.stem
            user_email = safe_email.replace('_at_', '@').replace('_', '.')
            
            # Créer backup quotidien
            self.create_backup(user_email, 'daily')


def create_backup_service(data_dir: Path) -> BackupService:
    """Créer une instance du service de backup"""
    backup_dir = data_dir.parent / 'backups'
    return BackupService(data_dir, backup_dir)

