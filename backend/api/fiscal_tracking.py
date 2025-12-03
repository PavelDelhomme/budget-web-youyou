"""
Système de suivi fiscal complet
- Préparation des déclarations fiscales
- Suivi de la réglementation en temps réel
- Gestion des déductions et crédits d'impôt
- Calendrier fiscal
- Alertes et notifications
"""
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import os

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


@dataclass
class FiscalDeduction:
    """Déduction fiscale ou crédit d'impôt"""
    id: str
    name: str
    type: str  # 'deduction' ou 'credit'
    amount: float
    year: int
    category: str  # 'travail', 'immobilier', 'dons', etc.
    description: str
    documentation_url: Optional[str] = None
    status: str = 'pending'  # 'pending', 'claimed', 'rejected'
    receipt_path: Optional[str] = None


@dataclass
class FiscalDeclaration:
    """Déclaration fiscale"""
    year: int
    status: str  # 'draft', 'prepared', 'submitted', 'validated', 'paid'
    submission_date: Optional[str] = None
    validation_date: Optional[str] = None
    tax_amount: float = 0.0
    refund_amount: float = 0.0
    net_tax_amount: float = 0.0
    rfr: float = 0.0  # Revenu Fiscal de Référence
    taxable_income: float = 0.0
    deductions: List[FiscalDeduction] = None
    notes: str = ''
    documents: List[str] = None  # Chemins vers les documents
    
    def __post_init__(self):
        if self.deductions is None:
            self.deductions = []
        if self.documents is None:
            self.documents = []


@dataclass
class FiscalRegulation:
    """Réglementation fiscale"""
    id: str
    title: str
    description: str
    category: str  # 'tax_rates', 'deductions', 'benefits', etc.
    effective_date: str  # Date d'entrée en vigueur
    source: str  # Source officielle
    expiration_date: Optional[str] = None
    impact: str = 'medium'  # 'low', 'medium', 'high'
    url: Optional[str] = None


class FiscalRegulationTracker:
    """Suivi de la réglementation fiscale en temps réel"""
    
    def __init__(self):
        self.regulations: List[FiscalRegulation] = []
        self.last_update: Optional[datetime] = None
    
    def fetch_latest_regulations(self, year: int) -> List[FiscalRegulation]:
        """
        Récupère les dernières réglementations fiscales depuis les sources officielles
        
        Sources:
        - Impots.gouv.fr (barème, plafonds, déductions)
        - Service-public.fr (plafonds et seuils)
        - Economie.gouv.fr (changements réglementaires)
        - Cache local avec mise à jour périodique
        """
        try:
            # Essayer de récupérer les réglementations depuis les sources gouvernementales
            from api.government_fiscal_regulations import GovernmentFiscalRegulationsService
            service = GovernmentFiscalRegulationsService()
            regulations_data = service.get_fiscal_regulations(year, use_cache=True)
            
            if regulations_data:
                # Convertir les données en objets FiscalRegulation
                regulations = []
                for reg_data in regulations_data:
                    regulations.append(FiscalRegulation(
                        id=reg_data.get('id', f'regulation-{year}-{len(regulations)}'),
                        title=reg_data.get('title', 'Réglementation fiscale'),
                        description=reg_data.get('description', ''),
                        category=reg_data.get('category', 'general'),
                        effective_date=reg_data.get('effective_date', f'{year}-01-01'),
                        source=reg_data.get('source', 'officiel'),
                        impact=reg_data.get('impact', 'medium'),
                        expiration_date=reg_data.get('expiration_date'),
                        url=reg_data.get('url')
                    ))
                
                if regulations:
                    self.last_update = datetime.now()
                    return regulations
        except Exception as e:
            print(f"Erreur lors de la récupération des réglementations officielles: {e}")
            # Fallback vers les réglementations par défaut
        
        # Réglementations par défaut si la récupération en ligne échoue
        regulations = [
            FiscalRegulation(
                id=f'tax-brackets-{year}',
                title=f'Barème de l\'impôt sur le revenu {year}',
                description=f'Barème progressif pour l\'année {year}',
                category='tax_rates',
                effective_date=f'{year}-01-01',
                source='impots.gouv.fr',
                impact='high',
                url=f'https://www.impots.gouv.fr/portail/info/actualite/bareme-impot-revenu-{year}'
            ),
            FiscalRegulation(
                id=f'plafonds-{year}',
                title=f'Plafonds et seuils {year}',
                description=f'Plafonds de ressources et seuils pour {year}',
                category='thresholds',
                effective_date=f'{year}-01-01',
                source='service-public.fr',
                impact='medium',
                url=f'https://www.service-public.fr/particuliers/vosdroits/{year}'
            ),
        ]
        
        # Filtrer par année
        current_date = datetime.now()
        filtered = [
            reg for reg in regulations
            if reg.effective_date and datetime.strptime(reg.effective_date, '%Y-%m-%d').year == year
        ]
        
        self.last_update = current_date
        return filtered
    
    def check_regulation_changes(self, year: int) -> List[FiscalRegulation]:
        """Vérifie les changements de réglementation"""
        return self.fetch_latest_regulations(year)
    
    def get_applicable_regulations(self, year: int, category: Optional[str] = None) -> List[FiscalRegulation]:
        """Récupère les réglementations applicables pour une année"""
        regulations = self.fetch_latest_regulations(year)
        if category:
            regulations = [r for r in regulations if r.category == category]
        return regulations


class FiscalCalendar:
    """Calendrier fiscal avec dates importantes"""
    
    def __init__(self, year: int):
        self.year = year
        self.important_dates = self._generate_fiscal_calendar(year)
    
    def _generate_fiscal_calendar(self, year: int) -> List[Dict[str, Any]]:
        """Génère le calendrier fiscal pour une année en récupérant les dates officielles"""
        try:
            # Essayer de récupérer les dates depuis les sources gouvernementales
            from api.government_fiscal_calendar import GovernmentFiscalCalendarService
            service = GovernmentFiscalCalendarService()
            dates = service.get_fiscal_calendar(year, use_cache=True)
            
            if dates:
                return dates
        except Exception as e:
            print(f"Erreur lors de la récupération du calendrier officiel: {e}")
            # Fallback vers les dates par défaut
        
        # Dates par défaut si la récupération en ligne échoue
        dates = [
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
            {
                'date': f'{year}-01-15',
                'event': 'Reçu fiscal disponible',
                'type': 'information',
                'important': False,
                'description': 'Réception du récapitulatif fiscal',
                'source': 'default'
            },
        ]
        
        return sorted(dates, key=lambda x: x['date'])
    
    def get_upcoming_deadlines(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Récupère les échéances à venir"""
        today = datetime.now()
        cutoff = today + timedelta(days=days_ahead)
        
        upcoming = []
        for date_info in self.important_dates:
            date_obj = datetime.strptime(date_info['date'], '%Y-%m-%d')
            if today <= date_obj <= cutoff:
                upcoming.append(date_info)
        
        return upcoming
    
    def get_next_deadline(self) -> Optional[Dict[str, Any]]:
        """Récupère la prochaine échéance"""
        today = datetime.now()
        upcoming = [
            d for d in self.important_dates
            if datetime.strptime(d['date'], '%Y-%m-%d') >= today
        ]
        return upcoming[0] if upcoming else None


class FiscalDeclarationManager:
    """Gestionnaire de déclarations fiscales"""
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.base_dir = Path(__file__).parent.parent / 'data' / 'fiscal'
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.user_fiscal_dir = self.base_dir / user_email.replace('@', '_at_')
        self.user_fiscal_dir.mkdir(parents=True, exist_ok=True)
    
    def prepare_declaration(self, year: int, fiscal_data: Dict[str, Any]) -> FiscalDeclaration:
        """
        Prépare une déclaration fiscale
        
        Args:
            year: Année de la déclaration
            fiscal_data: Données fiscales (revenus, situation, etc.)
        """
        declaration = FiscalDeclaration(
            year=year,
            status='draft',
            taxable_income=fiscal_data.get('taxable_income', 0),
            rfr=fiscal_data.get('rfr', 0),
            tax_amount=fiscal_data.get('tax_amount', 0),
            deductions=[
                FiscalDeduction(**d) if isinstance(d, dict) else d
                for d in fiscal_data.get('deductions', [])
            ]
        )
        
        return declaration
    
    def save_declaration(self, declaration: FiscalDeclaration) -> None:
        """Sauvegarde une déclaration"""
        file_path = self.user_fiscal_dir / f'declaration_{declaration.year}.json'
        
        declaration_dict = asdict(declaration)
        # Convertir les objets FiscalDeduction en dict
        declaration_dict['deductions'] = [
            asdict(d) if hasattr(d, '__dict__') else d
            for d in declaration.deductions
        ]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(declaration_dict, f, indent=2, ensure_ascii=False)
    
    def load_declaration(self, year: int) -> Optional[FiscalDeclaration]:
        """Charge une déclaration"""
        file_path = self.user_fiscal_dir / f'declaration_{year}.json'
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Reconstruire l'objet
            deductions = [
                FiscalDeduction(**d) for d in data.get('deductions', [])
            ]
            
            declaration = FiscalDeclaration(
                year=data['year'],
                status=data.get('status', 'draft'),
                submission_date=data.get('submission_date'),
                validation_date=data.get('validation_date'),
                tax_amount=data.get('tax_amount', 0),
                refund_amount=data.get('refund_amount', 0),
                net_tax_amount=data.get('net_tax_amount', 0),
                rfr=data.get('rfr', 0),
                taxable_income=data.get('taxable_income', 0),
                deductions=deductions,
                notes=data.get('notes', ''),
                documents=data.get('documents', [])
            )
            
            return declaration
        except Exception as e:
            print(f"Erreur lors du chargement de la déclaration: {e}")
            return None
    
    def list_declarations(self) -> List[FiscalDeclaration]:
        """Liste toutes les déclarations"""
        declarations = []
        
        for file_path in self.user_fiscal_dir.glob('declaration_*.json'):
            try:
                year = int(file_path.stem.split('_')[1])
                declaration = self.load_declaration(year)
                if declaration:
                    declarations.append(declaration)
            except (ValueError, IndexError):
                continue
        
        return sorted(declarations, key=lambda d: d.year, reverse=True)


class FiscalDeductionManager:
    """Gestionnaire de déductions fiscales"""
    
    COMMON_DEDUCTIONS = {
        'travail': [
            {
                'name': 'Frais professionnels (forfait)',
                'type': 'deduction',
                'description': 'Déduction forfaitaire de 10% des salaires (minimum 433€, maximum 12 954€)',
                'max_amount': 12954,
                'min_amount': 433,
                'rate': 0.10
            },
            {
                'name': 'Frais réels',
                'type': 'deduction',
                'description': 'Frais professionnels réels (transport, repas, etc.)',
                'requires_receipts': True
            },
        ],
        'immobilier': [
            {
                'name': 'Intérêts d\'emprunt',
                'type': 'deduction',
                'description': 'Intérêts d\'emprunt pour résidence principale',
                'requires_receipts': True
            },
            {
                'name': 'Travaux de rénovation énergétique',
                'type': 'credit',
                'description': 'Crédit d\'impôt pour travaux d\'économie d\'énergie',
                'rate': 0.30,
                'max_amount': 8000,
                'requires_receipts': True
            },
        ],
        'dons': [
            {
                'name': 'Dons aux associations',
                'type': 'deduction',
                'description': 'Déduction de 66% ou 75% des dons (selon l\'association)',
                'rate': 0.66,
                'max_rate': 0.75,
                'requires_receipts': True
            },
        ],
        'famille': [
            {
                'name': 'Garde d\'enfants',
                'type': 'credit',
                'description': 'Crédit d\'impôt pour frais de garde',
                'rate': 0.50,
                'max_amount': 2300,
                'requires_receipts': True
            },
        ],
    }
    
    def get_available_deductions(self, category: Optional[str] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """Récupère les déductions disponibles depuis les sources officielles"""
        if year is None:
            from datetime import datetime
            year = datetime.now().year
        
        try:
            # Essayer de récupérer depuis le service gouvernemental
            from api.government_deductions_service import GovernmentDeductionsService
            service = GovernmentDeductionsService()
            official_deductions = service.get_all_deductions(year, use_cache=True)
            
            if official_deductions:
                # Filtrer par catégorie si demandé
                if category:
                    filtered = [d for d in official_deductions if d.get('category') == category]
                    return filtered
                return official_deductions
        except Exception as e:
            print(f"Erreur lors de la récupération des déductions officielles: {e}")
            # Fallback vers les déductions par défaut
        
        # Fallback : utiliser les déductions par défaut
        if category:
            return self.COMMON_DEDUCTIONS.get(category, [])
        
        all_deductions = []
        for cat_deductions in self.COMMON_DEDUCTIONS.values():
            all_deductions.extend(cat_deductions)
        
        return all_deductions
    
    def calculate_deduction_amount(
        self,
        deduction_type: str,
        base_amount: float,
        deduction_config: Dict[str, Any]
    ) -> float:
        """Calcule le montant d'une déduction"""
        if deduction_config.get('type') == 'credit':
            # Crédit d'impôt : montant fixe
            rate = deduction_config.get('rate', 0)
            amount = base_amount * rate
            max_amount = deduction_config.get('max_amount')
            if max_amount:
                amount = min(amount, max_amount)
            return amount
        else:
            # Déduction : réduit le revenu imposable
            rate = deduction_config.get('rate', 0)
            amount = base_amount * rate
            min_amount = deduction_config.get('min_amount')
            max_amount = deduction_config.get('max_amount')
            
            if min_amount and amount < min_amount:
                amount = min_amount
            if max_amount and amount > max_amount:
                amount = max_amount
            
            return amount


class FiscalService:
    """Service fiscal complet intégrant tous les composants"""
    
    def __init__(self, user_email: str):
        self.user_email = user_email
        self.declaration_manager = FiscalDeclarationManager(user_email)
        self.deduction_manager = FiscalDeductionManager()
        self.regulation_tracker = FiscalRegulationTracker()
    
    def prepare_declaration_from_budget(
        self,
        year: int,
        annual_income: float,
        situation: Dict[str, Any],
        deductions: List[Dict[str, Any]] = None
    ) -> FiscalDeclaration:
        """
        Prépare une déclaration fiscale à partir des données du budget
        
        Args:
            year: Année de la déclaration
            annual_income: Revenu annuel
            situation: Situation familiale (parts, enfants, etc.)
            deductions: Liste des déductions
        """
        # Calculer l'impôt de base
        from api.government_apis.openfisca import OpenFiscaService
        tax_service = OpenFiscaService()
        
        tax_calculation = tax_service.calculate_impot_revenu(annual_income, situation)
        
        # Calculer les déductions totales
        total_deductions = 0
        deduction_objects = []
        
        if deductions:
            for ded in deductions:
                ded_type = ded.get('category', 'travail')
                available = self.deduction_manager.get_available_deductions(ded_type)
                
                if available:
                    ded_config = available[0]  # Simplifié, devrait correspondre au type
                    amount = self.deduction_manager.calculate_deduction_amount(
                        ded_type,
                        ded.get('amount', 0),
                        ded_config
                    )
                    total_deductions += amount
                    
                    deduction_objects.append(
                        FiscalDeduction(
                            id=ded.get('id', ''),
                            name=ded.get('name', ''),
                            type=ded_config.get('type', 'deduction'),
                            amount=amount,
                            year=year,
                            category=ded_type,
                            description=ded.get('description', ''),
                            status='pending'
                        )
                    )
        
        # Recalculer l'impôt avec les déductions
        taxable_income = annual_income - total_deductions
        if taxable_income < 0:
            taxable_income = 0
        
        tax_calculation_with_deductions = tax_service.calculate_impot_revenu(
            taxable_income,
            situation
        )
        
        # Crédits d'impôt (réduction directe de l'impôt)
        total_credits = sum(
            d.amount for d in deduction_objects
            if d.type == 'credit'
        )
        
        net_tax = tax_calculation_with_deductions['impot_revenu'] - total_credits
        if net_tax < 0:
            refund_amount = abs(net_tax)
            net_tax = 0
        else:
            refund_amount = 0
        
        declaration = FiscalDeclaration(
            year=year,
            status='prepared',
            taxable_income=taxable_income,
            rfr=tax_calculation_with_deductions.get('revenu_fiscal_reference', annual_income),
            tax_amount=tax_calculation_with_deductions['impot_revenu'],
            refund_amount=refund_amount,
            net_tax_amount=net_tax,
            deductions=deduction_objects
        )
        
        return declaration
    
    def get_fiscal_calendar(self, year: int) -> FiscalCalendar:
        """Récupère le calendrier fiscal pour une année"""
        return FiscalCalendar(year)
    
    def check_regulation_updates(self, year: int) -> List[FiscalRegulation]:
        """Vérifie les mises à jour réglementaires"""
        return self.regulation_tracker.check_regulation_changes(year)
    
    def export_declaration_summary(self, declaration: FiscalDeclaration) -> str:
        """Exporte un résumé de déclaration en texte"""
        lines = [
            f"=== DÉCLARATION FISCALE {declaration.year} ===",
            f"",
            f"Statut: {declaration.status}",
            f"Revenu imposable: {declaration.taxable_income:.2f} €",
            f"RFR (Revenu Fiscal de Référence): {declaration.rfr:.2f} €",
            f"",
            f"Impôt sur le revenu: {declaration.tax_amount:.2f} €",
            f"Crédits d'impôt: {sum(d.amount for d in declaration.deductions if d.type == 'credit'):.2f} €",
            f"Net à payer: {declaration.net_tax_amount:.2f} €",
            f"",
        ]
        
        if declaration.refund_amount > 0:
            lines.append(f"Remboursement prévu: {declaration.refund_amount:.2f} €")
            lines.append("")
        
        if declaration.deductions:
            lines.append("DÉDUCTIONS ET CRÉDITS:")
            for ded in declaration.deductions:
                lines.append(f"  - {ded.name}: {ded.amount:.2f} € ({ded.type})")
            lines.append("")
        
        if declaration.notes:
            lines.append(f"Notes: {declaration.notes}")
        
        return "\n".join(lines)

