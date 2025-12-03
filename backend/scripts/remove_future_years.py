#!/usr/bin/env python3
"""
Script pour supprimer les années futures (2026+) des données utilisateur
Ces années doivent être générées par l'IA, pas créées par défaut
"""
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.utils import DATA_DIR, get_user_file_path, save_user, sanitize_email


def remove_future_years(email: str = None):
    """Remove future years (2026+) from user data"""
    current_year = 2025  # Current year
    
    if email:
        # Remove from specific user
        file_path = get_user_file_path(email)
        if not file_path.exists():
            print(f"❌ Fichier utilisateur non trouvé: {file_path}")
            return False
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            original_years = data.get('years', [])
            
            # Remove future years (2026+)
            data['years'] = [y for y in original_years if y <= current_year]
            
            # Remove datasets for future years
            datasets = data.get('datasets', {})
            future_keys = [str(y) for y in range(2026, 2030)]
            for key in future_keys:
                if key in datasets:
                    del datasets[key]
            
            data['datasets'] = datasets
            
            save_user(email, data)
            
            removed_years = [y for y in original_years if y > current_year]
            if removed_years:
                print(f"✅ Années futures supprimées pour {email}: {removed_years}")
            else:
                print(f"ℹ️  Aucune année future trouvée pour {email}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la suppression pour {email}: {e}")
            return False
    else:
        # Remove from all users
        removed_count = 0
        for json_file in DATA_DIR.glob("*.json"):
            try:
                email_part = json_file.stem
                # Try to decode email (it's sanitized)
                print(f"📄 Traitement de {json_file.name}...")
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                original_years = data.get('years', [])
                
                # Remove future years (2026+)
                data['years'] = [y for y in original_years if y <= current_year]
                
                # Remove datasets for future years
                datasets = data.get('datasets', {})
                future_keys = [str(y) for y in range(2026, 2030)]
                removed_datasets = []
                for key in future_keys:
                    if key in datasets:
                        del datasets[key]
                        removed_datasets.append(key)
                
                data['datasets'] = datasets
                
                # Save back
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                    f.write('\n')
                
                removed_years = [y for y in original_years if y > current_year]
                if removed_years or removed_datasets:
                    print(f"  ✅ Supprimé: années {removed_years}, datasets {removed_datasets}")
                    removed_count += 1
                else:
                    print(f"  ℹ️  Aucune année future trouvée")
                    
            except Exception as e:
                print(f"  ❌ Erreur: {e}")
        
        print(f"\n✅ Traitement terminé. {removed_count} fichier(s) modifié(s).")
        return removed_count > 0


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Supprime les années futures (2026+) des données utilisateur")
    parser.add_argument("--email", "-e", help="Email de l'utilisateur (optionnel, sinon tous les utilisateurs)")
    
    args = parser.parse_args()
    
    if args.email:
        success = remove_future_years(args.email)
        sys.exit(0 if success else 1)
    else:
        print("🗑️  Suppression des années futures (2026+) pour tous les utilisateurs...")
        print("")
        remove_future_years()

