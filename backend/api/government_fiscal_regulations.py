"""
Service pour récupérer les réglementations fiscales officielles depuis les sites gouvernementaux français
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


class GovernmentFiscalRegulationsService:
    """Service pour récupérer les réglementations fiscales depuis les sources officielles"""
    
    BASE_URLS = {
        'impots_gouv': 'https://www.impots.gouv.fr',
        'service_public': 'https://www.service-public.fr',
        'economie_gouv': 'https://www.economie.gouv.fr',
        'legifrance': 'https://www.legifrance.gouv.fr'
    }
    
    CACHE_DIR = Path(__file__).parent.parent / 'data' / 'cache'
    CACHE_DURATION_HOURS = 168  # Cache les données pendant 7 jours (réglementation change moins souvent)
    
    def __init__(self):
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_path(self, year: int) -> Path:
        """Chemin du fichier de cache pour une année"""
        return self.CACHE_DIR / f'fiscal_regulations_{year}.json'
    
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
        """Charge les réglementations depuis le cache"""
        cache_path = self._get_cache_path(year)
        if self._is_cache_valid(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('regulations', [])
            except Exception:
                pass
        return None
    
    def _save_to_cache(self, year: int, regulations: List[Dict[str, Any]]):
        """Sauvegarde les réglementations dans le cache"""
        cache_path = self._get_cache_path(year)
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'year': year,
                    'cached_at': datetime.now().isoformat(),
                    'regulations': regulations
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du cache: {e}")
    
    def _fetch_tax_brackets(self, year: int) -> Optional[Dict[str, Any]]:
        """Récupère le barème de l'impôt sur le revenu depuis impots.gouv.fr"""
        if not REQUESTS_AVAILABLE:
            return None
        
        try:
            # URL du barème de l'impôt sur le revenu
            url = f"{self.BASE_URLS['impots_gouv']}/portail/info/actualite/bareme-impot-revenu-{year}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200 and BEAUTIFULSOUP_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                content = soup.get_text()
                
                # Extraire le barème (tranches d'imposition)
                brackets = []
                
                # Pattern pour trouver les tranches : "De X € à Y € : Z%"
                bracket_pattern = r'(?:Jusqu\'?à|De|Au-delà de)\s+(\d+(?:\s*\d+)*)\s*€(?:\s+à\s+(\d+(?:\s*\d+)*)\s*€)?\s*[:–]\s*(\d+)\s*%'
                matches = re.finditer(bracket_pattern, content, re.IGNORECASE)
                
                for match in matches:
                    min_amount_str = match.group(1).replace(' ', '')
                    max_amount_str = match.group(2).replace(' ', '') if match.group(2) else None
                    rate_str = match.group(3)
                    
                    try:
                        min_amount = int(min_amount_str)
                        max_amount = int(max_amount_str) if max_amount_str else None
                        rate = int(rate_str)
                        
                        brackets.append({
                            'min': min_amount,
                            'max': max_amount,
                            'rate': rate
                        })
                    except (ValueError, AttributeError):
                        continue
                
                if brackets:
                    return {
                        'id': f'tax-brackets-{year}',
                        'title': f'Barème de l\'impôt sur le revenu {year}',
                        'description': f'Barème progressif de l\'impôt sur le revenu pour l\'année {year}. Tranches d\'imposition et taux applicables.',
                        'category': 'tax_rates',
                        'effective_date': f'{year}-01-01',
                        'source': 'impots.gouv.fr',
                        'impact': 'high',
                        'url': url,
                        'data': {
                            'brackets': brackets,
                            'year': year
                        }
                    }
                
        except Exception as e:
            print(f"Erreur lors de la récupération du barème: {e}")
        
        return None
    
    def _fetch_thresholds_and_limits(self, year: int) -> List[Dict[str, Any]]:
        """Récupère les plafonds et seuils depuis service-public.fr et impots.gouv.fr"""
        regulations = []
        
        if not REQUESTS_AVAILABLE:
            return regulations
        
        try:
            # Rechercher les plafonds et seuils sur service-public.fr
            urls_to_try = [
                f"{self.BASE_URLS['service_public']}/particuliers/vosdroits/F32128",
                f"{self.BASE_URLS['impots_gouv']}/portail/info/actualite/plafonds-{year}",
            ]
            
            for url in urls_to_try:
                try:
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Accept-Language': 'fr-FR,fr;q=0.9',
                    }
                    
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200 and BEAUTIFULSOUP_AVAILABLE:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        content = soup.get_text()
                        
                        # Extraire les plafonds et seuils
                        # Pattern pour trouver les montants : "Plafond : X €" ou "Seuil : Y €"
                        threshold_patterns = [
                            (r'(?:Plafond|plafond)\s*[:–]\s*(\d+(?:\s*\d+)*)\s*€', 'plafond'),
                            (r'(?:Seuil|seuil)\s*[:–]\s*(\d+(?:\s*\d+)*)\s*€', 'seuil'),
                            (r'(\d+(?:\s*\d+)*)\s*€\s*(?:de\s+)?(?:plafond|seuil)', 'threshold'),
                        ]
                        
                        thresholds_found = []
                        for pattern, threshold_type in threshold_patterns:
                            matches = re.finditer(pattern, content, re.IGNORECASE)
                            for match in matches:
                                amount_str = match.group(1).replace(' ', '')
                                try:
                                    amount = int(amount_str)
                                    context = content[max(0, match.start()-100):min(len(content), match.end()+100)]
                                    
                                    # Identifier le type de plafond/seuil
                                    threshold_name = self._identify_threshold_type(context, amount)
                                    
                                    thresholds_found.append({
                                        'name': threshold_name,
                                        'amount': amount,
                                        'type': threshold_type
                                    })
                                except ValueError:
                                    continue
                        
                        if thresholds_found:
                            regulations.append({
                                'id': f'thresholds-{year}',
                                'title': f'Plafonds et seuils fiscaux {year}',
                                'description': f'Plafonds de ressources, seuils d\'imposition et autres limites pour l\'année {year}',
                                'category': 'thresholds',
                                'effective_date': f'{year}-01-01',
                                'source': 'service-public.fr',
                                'impact': 'medium',
                                'url': url,
                                'data': {
                                    'thresholds': thresholds_found,
                                    'year': year
                                }
                            })
                            break  # Utiliser la première source qui fonctionne
                except Exception:
                    continue
                    
        except Exception as e:
            print(f"Erreur lors de la récupération des plafonds: {e}")
        
        return regulations
    
    def _identify_threshold_type(self, context: str, amount: int) -> str:
        """Identifie le type de plafond/seuil à partir du contexte"""
        context_lower = context.lower()
        
        if 'revenu fiscal de référence' in context_lower or 'rfr' in context_lower:
            return f'Plafond RFR {amount:,} €'
        elif 'revenu imposable' in context_lower or 'non imposable' in context_lower:
            return f'Seuil d\'imposition {amount:,} €'
        elif 'parts' in context_lower:
            return f'Plafond parts fiscales {amount:,} €'
        elif 'déduction' in context_lower:
            return f'Plafond déduction {amount:,} €'
        else:
            return f'Plafond {amount:,} €'
    
    def _fetch_deductions_info(self, year: int) -> List[Dict[str, Any]]:
        """Récupère les informations sur les déductions et crédits d'impôt depuis le service dédié"""
        regulations = []
        
        try:
            # Utiliser le service dédié pour récupérer toutes les déductions
            from api.government_deductions_service import GovernmentDeductionsService
            service = GovernmentDeductionsService()
            all_deductions = service.get_all_deductions(year, use_cache=True)
            
            if all_deductions:
                regulations.append({
                    'id': f'deductions-{year}',
                    'title': f'Déductions et crédits d\'impôt {year}',
                    'description': f'Liste complète de toutes les déductions et crédits d\'impôt disponibles pour l\'année {year}',
                    'category': 'deductions',
                    'effective_date': f'{year}-01-01',
                    'source': 'impots.gouv.fr',
                    'impact': 'high',
                    'url': f"{self.BASE_URLS['impots_gouv']}/particulier/vosdroits/reductions-et-credits-dimpot",
                    'data': {
                        'deductions': all_deductions,
                        'year': year,
                        'total_count': len(all_deductions)
                    }
                })
        except Exception as e:
            print(f"Erreur lors de la récupération des déductions: {e}")
            # Fallback vers une réglementation basique
            regulations.append({
                'id': f'deductions-{year}',
                'title': f'Déductions et crédits d\'impôt {year}',
                'description': f'Déductions et crédits d\'impôt disponibles pour l\'année {year}',
                'category': 'deductions',
                'effective_date': f'{year}-01-01',
                'source': 'impots.gouv.fr',
                'impact': 'high',
                'url': f"{self.BASE_URLS['impots_gouv']}/particulier/vosdroits/reductions-et-credits-dimpot",
                'data': {
                    'deductions': [],
                    'year': year
                }
            })
        
        return regulations
    
    def _fetch_tax_changes(self, year: int) -> List[Dict[str, Any]]:
        """Récupère les changements fiscaux pour une année"""
        regulations = []
        
        if not REQUESTS_AVAILABLE:
            return regulations
        
        try:
            # URL des actualités fiscales
            url = f"{self.BASE_URLS['impots_gouv']}/portail/info/actualite"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fr-FR,fr;q=0.9',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200 and BEAUTIFULSOUP_AVAILABLE:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Rechercher les actualités pour l'année concernée
                articles = soup.find_all(['article', 'div'], class_=re.compile(r'article|news|actualite', re.I))
                
                for article in articles[:10]:  # Limiter à 10 articles
                    text = article.get_text()
                    
                    # Vérifier si l'article concerne l'année et la fiscalité
                    if str(year) in text and any(keyword in text.lower() for keyword in ['impôt', 'fiscal', 'taxe', 'barème', 'plafond']):
                        # Extraire le titre
                        title_elem = article.find(['h1', 'h2', 'h3', 'h4', 'a'])
                        title = title_elem.get_text(strip=True) if title_elem else 'Actualité fiscale'
                        
                        # Extraire la date
                        date_elem = article.find(['time', 'span', 'div'], class_=re.compile(r'date', re.I))
                        date_str = date_elem.get_text(strip=True) if date_elem else f'{year}-01-01'
                        
                        # Extraire l'URL
                        link = article.find('a', href=True)
                        url_link = link['href'] if link else None
                        if url_link and not url_link.startswith('http'):
                            url_link = f"{self.BASE_URLS['impots_gouv']}{url_link}"
                        
                        regulations.append({
                            'id': f'change-{year}-{len(regulations)}',
                            'title': title,
                            'description': text[:500] + '...' if len(text) > 500 else text,
                            'category': 'changes',
                            'effective_date': self._extract_date_from_text(date_str, year),
                            'source': 'impots.gouv.fr',
                            'impact': 'medium',
                            'url': url_link
                        })
                        
        except Exception as e:
            print(f"Erreur lors de la récupération des changements fiscaux: {e}")
        
        return regulations
    
    def _extract_date_from_text(self, date_text: str, default_year: int) -> str:
        """Extrait une date au format ISO depuis un texte"""
        # Pattern pour extraire une date
        date_patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',
            r'(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})',
        ]
        
        month_map = {
            'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
            'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
            'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
        }
        
        for pattern in date_patterns:
            match = re.search(pattern, date_text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 3:
                    try:
                        if match.group(2).isdigit():
                            # Format DD/MM/YYYY
                            day, month, year = match.groups()
                            return f"{year}-{int(month):02d}-{int(day):02d}"
                        else:
                            # Format "DD mois YYYY"
                            day, month_name, year = match.groups()
                            month = month_map.get(month_name.lower(), 1)
                            return f"{year}-{month:02d}-{int(day):02d}"
                    except (ValueError, KeyError):
                        pass
        
        # Date par défaut
        return f'{default_year}-01-01'
    
    def _merge_regulations(self, regulations_list: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Fusionne les réglementations de plusieurs sources, en évitant les doublons"""
        merged = {}
        
        for regulations in regulations_list:
            for reg in regulations:
                reg_id = reg.get('id')
                if reg_id and reg_id not in merged:
                    merged[reg_id] = reg
        
        return list(merged.values())
    
    def get_fiscal_regulations(self, year: int, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Récupère toutes les réglementations fiscales officielles pour une année donnée
        
        Args:
            year: Année fiscale
            use_cache: Utiliser le cache si disponible
            
        Returns:
            Liste des réglementations fiscales
        """
        # Vérifier le cache d'abord
        if use_cache:
            cached_regulations = self._load_from_cache(year)
            if cached_regulations:
                return cached_regulations
        
        # Récupérer depuis les sources officielles
        all_regulations = []
        
        # 1. Barème de l'impôt
        tax_brackets = self._fetch_tax_brackets(year)
        if tax_brackets:
            all_regulations.append([tax_brackets])
        
        # 2. Plafonds et seuils
        thresholds = self._fetch_thresholds_and_limits(year)
        if thresholds:
            all_regulations.append(thresholds)
        
        # 3. Déductions et crédits d'impôt
        deductions = self._fetch_deductions_info(year)
        if deductions:
            all_regulations.append(deductions)
        
        # 4. Changements fiscaux
        changes = self._fetch_tax_changes(year)
        if changes:
            all_regulations.append(changes)
        
        # Ajouter les réglementations par défaut si aucune n'a été trouvée
        if not all_regulations:
            all_regulations.append(self._get_default_regulations(year))
        
        # Fusionner toutes les réglementations
        merged_regulations = self._merge_regulations(all_regulations)
        
        # Sauvegarder dans le cache
        if merged_regulations:
            self._save_to_cache(year, merged_regulations)
        
        return merged_regulations
    
    def _get_default_regulations(self, year: int) -> List[Dict[str, Any]]:
        """Réglementations par défaut si aucune source en ligne n'est disponible"""
        return [
            {
                'id': f'tax-brackets-{year}',
                'title': f'Barème de l\'impôt sur le revenu {year}',
                'description': f'Barème progressif pour l\'année {year}',
                'category': 'tax_rates',
                'effective_date': f'{year}-01-01',
                'source': 'impots.gouv.fr',
                'impact': 'high',
                'url': f'https://www.impots.gouv.fr/portail/info/actualite/bareme-impot-revenu-{year}',
                'data': {
                    'brackets': [
                        {'min': 0, 'max': 11497, 'rate': 0},
                        {'min': 11498, 'max': 29315, 'rate': 11},
                        {'min': 29316, 'max': 83823, 'rate': 30},
                        {'min': 83824, 'max': 180294, 'rate': 41},
                        {'min': 180295, 'max': None, 'rate': 45},
                    ],
                    'year': year
                }
            },
            {
                'id': f'thresholds-{year}',
                'title': f'Plafonds et seuils {year}',
                'description': f'Plafonds de ressources et seuils pour {year}',
                'category': 'thresholds',
                'effective_date': f'{year}-01-01',
                'source': 'service-public.fr',
                'impact': 'medium',
                'url': f'https://www.service-public.fr/particuliers/vosdroits/{year}',
                'data': {
                    'thresholds': [
                        {'name': 'Seuil d\'imposition', 'amount': 17438, 'type': 'seuil'},
                        {'name': 'Plafond RFR', 'amount': 16000, 'type': 'plafond'},
                    ],
                    'year': year
                }
            },
        ]

