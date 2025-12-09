"""
Service pour récupérer les statistiques INSEE sur les dépenses moyennes des ménages français
"""
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    BEAUTIFULSOUP_AVAILABLE = False


class INSEEStatisticsService:
    """Service pour récupérer les statistiques INSEE sur les dépenses des ménages"""
    
    BASE_URLS = {
        'insee': 'https://www.insee.fr',
        'data_gouv': 'https://www.data.gouv.fr',
    }
    
    CACHE_DURATION_DAYS = 30  # Cache les données pendant 30 jours
    
    def __init__(self):
        from api.utils import CACHE_DIR
        self.CACHE_DIR = CACHE_DIR
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_path(self, stat_type: str) -> Path:
        """Chemin du fichier de cache pour un type de statistique"""
        return self.CACHE_DIR / f'insee_statistics_{stat_type}.json'
    
    def _is_cache_valid(self, cache_path: Path) -> bool:
        """Vérifie si le cache est encore valide"""
        if not cache_path.exists():
            return False
        
        try:
            mod_time = datetime.fromtimestamp(cache_path.stat().st_mtime)
            age = datetime.now() - mod_time
            return age < timedelta(days=self.CACHE_DURATION_DAYS)
        except Exception:
            return False
    
    def _load_from_cache(self, stat_type: str) -> Optional[Dict[str, Any]]:
        """Charge les statistiques depuis le cache"""
        cache_path = self._get_cache_path(stat_type)
        if self._is_cache_valid(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return None
    
    def _save_to_cache(self, stat_type: str, data: Dict[str, Any]):
        """Sauvegarde les statistiques dans le cache"""
        cache_path = self._get_cache_path(stat_type)
        try:
            data['cached_at'] = datetime.now().isoformat()
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du cache: {e}")
    
    def _get_default_household_expenses(self) -> Dict[str, float]:
        """Retourne les dépenses moyennes par défaut basées sur les statistiques INSEE connues"""
        # Statistiques INSEE 2023 - Dépenses moyennes annuelles d'un ménage français
        # Source: INSEE - Enquête Budget de Famille
        return {
            'alimentation': {
                'annual': 4200,  # ~350€/mois
                'monthly': 350,
                'description': 'Dépenses alimentaires moyennes (hors restauration)'
            },
            'achats_loisirs': {
                'annual': 1800,  # ~150€/mois
                'monthly': 150,
                'description': 'Achats et loisirs moyens (habillement, culture, loisirs)'
            },
            'restauration': {
                'annual': 1200,  # ~100€/mois
                'monthly': 100,
                'description': 'Restauration moyenne'
            },
            'transport': {
                'annual': 4800,  # ~400€/mois
                'monthly': 400,
                'description': 'Transport moyen (carburant, transports en commun)'
            },
            'logement': {
                'annual': 8400,  # ~700€/mois
                'monthly': 700,
                'description': 'Logement moyen (loyer, charges, énergie)'
            },
            'sante': {
                'annual': 2400,  # ~200€/mois
                'monthly': 200,
                'description': 'Santé moyenne'
            },
        }
    
    def get_household_expense_statistics(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Récupère les statistiques de dépenses moyennes des ménages
        
        Args:
            category: Catégorie spécifique ('alimentation', 'achats_loisirs', etc.) ou None pour toutes
            
        Returns:
            Dictionnaire avec les statistiques de dépenses
        """
        # Vérifier le cache d'abord
        cached_data = self._load_from_cache('household_expenses')
        if cached_data:
            if category:
                return cached_data.get(category, {})
            return cached_data
        
        # Utiliser les données par défaut (statistiques INSEE connues)
        default_stats = self._get_default_household_expenses()
        
        # Essayer de récupérer des données plus récentes depuis l'INSEE si possible
        try:
            if REQUESTS_AVAILABLE:
                # URL de l'enquête Budget de Famille de l'INSEE
                url = f"{self.BASE_URLS['insee']}/fr/statistiques/series/2525759"
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9',
                }
                
                # Note: L'INSEE a des APIs mais nécessitent souvent une clé API
                # Pour l'instant, on utilise les statistiques par défaut
                # qui sont basées sur les dernières données disponibles publiquement
                pass
        except Exception as e:
            print(f"Erreur lors de la récupération des statistiques INSEE: {e}")
        
        # Sauvegarder dans le cache
        self._save_to_cache('household_expenses', default_stats)
        
        if category:
            return default_stats.get(category, {})
        
        return default_stats
    
    def get_default_category_targets(self) -> List[Dict[str, Any]]:
        """
        Retourne les catégories par défaut avec des montants réalistes basés sur l'INSEE
        
        Returns:
            Liste de catégories avec leurs montants annuels par défaut
        """
        stats = self.get_household_expense_statistics()
        
        return [
            {
                'id': 'alimentation',
                'name': 'Alimentation',
                'target': stats.get('alimentation', {}).get('annual', 4200),
                'target_monthly': stats.get('alimentation', {}).get('monthly', 350),
                'description': stats.get('alimentation', {}).get('description', 'Dépenses alimentaires')
            },
            {
                'id': 'achats',
                'name': 'Achats & Loisirs',
                'target': stats.get('achats_loisirs', {}).get('annual', 1800),
                'target_monthly': stats.get('achats_loisirs', {}).get('monthly', 150),
                'description': stats.get('achats_loisirs', {}).get('description', 'Achats et loisirs')
            },
        ]

