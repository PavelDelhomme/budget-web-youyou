"""
Gestionnaire fiscal adapté par pays et région
Adapte automatiquement les règles fiscales, calendriers, déductions selon la localisation
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class CountryFiscalSystem:
    """Système fiscal d'un pays"""
    country_code: str  # ISO code (FR, US, BE, etc.)
    country_name: str
    region: Optional[str] = None  # Région du monde
    
    # Informations fiscales de base
    tax_year_start: str = "01-01"  # Début de l'année fiscale (MM-DD)
    tax_year_end: str = "12-31"  # Fin de l'année fiscale (MM-DD)
    declaration_deadline: str = "05-31"  # Date limite de déclaration (MM-DD)
    
    # Informations détaillées
    tax_authority_name: str = ""
    tax_authority_website: str = ""
    online_declaration_url: str = ""
    
    # Notes et particularités
    notes: str = ""
    special_provisions: List[str] = None
    
    def __post_init__(self):
        if self.special_provisions is None:
            self.special_provisions = []


class CountryFiscalManager:
    """Gestionnaire des systèmes fiscaux par pays"""
    
    # Systèmes fiscaux par pays
    FISCAL_SYSTEMS: Dict[str, CountryFiscalSystem] = {
        'FR': CountryFiscalSystem(
            country_code='FR',
            country_name='France',
            region='europe',
            declaration_deadline='05-31',
            tax_authority_name='Direction Générale des Finances Publiques (DGFiP)',
            tax_authority_website='https://www.impots.gouv.fr',
            online_declaration_url='https://www.impots.gouv.fr/portail',
            notes='Système fiscal français avec impôt progressif, prélèvement à la source, et nombreuses déductions.',
            special_provisions=[
                'Prélèvement à la source depuis 2019',
                'Déclaration préremplie disponible',
                'Déductions importantes pour frais professionnels',
                'Crédits d\'impôt pour travaux énergétiques',
                'Déductions pour dons aux associations'
            ]
        ),
        'BE': CountryFiscalSystem(
            country_code='BE',
            country_name='Belgique',
            region='europe',
            declaration_deadline='06-30',
            tax_authority_name='Service Public Fédéral Finances',
            tax_authority_website='https://finances.belgium.be',
            online_declaration_url='https://eservices.minfin.fgov.be',
            notes='Système fiscal belge avec impôt progressif. Déclaration avant le 30 juin.',
            special_provisions=[
                'Déclaration commune pour couples mariés',
                'Déductions importantes pour frais professionnels',
                'Crédit d\'impôt pour investissements'
            ]
        ),
        'CH': CountryFiscalSystem(
            country_code='CH',
            country_name='Suisse',
            region='europe',
            declaration_deadline='03-31',
            tax_authority_name='Administration fédérale des contributions',
            tax_authority_website='https://www.estv.admin.ch',
            online_declaration_url='https://www.ezv.admin.ch',
            notes='Système fédéral avec impôts au niveau fédéral, cantonal et communal.',
            special_provisions=[
                'Impôt au forfait possible',
                'Déductions cantonales variables',
                'Taux variables selon le canton'
            ]
        ),
        'CA': CountryFiscalSystem(
            country_code='CA',
            country_name='Canada',
            region='north_america',
            declaration_deadline='04-30',
            tax_authority_name='Agence du revenu du Canada',
            tax_authority_website='https://www.canada.ca/fr/agence-revenu',
            online_declaration_url='https://www.canada.ca/fr/agence-revenu/services/impot',
            notes='Système fiscal fédéral et provincial. Déclaration avant le 30 avril.',
            special_provisions=[
                'Impôt fédéral + impôt provincial',
                'Déductions importantes pour REER',
                'Crédits d\'impôt pour études'
            ]
        ),
        'US': CountryFiscalSystem(
            country_code='US',
            country_name='États-Unis',
            region='north_america',
            declaration_deadline='04-15',
            tax_authority_name='Internal Revenue Service (IRS)',
            tax_authority_website='https://www.irs.gov',
            online_declaration_url='https://www.irs.gov/filing',
            notes='Système fiscal fédéral et d\'État. Déclaration avant le 15 avril.',
            special_provisions=[
                'Filing status important',
                'Déductions standard ou détaillées',
                'Crédits d\'impôt pour enfants',
                'Déclarations d\'État séparées'
            ]
        ),
        'GB': CountryFiscalSystem(
            country_code='GB',
            country_name='Royaume-Uni',
            region='europe',
            declaration_deadline='01-31',
            tax_year_start='04-06',
            tax_year_end='04-05',
            tax_authority_name='HM Revenue and Customs (HMRC)',
            tax_authority_website='https://www.gov.uk/government/organisations/hm-revenue-customs',
            online_declaration_url='https://www.gov.uk/log-in-file-self-assessment-tax-return',
            notes='Année fiscale du 6 avril au 5 avril. Déclaration avant le 31 janvier.',
            special_provisions=[
                'Année fiscale du 6 avril au 5 avril',
                'Personal Allowance (abattement)',
                'Tax-free ISA',
                'Déclaration Self-Assessment'
            ]
        ),
    }
    
    def get_fiscal_system(self, country_code: str) -> Optional[CountryFiscalSystem]:
        """Récupère le système fiscal d'un pays"""
        return self.FISCAL_SYSTEMS.get(country_code.upper())
    
    def get_fiscal_calendar(self, country_code: str, year: int) -> List[Dict[str, Any]]:
        """Génère le calendrier fiscal adapté pour un pays"""
        system = self.get_fiscal_system(country_code)
        if not system:
            return []
        
        calendar = []
        
        # Date limite de déclaration
        deadline_month, deadline_day = system.declaration_deadline.split('-')
        calendar.append({
            'date': f'{year}-{deadline_month}-{deadline_day}',
            'event': f'Date limite de déclaration ({system.country_name})',
            'type': 'deadline',
            'important': True,
            'description': f'Date limite pour déposer votre déclaration fiscale en {system.country_name}',
            'country': country_code
        })
        
        # Dates spécifiques selon le pays
        if country_code == 'FR':
            calendar.extend([
                {
                    'date': f'{year}-03-01',
                    'event': 'Ouverture déclaration en ligne (France)',
                    'type': 'deadline',
                    'important': True,
                    'description': 'Ouverture de la période de déclaration en ligne',
                    'country': 'FR'
                },
                {
                    'date': f'{year}-05-23',
                    'event': 'Échéance déclaration en ligne (France métropole)',
                    'type': 'deadline',
                    'important': True,
                    'description': 'Date limite pour déclarer ses revenus en ligne',
                    'country': 'FR'
                },
            ])
        
        return sorted(calendar, key=lambda x: x['date'])
    
    def get_tax_info(self, country_code: str) -> Dict[str, Any]:
        """Récupère les informations fiscales détaillées d'un pays"""
        system = self.get_fiscal_system(country_code)
        if not system:
            return {}
        
        return {
            'country_code': system.country_code,
            'country_name': system.country_name,
            'region': system.region,
            'tax_authority': {
                'name': system.tax_authority_name,
                'website': system.tax_authority_website,
                'online_declaration': system.online_declaration_url
            },
            'fiscal_year': {
                'start': system.tax_year_start,
                'end': system.tax_year_end,
                'declaration_deadline': system.declaration_deadline
            },
            'notes': system.notes,
            'special_provisions': system.special_provisions
        }
