# 🌍 Gestion Fiscale Adaptative par Pays/Région

## 📋 Vue d'ensemble

Le système de gestion fiscale s'adapte automatiquement selon la **région et le pays** sélectionnés dans le profil utilisateur. Il fournit des informations détaillées et spécifiques à chaque pays.

## ✨ Fonctionnalités

### 1. 🗺️ Auto-détection du Pays

Le système détecte automatiquement le pays de l'utilisateur depuis :
- `globalData.userProfile.geographic_location.country`

Si non disponible, il utilise la **France (FR)** par défaut.

### 2. 📅 Calendrier Fiscal Adaptatif

Le calendrier fiscal s'adapte automatiquement selon le pays :
- **Dates limites de déclaration** spécifiques à chaque pays
- **Dates importantes** (ouverture, échéances, prélèvements)
- **Informations contextuelles** selon le pays

### 3. 📊 Informations Fiscales Détaillées par Pays

Pour chaque pays, le système fournit :
- **Autorité fiscale** : Nom, site web, URL de déclaration en ligne
- **Année fiscale** : Dates de début/fin, échéance de déclaration
- **Notes** : Informations générales sur le système fiscal
- **Provisions spéciales** : Particularités du système (déductions, crédits, etc.)

## 🌎 Pays Supportés

### 🇫🇷 France (FR)
- **Échéance** : 31 mai
- **Autorité** : DGFiP (impots.gouv.fr)
- **Particularités** :
  - Prélèvement à la source depuis 2019
  - Déclaration préremplie disponible
  - Déductions importantes pour frais professionnels
  - Crédits d'impôt pour travaux énergétiques

### 🇧🇪 Belgique (BE)
- **Échéance** : 30 juin
- **Autorité** : Service Public Fédéral Finances
- **Particularités** :
  - Déclaration commune pour couples mariés
  - Déductions importantes pour frais professionnels
  - Crédit d'impôt pour investissements

### 🇨🇭 Suisse (CH)
- **Échéance** : 31 mars
- **Autorité** : Administration fédérale des contributions
- **Particularités** :
  - Impôt au forfait possible
  - Déductions cantonales variables
  - Taux variables selon le canton

### 🇨🇦 Canada (CA)
- **Échéance** : 30 avril
- **Autorité** : Agence du revenu du Canada
- **Particularités** :
  - Impôt fédéral + impôt provincial
  - Déductions importantes pour REER
  - Crédits d'impôt pour études

### 🇺🇸 États-Unis (US)
- **Échéance** : 15 avril
- **Autorité** : Internal Revenue Service (IRS)
- **Particularités** :
  - Filing status important
  - Déductions standard ou détaillées
  - Crédits d'impôt pour enfants
  - Déclarations d'État séparées

### 🇬🇧 Royaume-Uni (GB)
- **Échéance** : 31 janvier
- **Année fiscale** : 6 avril au 5 avril
- **Autorité** : HM Revenue and Customs (HMRC)
- **Particularités** :
  - Année fiscale du 6 avril au 5 avril
  - Personal Allowance (abattement)
  - Tax-free ISA
  - Déclaration Self-Assessment

## 🏗️ Architecture

### Backend

#### Module Principal : `backend/api/fiscal_country_manager.py`

**Classes Principales** :

1. **`CountryFiscalSystem`** : Représente le système fiscal d'un pays
   - Code pays ISO
   - Dates importantes (début/fin année fiscale, échéance)
   - Autorité fiscale (nom, site web, URL déclaration)
   - Notes et provisions spéciales

2. **`CountryFiscalManager`** : Gestionnaire des systèmes fiscaux
   - `get_fiscal_system(country_code)` : Récupère un système fiscal
   - `get_fiscal_calendar(country_code, year)` : Calendrier adaptatif
   - `get_tax_info(country_code)` : Informations détaillées
   - `get_available_countries()` : Liste des pays disponibles

#### Routes API : `backend/api/fiscal_country_routes.py`

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/fiscal/country-info` | GET | Informations fiscales détaillées (auto-détection ou pays spécifié) |
| `/api/fiscal/available-countries` | GET | Liste des pays avec systèmes fiscaux disponibles |

#### Routes Intégrées : `backend/api/fiscal_service.py`

- **`/api/fiscal/calendar/<year>`** : Calendrier fiscal adaptatif
  - Détecte automatiquement le pays depuis le profil utilisateur
  - Fusionne calendrier générique + calendrier spécifique pays
  - Inclut les informations fiscales du pays

## 📊 Flux d'Utilisation

### Scénario 1 : Calendrier Fiscal Adaptatif

```
1. L'utilisateur ouvre "Déclarations fiscales"
   ↓
2. Le système détecte automatiquement le pays depuis :
   globalData.userProfile.geographic_location.country
   ↓
3. Le calendrier fiscal s'adapte :
   - Dates limites spécifiques au pays
   - Dates importantes (ouverture, échéances)
   - Informations contextuelles
   ↓
4. Affichage dans l'onglet "Calendrier"
```

### Scénario 2 : Informations Fiscales Détaillées

```
1. L'utilisateur consulte les informations fiscales
   ↓
2. Le système récupère les infos du pays détecté
   ↓
3. Affichage :
   - Autorité fiscale (nom, site web, URL déclaration)
   - Année fiscale (dates, échéance)
   - Notes et particularités
   - Provisions spéciales
```

### Scénario 3 : Changement de Pays

```
1. L'utilisateur modifie son profil (localisation)
   ↓
2. Le système fiscal s'adapte automatiquement :
   - Nouveau calendrier fiscal
   - Nouvelles déductions disponibles
   - Nouvelles réglementations
   - Nouvelles dates importantes
```

## 🔄 Intégration avec le Profil Utilisateur

Le système utilise automatiquement :
```typescript
globalData.userProfile.geographic_location.country
```

Si non disponible, utilise **FR (France)** par défaut.

### Exemple de Structure

```typescript
interface GeographicLocation {
  region?: string;        // "europe"
  country?: string;       // "FR"
  countryName?: string;   // "France"
  city?: string;          // "Paris"
  department?: string;    // "Paris"
}
```

## 🚀 Améliorations Futures

### Court Terme
- [ ] Ajouter plus de pays (ES, IT, DE, NL, etc.)
- [ ] Enrichir les calendriers fiscaux par pays
- [ ] Ajouter déductions spécifiques par pays

### Moyen Terme
- [ ] Réglementations fiscales par pays
- [ ] Barèmes d'imposition par pays
- [ ] Simulateurs fiscaux par pays

### Long Terme
- [ ] Intégration avec APIs gouvernementales par pays
- [ ] Détection automatique des changements de réglementation
- [ ] Comparaison fiscale multi-pays

## 📚 Documentation API

### Récupérer les Informations Fiscales d'un Pays

**GET** `/api/fiscal/country-info?country=FR`

**Réponse** :
```json
{
  "success": true,
  "fiscal_info": {
    "country_code": "FR",
    "country_name": "France",
    "region": "europe",
    "tax_authority": {
      "name": "Direction Générale des Finances Publiques (DGFiP)",
      "website": "https://www.impots.gouv.fr",
      "online_declaration": "https://www.impots.gouv.fr/portail"
    },
    "fiscal_year": {
      "start": "01-01",
      "end": "12-31",
      "declaration_deadline": "05-31"
    },
    "notes": "Système fiscal français avec impôt progressif...",
    "special_provisions": [
      "Prélèvement à la source depuis 2019",
      "Déclaration préremplie disponible",
      ...
    ]
  }
}
```

### Liste des Pays Disponibles

**GET** `/api/fiscal/available-countries`

**Réponse** :
```json
{
  "success": true,
  "countries": [
    {
      "code": "FR",
      "name": "France",
      "region": "europe"
    },
    {
      "code": "BE",
      "name": "Belgique",
      "region": "europe"
    },
    ...
  ]
}
```

### Calendrier Fiscal Adaptatif

**GET** `/api/fiscal/calendar/2025`

**Réponse** :
```json
{
  "success": true,
  "year": 2025,
  "country": "FR",
  "important_dates": [
    {
      "date": "2025-03-01",
      "event": "Ouverture déclaration en ligne (France)",
      "type": "deadline",
      "important": true,
      "description": "...",
      "country": "FR"
    },
    ...
  ],
  "fiscal_info": {
    ...
  }
}
```

## 🔗 Liens Utiles

- [FISCAL_MANAGEMENT.md](./FISCAL_MANAGEMENT.md) - Documentation générale du système fiscal
- [API_GOUV.md](./API_GOUV.md) - Intégration avec APIs gouvernementales

---

**Date de création** : 2025-01-XX  
**Version** : 1.0.0  
**État** : ✅ Fonctionnel, 🔄 Enrichissement en cours

