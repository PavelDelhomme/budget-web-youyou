"""
Service pour récupérer TOUTES les déductions et crédits d'impôt disponibles depuis les sites gouvernementaux français
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


class GovernmentDeductionsService:
    """Service pour récupérer toutes les déductions et crédits d'impôt depuis les sources officielles"""
    
    BASE_URLS = {
        'impots_gouv': 'https://www.impots.gouv.fr',
        'service_public': 'https://www.service-public.fr',
        'economie_gouv': 'https://www.economie.gouv.fr',
    }
    
    CACHE_DIR = Path(__file__).parent.parent / 'data' / 'cache'
    CACHE_DURATION_HOURS = 168  # Cache les données pendant 7 jours
    
    def __init__(self):
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_path(self, year: int) -> Path:
        """Chemin du fichier de cache pour une année"""
        return self.CACHE_DIR / f'fiscal_deductions_{year}.json'
    
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
        """Charge les déductions depuis le cache"""
        cache_path = self._get_cache_path(year)
        if self._is_cache_valid(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('deductions', [])
            except Exception:
                pass
        return None
    
    def _save_to_cache(self, year: int, deductions: List[Dict[str, Any]]):
        """Sauvegarde les déductions dans le cache"""
        cache_path = self._get_cache_path(year)
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'year': year,
                    'cached_at': datetime.now().isoformat(),
                    'deductions': deductions
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du cache: {e}")
    
    def _fetch_from_impots_gouv(self, year: int) -> List[Dict[str, Any]]:
        """Récupère toutes les déductions et crédits d'impôt depuis impots.gouv.fr"""
        deductions = []
        
        if not REQUESTS_AVAILABLE:
            return deductions
        
        try:
            # URL principale des réductions et crédits d'impôt
            urls = [
                f"{self.BASE_URLS['impots_gouv']}/particulier/vosdroits/reductions-et-credits-dimpot",
                f"{self.BASE_URLS['impots_gouv']}/particulier/vosdroits/liste-des-reductions-et-credits-dimpot",
                f"{self.BASE_URLS['economie_gouv']}/particuliers/reductions-aides-credits-impot",
            ]
            
            for base_url in urls:
                try:
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'fr-FR,fr;q=0.9',
                    }
                    
                    response = requests.get(base_url, headers=headers, timeout=10)
                    if response.status_code == 200 and BEAUTIFULSOUP_AVAILABLE:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        content = soup.get_text()
                        
                        # Extraire toutes les déductions et crédits d'impôt mentionnés
                        deductions_found = self._extract_all_deductions(content, year, base_url)
                        if deductions_found:
                            deductions.extend(deductions_found)
                            break  # Utiliser la première source qui fonctionne
                except Exception:
                    continue
                    
        except Exception as e:
            print(f"Erreur lors de la récupération depuis impots.gouv.fr: {e}")
        
        return deductions
    
    def _extract_all_deductions(self, content: str, year: int, source_url: str) -> List[Dict[str, Any]]:
        """Extrait toutes les déductions et crédits d'impôt depuis le contenu de la page"""
        deductions = []
        
        # Liste exhaustive des déductions et crédits d'impôt à rechercher
        deduction_keywords = {
            # Travail et professionnel
            'frais professionnels': {
                'name': 'Frais professionnels (forfait)',
                'type': 'deduction',
                'category': 'travail',
                'keywords': ['frais professionnels', '10%', 'forfait'],
                'rate': 0.10,
                'min_amount': 433,
                'max_amount': 12954
            },
            'frais réels': {
                'name': 'Frais réels professionnels',
                'type': 'deduction',
                'category': 'travail',
                'keywords': ['frais réels', 'transport', 'repas'],
                'requires_receipts': True
            },
            
            # Immobilier
            'intérêts emprunt': {
                'name': 'Intérêts d\'emprunt (résidence principale)',
                'type': 'deduction',
                'category': 'immobilier',
                'keywords': ['intérêts', 'emprunt', 'résidence principale'],
                'requires_receipts': True
            },
            'travaux rénovation énergétique': {
                'name': 'Travaux de rénovation énergétique',
                'type': 'credit',
                'category': 'immobilier',
                'keywords': ['travaux', 'rénovation', 'énergétique', 'MaPrimeRénov'],
                'rate': 0.30,
                'max_amount': 8000,
                'requires_receipts': True
            },
            'dispositif pinel': {
                'name': 'Investissement locatif Pinel',
                'type': 'credit',
                'category': 'immobilier',
                'keywords': ['pinel', 'investissement locatif', 'neuf'],
                'rate': 0.21,
                'requires_receipts': True
            },
            'dispositif denormandie': {
                'name': 'Investissement locatif Denormandie',
                'type': 'credit',
                'category': 'immobilier',
                'keywords': ['denormandie', 'ancien', 'travaux'],
                'rate': 0.21,
                'requires_receipts': True
            },
            
            # Dons
            'dons associations': {
                'name': 'Dons aux associations',
                'type': 'deduction',
                'category': 'dons',
                'keywords': ['dons', 'association', '66%', '75%'],
                'rate': 0.66,
                'max_rate': 0.75,
                'requires_receipts': True
            },
            'dons organismes aide': {
                'name': 'Dons aux organismes d\'aide',
                'type': 'deduction',
                'category': 'dons',
                'keywords': ['dons', 'repas', 'soins', 'logement', 'personnes en difficulté', '75%'],
                'rate': 0.75,
                'max_amount': 1000,
                'requires_receipts': True
            },
            
            # Famille
            'garde enfants': {
                'name': 'Garde d\'enfants',
                'type': 'credit',
                'category': 'famille',
                'keywords': ['garde', 'enfants', 'crèche', 'assistante maternelle'],
                'rate': 0.50,
                'max_amount': 2300,
                'requires_receipts': True
            },
            'salarié domicile': {
                'name': 'Emploi d\'un salarié à domicile',
                'type': 'credit',
                'category': 'famille',
                'keywords': ['salarié', 'domicile', 'services', 'ménage'],
                'rate': 0.50,
                'max_amount': 12000,
                'requires_receipts': True
            },
            
            # Énergie et environnement
            'borne recharge véhicule électrique': {
                'name': 'Borne de recharge véhicule électrique',
                'type': 'credit',
                'category': 'énergie',
                'keywords': ['borne', 'recharge', 'véhicule électrique', '75%'],
                'rate': 0.75,
                'max_amount': 500,
                'requires_receipts': True
            },
            'isolation': {
                'name': 'Isolation thermique',
                'type': 'credit',
                'category': 'énergie',
                'keywords': ['isolation', 'thermique', 'performance énergétique'],
                'requires_receipts': True
            },
            
            # Investissement
            'investissement pme': {
                'name': 'Investissement dans le capital de PME',
                'type': 'deduction',
                'category': 'investissement',
                'keywords': ['pme', 'capital', '18%'],
                'rate': 0.18,
                'requires_receipts': True
            },
            'scell': {
                'name': 'SCELL (Épargne solidaire)',
                'type': 'deduction',
                'category': 'investissement',
                'keywords': ['scell', 'épargne solidaire'],
                'requires_receipts': True
            },
            
            # Autres
            'pension alimentaire': {
                'name': 'Pension alimentaire',
                'type': 'deduction',
                'category': 'famille',
                'keywords': ['pension alimentaire', 'divorce', 'séparation'],
                'requires_receipts': True
            },
            'frais santé': {
                'name': 'Frais de santé',
                'type': 'deduction',
                'category': 'santé',
                'keywords': ['frais de santé', 'soins', 'médical'],
                'requires_receipts': True
            },
        }
        
        content_lower = content.lower()
        
        # Parcourir toutes les déductions possibles
        for key, ded_config in deduction_keywords.items():
            # Vérifier si cette déduction est mentionnée dans le contenu
            if any(keyword.lower() in content_lower for keyword in ded_config['keywords']):
                # Chercher les détails spécifiques (montants, taux, plafonds)
                idx = -1
                for keyword in ded_config['keywords']:
                    idx = content_lower.find(keyword.lower())
                    if idx != -1:
                        break
                
                if idx != -1:
                    # Extraire le contexte autour du mot-clé
                    context = content[max(0, idx-300):min(len(content), idx+500)]
                    
                    # Extraire les montants, taux, plafonds depuis le contexte
                    extracted_info = self._extract_deduction_details(context, ded_config)
                    
                    # Créer l'entrée de déduction
                    deduction = {
                        'name': ded_config['name'],
                        'type': ded_config['type'],
                        'category': ded_config['category'],
                        'description': self._generate_description(ded_config, extracted_info),
                        'year': year,
                        'source': source_url,
                    }
                    
                    # Ajouter les informations extraites
                    if 'rate' in ded_config:
                        deduction['rate'] = extracted_info.get('rate', ded_config['rate'])
                    if 'max_amount' in ded_config:
                        deduction['max_amount'] = extracted_info.get('max_amount', ded_config.get('max_amount'))
                    if 'min_amount' in ded_config:
                        deduction['min_amount'] = ded_config.get('min_amount')
                    if 'max_rate' in ded_config:
                        deduction['max_rate'] = ded_config.get('max_rate')
                    if 'requires_receipts' in ded_config:
                        deduction['requires_receipts'] = ded_config['requires_receipts']
                    
                    deductions.append(deduction)
        
        return deductions
    
    def _extract_deduction_details(self, context: str, ded_config: Dict[str, Any]) -> Dict[str, Any]:
        """Extrait les détails d'une déduction depuis le contexte"""
        details = {}
        
        # Extraire les montants (plafonds)
        amount_patterns = [
            r'(\d+(?:\s*\d+)*)\s*€',
            r'plafond[^:]*:\s*(\d+(?:\s*\d+)*)\s*€',
            r'maximum[^:]*:\s*(\d+(?:\s*\d+)*)\s*€',
            r'limite[^:]*:\s*(\d+(?:\s*\d+)*)\s*€',
        ]
        
        amounts_found = []
        for pattern in amount_patterns:
            matches = re.finditer(pattern, context, re.IGNORECASE)
            for match in matches:
                try:
                    amount_str = match.group(1).replace(' ', '').replace('.', '')
                    amount = int(amount_str)
                    if 100 <= amount <= 1000000:  # Plausible range
                        amounts_found.append(amount)
                except (ValueError, AttributeError):
                    continue
        
        if amounts_found:
            # Prendre le montant le plus élevé comme plafond
            details['max_amount'] = max(amounts_found)
        
        # Extraire les taux
        rate_patterns = [
            r'(\d+)\s*%',
            r'(\d+)\s+pour\s+cent',
            r'taux[^:]*:\s*(\d+)\s*%',
        ]
        
        rates_found = []
        for pattern in rate_patterns:
            matches = re.finditer(pattern, context, re.IGNORECASE)
            for match in matches:
                try:
                    rate = int(match.group(1))
                    if 1 <= rate <= 100:  # Plausible range
                        rates_found.append(rate)
                except (ValueError, AttributeError):
                    continue
        
        if rates_found:
            # Prendre le taux le plus élevé (souvent le plus récent)
            details['rate'] = max(rates_found) / 100.0
        
        return details
    
    def _generate_description(self, ded_config: Dict[str, Any], extracted_info: Dict[str, Any]) -> str:
        """Génère une description pour la déduction"""
        description_parts = []
        
        if ded_config.get('type') == 'credit':
            description_parts.append("Crédit d'impôt")
        else:
            description_parts.append("Déduction d'impôt")
        
        # Ajouter les informations sur le taux
        rate = extracted_info.get('rate', ded_config.get('rate'))
        if rate:
            if isinstance(rate, float):
                description_parts.append(f"de {int(rate * 100)}%")
            else:
                description_parts.append(f"de {rate}%")
        
        # Ajouter les informations sur les plafonds
        max_amount = extracted_info.get('max_amount', ded_config.get('max_amount'))
        if max_amount:
            description_parts.append(f"(plafond: {max_amount:,} €)")
        
        # Ajouter les conditions
        if ded_config.get('requires_receipts'):
            description_parts.append("- Justificatifs requis")
        
        return ' '.join(description_parts)
    
    def get_all_deductions(self, year: int, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Récupère TOUTES les déductions et crédits d'impôt disponibles pour une année
        
        Args:
            year: Année fiscale
            use_cache: Utiliser le cache si disponible
            
        Returns:
            Liste complète de toutes les déductions et crédits d'impôt
        """
        # Vérifier le cache d'abord
        if use_cache:
            cached_deductions = self._load_from_cache(year)
            if cached_deductions:
                return cached_deductions
        
        # Récupérer depuis les sources officielles
        all_deductions = []
        
        # Source 1: impots.gouv.fr
        deductions_impots = self._fetch_from_impots_gouv(year)
        all_deductions.extend(deductions_impots)
        
        # Ajouter les déductions par défaut si aucune n'a été trouvée
        if not all_deductions:
            all_deductions = self._get_default_deductions(year)
        
        # Enlever les doublons basés sur le nom
        unique_deductions = {}
        for ded in all_deductions:
            name = ded.get('name', '')
            if name and name not in unique_deductions:
                unique_deductions[name] = ded
        
        final_deductions = list(unique_deductions.values())
        
        # Sauvegarder dans le cache
        if final_deductions:
            self._save_to_cache(year, final_deductions)
        
        return final_deductions
    
    def _get_default_deductions(self, year: int) -> List[Dict[str, Any]]:
        """Liste complète des déductions par défaut si aucune source en ligne n'est disponible"""
        return [
            {
                'name': 'Frais professionnels (forfait)',
                'type': 'deduction',
                'category': 'travail',
                'description': 'Déduction forfaitaire de 10% des salaires (minimum 433€, maximum 12 954€)',
                'max_amount': 12954,
                'min_amount': 433,
                'rate': 0.10,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Frais réels professionnels',
                'type': 'deduction',
                'category': 'travail',
                'description': 'Frais professionnels réels (transport, repas, etc.)',
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Intérêts d\'emprunt (résidence principale)',
                'type': 'deduction',
                'category': 'immobilier',
                'description': 'Intérêts d\'emprunt pour résidence principale',
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Travaux de rénovation énergétique',
                'type': 'credit',
                'category': 'immobilier',
                'description': 'Crédit d\'impôt pour travaux d\'économie d\'énergie - 30% (plafond: 8 000 €) - Justificatifs requis',
                'rate': 0.30,
                'max_amount': 8000,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Investissement locatif Pinel',
                'type': 'credit',
                'category': 'immobilier',
                'description': 'Crédit d\'impôt pour investissement locatif neuf - 21% sur 12 ans - Justificatifs requis',
                'rate': 0.21,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Dons aux associations',
                'type': 'deduction',
                'category': 'dons',
                'description': 'Déduction de 66% ou 75% des dons (selon l\'association) - Justificatifs requis',
                'rate': 0.66,
                'max_rate': 0.75,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Dons aux organismes d\'aide',
                'type': 'deduction',
                'category': 'dons',
                'description': 'Déduction de 75% des dons (plafond: 1 000 €) - Justificatifs requis',
                'rate': 0.75,
                'max_amount': 1000,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Garde d\'enfants',
                'type': 'credit',
                'category': 'famille',
                'description': 'Crédit d\'impôt pour frais de garde - 50% (plafond: 2 300 €) - Justificatifs requis',
                'rate': 0.50,
                'max_amount': 2300,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Emploi d\'un salarié à domicile',
                'type': 'credit',
                'category': 'famille',
                'description': 'Crédit d\'impôt pour salarié à domicile - 50% (plafond: 12 000 €) - Justificatifs requis',
                'rate': 0.50,
                'max_amount': 12000,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Borne de recharge véhicule électrique',
                'type': 'credit',
                'category': 'énergie',
                'description': 'Crédit d\'impôt pour borne de recharge - 75% (plafond: 500 €) - Justificatifs requis',
                'rate': 0.75,
                'max_amount': 500,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Investissement dans le capital de PME',
                'type': 'deduction',
                'category': 'investissement',
                'description': 'Réduction d\'impôt pour investissement PME - 18% - Justificatifs requis',
                'rate': 0.18,
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
            {
                'name': 'Pension alimentaire',
                'type': 'deduction',
                'category': 'famille',
                'description': 'Déduction pour pension alimentaire versée - Justificatifs requis',
                'requires_receipts': True,
                'year': year,
                'source': 'default'
            },
        ]

