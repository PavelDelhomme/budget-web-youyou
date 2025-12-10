#!/usr/bin/env python3
"""
Script de migration des données JSON vers PostgreSQL
"""
import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.database import init_db, get_db, get_or_create_user
from api.db_service import save_user
from api.utils import DATA_DIR

def migrate_all_json_files():
    """Migrate all JSON user files to PostgreSQL"""
    db = next(get_db())
    
    try:
        # Initialize database
        print("📊 Initialisation de la base de données PostgreSQL...")
        init_db()
        print("✅ Base de données initialisée")
        
        # Find all JSON user files
        json_files = list(DATA_DIR.glob("*.json"))
        # Exclude cache files
        json_files = [f for f in json_files if not f.name.startswith('fiscal_') and 'cache' not in str(f)]
        
        if not json_files:
            print("ℹ️  Aucun fichier JSON utilisateur trouvé")
            return
        
        print(f"📁 {len(json_files)} fichier(s) JSON trouvé(s)")
        
        migrated_count = 0
        error_count = 0
        
        for json_file in json_files:
            try:
                # Extract email from filename (reverse of sanitize_email)
                # filename is sanitized, we need to reverse it
                # Actually, we can't reverse it perfectly, so we'll store the filename as a note
                print(f"\n📄 Migration de {json_file.name}...")
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Try to find the email - check if there's an admin email or use filename
                # For now, we'll use the filename as the email (since it's sanitized)
                # In production, you might want to store email mapping separately
                email_from_file = json_file.stem.replace('_', '.').replace('at', '@')
                
                # For migration, we'll create a user with the sanitized email
                # You might need to manually map these
                print(f"   Email déduit: {email_from_file}")
                
                # Save to PostgreSQL
                save_user(db, email_from_file, data)
                migrated_count += 1
                print(f"   ✅ Migré avec succès")
                
            except Exception as e:
                error_count += 1
                print(f"   ❌ Erreur: {e}")
                import traceback
                traceback.print_exc()
        
        print(f"\n📊 Résumé:")
        print(f"   ✅ {migrated_count} fichier(s) migré(s)")
        print(f"   ❌ {error_count} erreur(s)")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == '__main__':
    migrate_all_json_files()

