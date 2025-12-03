"""
Service pour récupérer le calendrier fiscal officiel depuis les sites gouvernementaux français
"""
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
import os

try:
    import requests
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    BEAUTIFULSOUP_AVAILABLE = False


class GovernmentFiscalCalendarService:
    """Service pour récupérer le calendrier fiscal depuis les sources officielles"""
    
    BASE_URLS = {
        'impots_gouv': 'https://www.impots.gouv.fr',
        'service_public': 'https://www.service-public.fr',
        'economie_gouv': 'https://www.economie.gouv.fr'
    }
    
    CACHE_DIR = Path(__file__).parent.parent / 'data' / 'cache'
    CACHE_DURATION_HOURS = 24  # Cache les données pendant 24h
    
    def __init__(self):
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_path(self, year: int) -> Path:
        """Chemin du fichier de cache pour une année"""
        return self.CACHE_DIR / f'fiscal_calendar_{year}.json'
    
    def _is_cache_valid(self, cache_path: Path) -> bool:
        """Vérifie si le cache est encore valide"""
        if not cache_path.exists():
            return False
        
        try:
            mod_time = datetime.fromtimestamp(cache_path.stat().st_mtime)
            age = datetime.now() - mod_time
            return age < timedelta(hours=self.CACHE_DURATION_HOURS)
        except Exception:
            return False
    
    def _load_from_cache(self, year: int) -> Optional[List[Dict[str, Any]]]:
        """Charge les dates depuis le cache"""
        cache_path = self._get_cache_path(year)
        if self._is_cache_valid(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('dates', [])
            except Exception:
                pass
        return None
    
    def _save_to_cache(self, year: int, dates: List[Dict[str, Any]]):
        """Sauvegarde les dates dans le cache"""
        cache_path = self._get_cache_path(year)
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'year': year,
                    'cached_at': datetime.now().isoformat(),
                    'dates': dates
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du cache: {e}")
    
    def _fetch_from_impots_gouv(self, year: int) -> List[Dict[str, Any]]:
        """Récupère les dates depuis impots.gouv.fr"""
        dates = []
        
        if not REQUESTS_AVAILABLE:
            return dates
        
        try:
            # URL du calendrier fiscal pour les particuliers
            url = f"{self.BASE_URLS['impots_gouv']}/particulier/calendrier-fiscal"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            if BEAUTIFULSOUP_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Recherche des dates dans la page
                # Les dates fiscales sont généralement dans des tableaux ou listes
                content = soup.get_text()
                
                # Pattern pour détecter les dates importantes
                patterns = [
                    # Format: "Déclaration en ligne jusqu'au 23 mai 2025"
                    (r"(?:jusqu'?au|avant le|le)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", 'deadline'),
                    # Format: "Ouverture le 1er mars 2025"
                    (r"(?:ouverture|début|à partir du)\s+(?:le\s+)?(\d{1,2})(?:er|ème)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", 'information'),
                    # Format: "Paiement le 15 août 2025"
                    (r"(?:paiement|prélèvement|échéance)\s+(?:le\s+)?(\d{1,2})(?:er|ème)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", 'payment'),
                ]
                
                month_map = {
                    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
                    'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
                    'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
                }
                
                for pattern, event_type in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        day = int(match.group(1))
                        month_name = match.group(2).lower()
                        year_str = match.group(3)
                        
                        if month_name in month_map:
                            month = month_map[month_name]
                            date_str = f"{year_str}-{month:02d}-{day:02d}"
                            
                            # Éviter les doublons
                            if not any(d['date'] == date_str for d in dates):
                                # Déterminer le type d'événement et la description
                                event_name = self._determine_event_name(match.group(0), event_type, date_str)
                                
                                dates.append({
                                    'date': date_str,
                                    'event': event_name,
                                    'type': event_type,
                                    'important': event_type == 'deadline',
                                    'description': self._get_event_description(event_name, date_str, year),
                                    'source': 'impots.gouv.fr'
                                })
            
        except Exception as e:
            print(f"Erreur lors de la récupération depuis impots.gouv.fr: {e}")
        
        return dates
    
    def _fetch_from_economie_gouv(self, year: int) -> List[Dict[str, Any]]:
        """Récupère les dates depuis economie.gouv.fr"""
        dates = []
        
        if not REQUESTS_AVAILABLE:
            return dates
        
        try:
            # URL de la page calendrier déclaration revenus
            url = f"{self.BASE_URLS['economie_gouv']}/particuliers/impot-sur-le-revenu-le-calendrier-de-la-declaration-en-{year}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fr-FR,fr;q=0.9',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200 and BEAUTIFULSOUP_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                content = soup.get_text()
                
                # Rechercher les dates de déclaration spécifiques
                # Pattern pour trouver les dates importantes
                patterns = [
                    (r"(\d{1,2})(?:er|ème)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", None),
                ]
                
                month_map = {
                    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
                    'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
                    'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
                }
                
                # Rechercher dans le contexte autour des mots-clés
                keywords_context = {
                    'déclaration en ligne': ('deadline', 'Échéance déclaration en ligne'),
                    'déclaration papier': ('deadline', 'Échéance déclaration papier'),
                    'ouverture': ('information', 'Ouverture de la déclaration'),
                }
                
                for keyword, (event_type, event_name) in keywords_context.items():
                    if keyword.lower() in content.lower():
                        # Chercher la date la plus proche du mot-clé
                        idx = content.lower().find(keyword.lower())
                        context = content[max(0, idx-200):min(len(content), idx+200)]
                        
                        for pattern, _ in patterns:
                            matches = re.finditer(pattern, context, re.IGNORECASE)
                            for match in matches:
                                day = int(match.group(1))
                                month_name = match.group(2).lower()
                                year_str = match.group(3)
                                
                                if month_name in month_map and year_str == str(year):
                                    month = month_map[month_name]
                                    date_str = f"{year_str}-{month:02d}-{day:02d}"
                                    
                                    if not any(d['date'] == date_str for d in dates):
                                        dates.append({
                                            'date': date_str,
                                            'event': event_name,
                                            'type': event_type,
                                            'important': True,
                                            'description': self._get_event_description(event_name, date_str, year),
                                            'source': 'economie.gouv.fr'
                                        })
                                        break
                
        except Exception as e:
            print(f"Erreur lors de la récupération depuis economie.gouv.fr: {e}")
        
        return dates
    
    def _determine_event_name(self, match_text: str, event_type: str, date_str: str) -> str:
        """Détermine le nom de l'événement à partir du texte trouvé"""
        text_lower = match_text.lower()
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        
        # Mapping des événements courants
        if 'déclaration' in text_lower:
            if 'en ligne' in text_lower or 'en ligne' in text_lower:
                return f'Échéance déclaration en ligne ({date_obj.strftime("%Y")})'
            elif 'papier' in text_lower:
                return f'Échéance déclaration papier ({date_obj.strftime("%Y")})'
            elif 'ouverture' in text_lower or 'début' in text_lower:
                return 'Ouverture de la déclaration en ligne'
            return 'Déclaration des revenus'
        elif 'paiement' in text_lower or 'prélèvement' in text_lower:
            month = date_obj.month
            if month == 8:
                return 'Premier prélèvement à la source'
            elif month == 9:
                return 'Deuxième prélèvement à la source'
            return 'Prélèvement fiscal'
        elif 'reçu' in text_lower:
            return 'Reçu fiscal disponible'
        
        return 'Événement fiscal'
    
    def _get_event_description(self, event_name: str, date_str: str, year: int) -> str:
        """Génère une description pour l'événement"""
        descriptions = {
            'Ouverture de la déclaration en ligne': 'Début de la période de déclaration des revenus en ligne',
            'Échéance déclaration en ligne': f'Date limite pour déclarer ses revenus {year-1} en ligne (métropole)',
            'Échéance déclaration papier': f'Date limite pour déclarer ses revenus {year-1} par papier',
            'Premier prélèvement à la source': 'Premier prélèvement du solde d\'impôt sur le revenu',
            'Deuxième prélèvement à la source': 'Deuxième prélèvement du solde d\'impôt sur le revenu',
            'Reçu fiscal disponible': 'Réception du récapitulatif fiscal annuel',
        }
        
        for key, desc in descriptions.items():
            if key in event_name:
                return desc
        
        return f'Événement fiscal pour l\'année {year}'
    
    def _merge_dates(self, dates_list: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Fusionne les dates de plusieurs sources, en évitant les doublons"""
        merged = {}
        
        for dates in dates_list:
            for date_info in dates:
                date_key = date_info['date']
                # Garder la date la plus complète ou la plus récente
                if date_key not in merged or date_info.get('source') == 'impots.gouv.fr':
                    merged[date_key] = date_info
        
        return sorted(list(merged.values()), key=lambda x: x['date'])
    
    def get_fiscal_calendar(self, year: int, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Récupère le calendrier fiscal officiel pour une année donnée
        
        Args:
            year: Année fiscale
            use_cache: Utiliser le cache si disponible
            
        Returns:
            Liste des dates importantes du calendrier fiscal
        """
        # Vérifier le cache d'abord
        if use_cache:
            cached_dates = self._load_from_cache(year)
            if cached_dates:
                return cached_dates
        
        # Récupérer depuis les sources officielles
        all_dates = []
        
        # Source 1: impots.gouv.fr
        dates_impots = self._fetch_from_impots_gouv(year)
        all_dates.append(dates_impots)
        
        # Source 2: economie.gouv.fr
        dates_economie = self._fetch_from_economie_gouv(year)
        all_dates.append(dates_economie)
        
        # Ajouter les dates par défaut si aucune date n'a été trouvée
        if not any(all_dates):
            all_dates.append(self._get_default_dates(year))
        
        # Fusionner toutes les dates
        merged_dates = self._merge_dates(all_dates)
        
        # Sauvegarder dans le cache
        if merged_dates:
            self._save_to_cache(year, merged_dates)
        
        return merged_dates
    
    def _get_default_dates(self, year: int) -> List[Dict[str, Any]]:
        """Dates par défaut si aucune source en ligne n'est disponible"""
        return [
            {
                'date': f'{year}-03-01',
                'event': 'Ouverture de la déclaration en ligne',
                'type': 'deadline',
                'important': True,
                'description': 'Début de la période de déclaration des revenus',
                'source': 'default'
            },
            {
                'date': f'{year}-05-23',
                'event': 'Échéance déclaration en ligne (métropole)',
                'type': 'deadline',
                'important': True,
                'description': 'Date limite pour déclarer ses revenus en ligne',
                'source': 'default'
            },
            {
                'date': f'{year}-06-07',
                'event': 'Échéance déclaration papier',
                'type': 'deadline',
                'important': True,
                'description': 'Date limite pour déclarer ses revenus par papier',
                'source': 'default'
            },
            {
                'date': f'{year}-08-15',
                'event': 'Premier prélèvement à la source',
                'type': 'payment',
                'important': False,
                'description': 'Premier prélèvement du solde d\'impôt',
                'source': 'default'
            },
            {
                'date': f'{year}-09-15',
                'event': 'Deuxième prélèvement à la source',
                'type': 'payment',
                'important': False,
                'description': 'Deuxième prélèvement du solde d\'impôt',
                'source': 'default'
            },
        ]

