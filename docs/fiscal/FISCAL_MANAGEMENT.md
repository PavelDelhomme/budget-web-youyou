# 🏛️ Système de Gestion Fiscale Avancée

## 📋 Vue d'ensemble

Ce système permet de **préparer et suivre vos déclarations fiscales** en temps réel, avec un suivi de la réglementation, un calendrier fiscal complet, et la gestion des déductions et crédits d'impôt.

## ✨ Fonctionnalités

### 1. 📄 Préparation et Suivi des Déclarations Fiscales

- **Préparation automatique** de vos déclarations à partir de vos données budgétaires
- **Calcul précis** des impôts avec déductions et crédits d'impôt
- **Suivi du statut** : brouillon, préparée, soumise, validée, payée
- **Export** des déclarations en format texte ou JSON
- **Historique** de toutes vos déclarations

**Composant** : `AdvancedFiscalManager` - Onglet "Déclarations"

### 2. 📅 Calendrier Fiscal

- **Dates importantes** :
  - Ouverture de la déclaration en ligne (1er mars)
  - Échéance déclaration en ligne (23 mai)
  - Échéance déclaration papier (7 juin)
  - Dates de prélèvements
  - Réception des documents fiscaux
- **Alertes** pour les échéances à venir
- **Filtrage par année**

**Composant** : `AdvancedFiscalManager` - Onglet "Calendrier"

### 3. 📜 Suivi de la Réglementation en Temps Réel

- **Réglementations fiscales** par année
- **Impact** (élevé, moyen, faible) de chaque réglementation
- **Dates d'entrée en vigueur** et d'expiration
- **Sources officielles** avec liens
- **Catégories** : taux d'imposition, plafonds, déductions, prestations

**Composant** : `AdvancedFiscalManager` - Onglet "Réglementation"

### 4. 💰 Gestion des Déductions et Crédits d'Impôt

- **Déductions disponibles** :
  - Travail : Frais professionnels (forfait ou réels)
  - Immobilier : Intérêts d'emprunt, travaux de rénovation énergétique
  - Dons : Dons aux associations
  - Famille : Garde d'enfants
- **Calcul automatique** des montants de déduction
- **Crédits d'impôt** avec taux et plafonds
- **Justificatifs requis** signalés

**Composant** : `AdvancedFiscalManager` - Onglet "Déductions"

### 5. 🔄 Intégration avec les APIs Gouvernementales

- **OpenFisca** : Calculs précis des impôts
- **DGFiP API** : Synchronisation des données fiscales (en attente d'habilitation)
- **URSSAF API** : Simulation de salaires et cotisations

## 🏗️ Architecture

### Backend

#### Module Principal : `backend/api/fiscal_tracking.py`

##### Classes Principales

1. **`FiscalDeclaration`** : Représente une déclaration fiscale
   - Statut : draft, prepared, submitted, validated, paid
   - Montants : tax_amount, refund_amount, net_tax_amount
   - RFR (Revenu Fiscal de Référence)
   - Liste des déductions
   - Documents associés

2. **`FiscalDeduction`** : Déduction ou crédit d'impôt
   - Type : deduction (réduit le revenu imposable) ou credit (réduit l'impôt)
   - Catégorie : travail, immobilier, dons, famille
   - Statut : pending, claimed, rejected
   - Justificatifs

3. **`FiscalDeclarationManager`** : Gestionnaire de déclarations
   - `prepare_declaration()` : Prépare une déclaration
   - `save_declaration()` : Sauvegarde
   - `load_declaration()` : Charge une déclaration
   - `list_declarations()` : Liste toutes les déclarations

4. **`FiscalCalendar`** : Calendrier fiscal
   - `_generate_fiscal_calendar()` : Génère le calendrier pour une année
   - `get_upcoming_deadlines()` : Échéances à venir
   - `get_next_deadline()` : Prochaine échéance

5. **`FiscalRegulationTracker`** : Suivi de la réglementation
   - `fetch_latest_regulations()` : Récupère les réglementations
   - `check_regulation_changes()` : Vérifie les changements
   - `get_applicable_regulations()` : Réglementations applicables

6. **`FiscalDeductionManager`** : Gestionnaire de déductions
   - `get_available_deductions()` : Liste des déductions disponibles
   - `calculate_deduction_amount()` : Calcul du montant

7. **`FiscalService`** : Service principal intégrant tout
   - `prepare_declaration_from_budget()` : Prépare à partir du budget
   - `get_fiscal_calendar()` : Calendrier
   - `check_regulation_updates()` : Mises à jour réglementaires
   - `export_declaration_summary()` : Export texte

#### Routes API : `backend/api/fiscal_service.py`

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/fiscal/declarations` | GET | Liste toutes les déclarations |
| `/api/fiscal/declaration/<year>` | GET | Détails d'une déclaration |
| `/api/fiscal/declaration/prepare` | POST | Prépare une déclaration |
| `/api/fiscal/calendar/<year>` | GET | Calendrier fiscal pour une année |
| `/api/fiscal/regulations` | GET | Réglementations applicables |
| `/api/fiscal/deductions/available` | GET | Déductions disponibles |
| `/api/fiscal/declaration/<year>/export` | GET | Export d'une déclaration |

### Frontend

#### Composant Principal : `client/src/components/AdvancedFiscalManager.tsx`

**Onglets** :
1. **Déclarations** : Liste et gestion des déclarations
2. **Calendrier** : Dates importantes fiscales
3. **Réglementation** : Suivi des lois fiscales
4. **Déductions** : Préparation de déclaration avec déductions

**Fonctionnalités** :
- Chargement automatique des données selon l'onglet actif
- Préparation interactive de déclarations
- Export des déclarations (TXT, JSON)
- Affichage des échéances importantes
- Liste des réglementations avec impact

## 📊 Flux d'Utilisation

### Scénario 1 : Préparer une Déclaration Fiscale

```
1. Ouvrir "Déclarations fiscales" depuis la sidebar
   ↓
2. Aller dans l'onglet "Déductions"
   ↓
3. Remplir la situation fiscale :
   - Revenu annuel
   - Situation familiale
   - Nombre d'enfants
   ↓
4. Sélectionner les déductions applicables
   ↓
5. Cliquer sur "Préparer la Déclaration"
   ↓
6. Le système calcule :
   - Revenu imposable (revenu - déductions)
   - Impôt sur le revenu
   - Crédits d'impôt
   - Net à payer ou remboursement
   ↓
7. Retourner dans l'onglet "Déclarations" pour voir le résultat
   ↓
8. Exporter en TXT ou JSON pour déclaration
```

### Scénario 2 : Vérifier les Échéances Fiscales

```
1. Ouvrir "Déclarations fiscales"
   ↓
2. Aller dans l'onglet "Calendrier"
   ↓
3. Voir la prochaine échéance en haut (alerte)
   ↓
4. Parcourir toutes les dates importantes de l'année
   ↓
5. Filtrer par année si nécessaire
```

### Scénario 3 : Suivre les Changements Réglementaires

```
1. Ouvrir "Déclarations fiscales"
   ↓
2. Aller dans l'onglet "Réglementation"
   ↓
3. Voir toutes les réglementations applicables pour l'année
   ↓
4. Filtrer par catégorie si nécessaire
   ↓
5. Consulter l'impact (élevé, moyen, faible)
   ↓
6. Accéder aux sources officielles via les liens
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# OpenFisca (pour calculs précis)
OPENFISCA_URL=https://api.openfisca.fr/api/2

# DGFiP API (en attente d'habilitation)
IMPOT_CLIENT_ID=your_client_id
IMPOT_CLIENT_SECRET=your_client_secret
IMPOT_API_URL=https://api.impots.gouv.fr/particulier/v1

# URSSAF API
MON_ENTREPRISE_API_URL=https://mon-entreprise.urssaf.fr/api/v1
```

### Stockage des Données

Les déclarations sont stockées dans :
```
backend/data/fiscal/{user_email}/declaration_{year}.json
```

Format JSON :
```json
{
  "year": 2024,
  "status": "prepared",
  "tax_amount": 3420.50,
  "refund_amount": 0,
  "net_tax_amount": 3420.50,
  "rfr": 50000,
  "taxable_income": 45000,
  "deductions": [
    {
      "id": "...",
      "name": "Frais professionnels",
      "type": "deduction",
      "amount": 5000,
      "category": "travail"
    }
  ]
}
```

## 📚 Déductions Disponibles

### Travail
- **Frais professionnels (forfait)** : 10% des salaires (min 433€, max 12 954€)
- **Frais réels** : Transport, repas, etc. (justificatifs requis)

### Immobilier
- **Intérêts d'emprunt** : Résidence principale
- **Travaux de rénovation énergétique** : 30% jusqu'à 8000€ (crédit d'impôt)

### Dons
- **Dons aux associations** : 66% ou 75% selon l'association

### Famille
- **Garde d'enfants** : 50% jusqu'à 2300€ (crédit d'impôt)

## 🔒 Sécurité et Confidentialité

### Mesures Implémentées

1. **Authentification requise** : Toutes les routes sont protégées
2. **Isolation des données** : Chaque utilisateur a son propre dossier
3. **Chiffrement optionnel** : Via `DataEncryption` (voir `SECURITY.md`)
4. **Validation stricte** : Toutes les données sont validées avant sauvegarde

### Conformité RGPD

- ✅ Données stockées localement (serveur)
- ✅ Pas de partage avec tiers sans consentement
- ✅ Droit à l'effacement
- ✅ Portabilité des données (export JSON)

## 🚀 Améliorations Futures

### Court Terme
- [ ] Synchronisation avec API DGFiP (quand habilitation obtenue)
- [ ] Import automatique depuis impots.gouv.fr
- [ ] Génération de PDF pour les déclarations
- [ ] Notifications push pour les échéances

### Moyen Terme
- [ ] Comparaison multi-années
- [ ] Prévisions fiscales (impact de changements)
- [ ] Optimisation fiscale suggérée par IA
- [ ] Scanner de justificatifs (OCR)

### Long Terme
- [ ] Intégration avec comptabilité automatique
- [ ] Détection automatique de déductions possibles
- [ ] Alertes réglementaires en temps réel via API
- [ ] Export direct vers impots.gouv.fr

## 📖 Documentation API

### Préparer une Déclaration

**POST** `/api/fiscal/declaration/prepare`

```json
{
  "year": 2024,
  "annual_income": 50000,
  "situation": {
    "year": 2024,
    "parts": 2,
    "children": 1,
    "marital_status": "married"
  },
  "deductions": [
    {
      "id": "frais-pro",
      "name": "Frais professionnels",
      "category": "travail",
      "amount": 5000
    }
  ]
}
```

**Réponse** :
```json
{
  "success": true,
  "declaration": {
    "year": 2024,
    "status": "prepared",
    "tax_amount": 3420.50,
    "net_tax_amount": 3420.50,
    "taxable_income": 45000,
    "rfr": 50000
  }
}
```

### Exporter une Déclaration

**GET** `/api/fiscal/declaration/2024/export?format=text`

**Réponse** :
```
=== DÉCLARATION FISCALE 2024 ===

Statut: prepared
Revenu imposable: 45000.00 €
RFR (Revenu Fiscal de Référence): 50000.00 €

Impôt sur le revenu: 3420.50 €
Crédits d'impôt: 0.00 €
Net à payer: 3420.50 €

DÉDUCTIONS ET CRÉDITS:
  - Frais professionnels: 5000.00 € (deduction)
```

## 🔗 Liens Utiles

- [Service Public - Impôts](https://www.service-public.fr/particuliers/vosdroits/F12)
- [impots.gouv.fr](https://www.impots.gouv.fr/)
- [OpenFisca France](https://fr.openfisca.org/)
- [Legifrance - Code fiscal](https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069583/)

---

**Date de création** : 2024-12-01  
**Version** : 1.0.0  
**État** : ✅ Fonctionnel, 🔄 Améliorations en cours

