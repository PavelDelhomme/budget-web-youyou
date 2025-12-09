# 🏛️ Documentation - API Gouvernementales Françaises

## 📋 Vue d'ensemble

Ce document décrit l'intégration des API gouvernementales françaises dans le système de budget. Ces API permettent d'accéder à des données fiscales officielles, de simuler des calculs socio-fiscaux, et d'améliorer la précision des prévisions budgétaires.

**Source principale** : [data.gouv.fr - Recherche APIs Impôts](https://www.data.gouv.fr/dataservices/search?q=impots)

## 🎯 API Intégrées

### Liste Complète des APIs Disponibles sur data.gouv.fr

Voici la liste complète des APIs gouvernementales françaises disponibles sur [data.gouv.fr](https://www.data.gouv.fr/dataservices/search?q=impots) pour la gestion fiscale et financière :

#### APIs avec Accès Restreint (Habilitation Requise)

1. **API Impôt Particulier** (DGFiP)
   - **Organisation** : Ministère de l'Économie, des Finances et de l'Industrie
   - **Accès** : Restreint (habilitation DGFiP requise)
   - **Mis à jour** : 4 déc. 2025
   - **Description** : Échange d'informations fiscales entre la DGFiP et applications tierces
   - **Utilisation** : ✅ Intégrée dans le système (en attente d'habilitation)

2. **API Fichier des Comptes Bancaires et Assimilés (FICOBA)** (DGFiP)
   - **Organisation** : Ministère de l'Économie, des Finances et de l'Industrie
   - **Accès** : Restreint
   - **Mis à jour** : 4 déc. 2025
   - **Description** : Accès au fichier des comptes bancaires (déclarations fiscales)
   - **Utilisation potentielle** : Vérification automatique des comptes bancaires déclarés pour les déclarations fiscales, réconciliation avec les données utilisateur

3. **API Service Finances Publiques (SFiP)** (DGFiP)
   - **Organisation** : Ministère de l'Économie, des Finances et de l'Industrie
   - **Accès** : Restreint
   - **Mis à jour** : 4 déc. 2025
   - **Description** : Services des finances publiques
   - **Utilisation potentielle** : Accès à des services complémentaires des finances publiques

4. **API Recherche des personnes physiques (R2P)** (DGFiP)
   - **Organisation** : Ministère de l'Économie, des Finances et de l'Industrie
   - **Accès** : Restreint
   - **Mis à jour** : 4 déc. 2025
   - **Description** : Recherche d'informations sur les personnes physiques
   - **Utilisation potentielle** : Vérification d'identité, recherche d'informations fiscales sur des personnes

5. **API Tiers de prestation** (URSSAF)
   - **Organisation** : Unions de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales
   - **Accès** : Restreint
   - **Mis à jour** : 20 oct. 2025
   - **Description** : Gestion des tiers de prestation (cotisations sociales)
   - **Utilisation potentielle** : Calcul automatique des cotisations sociales pour employeurs, gestion des déclarations sociales

6. **API Tierce Déclaration Cesu** (URSSAF)
   - **Organisation** : Unions de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales
   - **Accès** : Restreint
   - **Mis à jour** : 20 oct. 2025
   - **Description** : Déclarations Cesu (Chèque Emploi Service Universel)
   - **Utilisation potentielle** : Déclarations automatiques pour emploi à domicile, calcul des cotisations Cesu

7. **RIAL (Répertoire Inter-Administratif des Locaux)** (DGFiP)
   - **Organisation** : Ministère de l'Économie, des Finances et de l'Industrie
   - **Accès** : Restreint
   - **Mis à jour** : 4 déc. 2025
   - **Description** : Répertoire des locaux à usage fiscal
   - **Utilisation potentielle** : Identification des locaux pour calcul de taxes foncières, vérification des adresses fiscales

8. **API Tierce Déclaration Pajemploi** (URSSAF)
   - **Organisation** : Unions de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales
   - **Accès** : Restreint
   - **Mis à jour** : 20 oct. 2025
   - **Description** : Déclarations Pajemploi (emploi à domicile)
   - **Utilisation potentielle** : Déclarations automatiques pour employeurs à domicile, gestion des cotisations Pajemploi

#### APIs en Accès Ouvert

9. **API Mon entreprise** (URSSAF)
   - **Organisation** : Unions de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales
   - **Accès** : Ouvert
   - **Mis à jour** : 7 nov. 2024
   - **Description** : Simulateur de revenus et cotisations selon le statut professionnel
   - **Utilisation** : ✅ Intégrée dans le système

10. **OpenFisca**
    - **Organisation** : Agence nationale de la cohésion des territoires
    - **Accès** : Ouvert
    - **Mis à jour** : 7 nov. 2024
    - **Description** : Bibliothèque open-source de simulation du système socio-fiscal français
    - **Utilisation** : ✅ Intégrée dans le système

11. **API Résultats de qualité des services publics**
    - **Organisation** : Direction Interministérielle de la Transformation Publique
    - **Accès** : Ouvert
    - **Mis à jour** : 7 nov. 2024
    - **Description** : Qualité des services publics
    - **Utilisation potentielle** : Évaluation de la qualité des services publics utilisés par l'utilisateur, informations sur les performances des services

12. **API Services Publics Plus - Structures**
    - **Organisation** : Direction Interministérielle de la Transformation Publique
    - **Accès** : Ouvert
    - **Mis à jour** : 7 nov. 2024
    - **Description** : Informations sur les structures de services publics
    - **Utilisation potentielle** : Recherche d'informations sur les services publics locaux, identification des structures compétentes

---

## 📚 APIs Détaillées (Intégrées dans le Système)

### 1. API Impôt Particulier (DGFiP)

**Source** : [data.gouv.fr - API Impôt Particulier](https://www.data.gouv.fr/dataservices/api-impot-particulier/)

#### Description
L'API Impôt Particulier permet l'échange d'informations fiscales entre la DGFiP (Direction Générale des Finances Publiques) et des applications tierces, dans le cadre de démarches administratives dématérialisées.

#### Données Disponibles

| Donnée | Description | Utilisation |
|--------|-------------|-------------|
| **Revenu fiscal de référence (RFR)** | Revenu fiscal de référence de l'année N-2 | Calcul de l'éligibilité à certaines aides, optimisations fiscales |
| **Nombre de parts fiscales** | Nombre de parts du foyer fiscal | Calculs d'impôts précis |
| **Situation familiale** | État civil, nombre d'enfants | Affinement des calculs fiscaux |
| **Adresse fiscale de taxation** | Adresse déclarée aux impôts | Vérification et mise à jour des données |

#### Authentification

**Méthode** : FranceConnect (recommandé) ou Identifiant Fiscal (SPI)

**Habilitation requise** :
- ✅ Demande d'habilitation obligatoire auprès de la DGFiP
- ✅ Formulaire disponible sur [data.gouv.fr](https://www.data.gouv.fr/dataservices/api-impot-particulier/)
- ✅ Justification de l'utilisation (mission d'intérêt général)
- ⏳ Délai d'obtention : Variable (quelques semaines à plusieurs mois)

#### Endpoints Implémentés

```python
# backend/api/government_apis/impot_particulier.py

POST /api/government/impot/sync
# Synchronise les données fiscales depuis la DGFiP
# Nécessite authentification FranceConnect

POST /api/government/impot/estimate
# Estime les impôts sur le revenu
# Utilise OpenFisca en fallback si API non accessible
```

#### Exemple d'Utilisation

```javascript
// Synchronisation des données fiscales
const response = await fetch('/api/government/impot/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' // Cookie de session requis
});

const data = await response.json();
// {
//   "success": true,
//   "data": {
//     "revenu_fiscal_reference": 45000,
//     "nombre_parts_fiscales": 2,
//     "situation_familiale": "marié, 2 enfants",
//     "adresse_fiscale": "..."
//   }
// }
```

#### Configuration

```bash
# Variables d'environnement requises
IMPOT_CLIENT_ID=your_client_id_here
IMPOT_CLIENT_SECRET=your_client_secret_here
IMPOT_API_URL=https://api.impots.gouv.fr/particulier/v1
```

#### État Actuel

- ✅ **Structure créée** : Modules Python prêts
- ✅ **Endpoints créés** : Routes Flask implémentées
- ⏳ **En attente** : Habilitation DGFiP pour accès réel
- 📝 **Mode dégradé** : Utilise des calculs simplifiés en attendant

---

### 2. API Mon Entreprise (URSSAF)

**Source** : [data.gouv.fr - API Mon Entreprise](https://www.data.gouv.fr/dataservices/api-mon-entreprise/)

#### Description
Mon Entreprise est un simulateur proposé par l'URSSAF pour estimer les revenus et cotisations sociales selon le statut (salarié, auto-entrepreneur, entreprise individuelle, etc.).

#### Fonctionnalités

##### A. Simulation Salaire (Salarié)

**Calculs fournis** :
- Salaire brut → Salaire net
- Cotisations sociales (employeur et salarié)
- Impôt sur le revenu estimé
- Revenu disponible réel

**Endpoints** :
```python
POST /api/government/entreprise/simulate-salary
Body: {
  "gross_salary": 3000  # Salaire brut mensuel
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "simulation": {
    "gross_salary": 3000,
    "social_contributions": 690,
    "taxable_salary": 2310,
    "estimated_monthly_tax": 230,
    "estimated_annual_tax": 2760,
    "net_salary": 2080,
    "note": "Calcul approximatif. Utilisez l'API officielle pour des calculs précis."
  }
}
```

##### B. Simulation Auto-Entrepreneur

**Calculs fournis** :
- Chiffre d'affaires → Revenu net
- Cotisations sociales (taux selon activité)
- Charges déductibles
- Revenu disponible après cotisations

**Taux de cotisations** :
- **Services** : 22% (BIC) ou 17% (BNC)
- **Commercial** : 12.5% (vente de marchandises)
- **Artisanal** : 17% (prestations de services artisanales)

**Endpoints** :
```python
POST /api/government/entreprise/simulate-auto-entrepreneur
Body: {
  "turnover": 2000,           # Chiffre d'affaires mensuel
  "activity_type": "service"  # "service", "commercial", ou "artisanal"
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "simulation": {
    "turnover": 2000,
    "activity_type": "service",
    "social_contributions_rate": 22,
    "social_contributions": 440,
    "net_income": 1560,
    "annual_turnover": 24000,
    "note": "Calcul approximatif. Utilisez l'API officielle pour des calculs précis."
  }
}
```

##### C. Simulation Entreprise Individuelle

**Calculs fournis** :
- Revenus d'activité → Revenu imposable
- Cotisations sociales (TNS)
- Charges déductibles
- Revenu net après impôts

**Endpoints** :
```python
POST /api/government/entreprise/simulate-entreprise-individual
Body: {
  "revenue": 5000,
  "charges": 500
}
```

#### Configuration

```bash
# URL de l'API (publique, pas d'authentification requise)
MON_ENTREPRISE_API_URL=https://mon-entreprise.urssaf.fr/api/v1
```

#### État Actuel

- ✅ **Implémenté** : Calculs simplifiés fonctionnels
- ✅ **Endpoints créés** : Routes Flask prêtes
- 📝 **Note** : Utilise des calculs approximatifs basés sur les taux officiels
- 🔄 **Amélioration future** : Intégration API officielle pour précision maximale

---

### 3. OpenFisca

**Source** : [data.gouv.fr - OpenFisca](https://www.data.gouv.fr/dataservices/openfisca/)

#### Description
OpenFisca est une bibliothèque open-source de simulation du système socio-fiscal français. Elle permet de calculer précisément les impôts, cotisations sociales, et prestations selon la législation en vigueur.

#### Avantages

- ✅ **Précision** : Calculs conformes à la législation française
- ✅ **Transparence** : Code source ouvert et vérifiable
- ✅ **Complétude** : Couvre impôts, cotisations, aides, prestations
- ✅ **Actualisation** : Mise à jour régulière selon la loi

#### Calculs Disponibles

##### Impôt sur le Revenu

**Paramètres d'entrée** :
- Revenu imposable annuel
- Nombre de parts fiscales
- Situation familiale
- Revenus exceptionnels
- Charges déductibles

**Sorties** :
- Montant de l'impôt sur le revenu
- Taux marginal d'imposition
- Revenu fiscal de référence
- Éligibilité aux réductions d'impôts

**Endpoints** :
```python
POST /api/government/openfisca/calculate-tax
Body: {
  "annual_income": 50000,
  "situation": {
    "year": 2024,
    "parts": 2,
    "children": 1,
    "marital_status": "married"
  }
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "calculation": {
    "impot_revenu": 3420,
    "revenu_fiscal_reference": 50000,
    "parts": 2,
    "income_per_part": 25000,
    "source": "openfisca",
    "note": "Calcul basé sur la législation fiscale 2024"
  }
}
```

##### Prestations Sociales

OpenFisca peut également calculer :
- Aides au logement (APL, ALF, ALS)
- Prime d'activité
- Complémentaire santé solidaire (CMU-C)
- Aide aux personnes âgées (APA)
- Et plus de 100 autres prestations

#### Configuration

```bash
# URL de l'API publique OpenFisca
OPENFISCA_URL=https://api.openfisca.fr/api/2

# Alternative : Installation locale (pour plus de contrôle)
# docker run -p 2000:2000 openfisca/openfisca-france
# OPENFISCA_URL=http://localhost:2000/api/2
```

#### Installation Locale (Optionnel)

Pour plus de sécurité et de contrôle, OpenFisca peut être installé localement :

```bash
# Docker
docker pull openfisca/openfisca-france
docker run -p 2000:2000 openfisca/openfisca-france

# Python
pip install openfisca-france
```

**Avantages installation locale** :
- ✅ Données fiscales ne quittent pas votre serveur
- ✅ Pas de limite de requêtes
- ✅ Personnalisation possible
- ✅ Déploiement privé

#### État Actuel

- ✅ **Implémenté** : Structure complète créée
- ✅ **Endpoints créés** : Routes Flask prêtes
- ✅ **Calculs simplifiés** : Mode fallback fonctionnel
- 🔄 **Amélioration future** : Intégration complète de l'API OpenFisca

---

## 🔄 Flux d'Utilisation Typique

### Scénario 1 : Simulation de Salaire Net

```
1. Utilisateur saisit son salaire brut mensuel (3000€)
   ↓
2. Frontend appelle /api/government/entreprise/simulate-salary
   ↓
3. Backend calcule :
   - Cotisations sociales (690€)
   - Salaire imposable (2310€)
   - Estimation impôt (230€/mois)
   - Salaire net final (2080€)
   ↓
4. Affichage dans l'interface
   - Pour budget mensuel : 2080€ net
   - Pour déclaration : 27720€ annuel brut
```

### Scénario 2 : Calcul d'Impôts Précis

```
1. Utilisateur saisit ses revenus annuels (50000€)
   ↓
2. Frontend appelle /api/government/openfisca/calculate-tax
   ↓
3. Backend interroge OpenFisca avec :
   - Revenu : 50000€
   - Parts : 2
   - Année : 2024
   ↓
4. OpenFisca retourne :
   - Impôt : 3420€
   - RFR : 50000€
   ↓
5. Affichage dans le budget :
   - Réduction mensuelle : 285€/mois
   - Impact sur projections annuelles
```

### Scénario 3 : Synchronisation Données Fiscales

```
1. Utilisateur se connecte via FranceConnect
   ↓
2. Frontend demande synchronisation fiscale
   ↓
3. Backend appelle API DGFiP avec token FranceConnect
   ↓
4. DGFiP retourne :
   - RFR N-2 : 45000€
   - Parts fiscales : 2
   - Situation familiale
   ↓
5. Données intégrées dans le budget :
   - Mise à jour revenus déclarés
   - Ajustement des projections
   - Optimisations suggérées
```

---

## 🔐 Sécurité et Confidentialité

### Données Sensibles

Les API gouvernementales peuvent fournir des données très sensibles :
- ✅ Revenus fiscaux
- ✅ Situation familiale
- ✅ Adresses
- ✅ Informations d'identification

### Mesures de Sécurité

1. **Authentification forte**
   - FranceConnect pour API DGFiP
   - Sessions sécurisées (HTTPOnly, Secure, SameSite)

2. **Chiffrement**
   - Toutes les communications en HTTPS
   - Certificats SSL valides

3. **Stockage limité**
   - ⚠️ Ne pas stocker les données fiscales sans nécessité
   - ⚠️ Chiffrer si stockage nécessaire
   - ⚠️ Respecter RGPD

4. **Audit trail**
   - Loguer tous les accès aux données fiscales
   - Traçabilité complète

### Conformité RGPD

- ✅ Consentement explicite pour accès données fiscales
- ✅ Droit à l'effacement
- ✅ Portabilité des données
- ✅ Accès transparent aux données utilisées

---

## 📊 Intégration dans le Budget

### Cas d'Usage

#### 1. Prédictions Budgétaires Améliorées

Les données fiscales permettent de :
- Affiner les prédictions de revenus disponibles
- Calculer l'impact réel des impôts sur le budget
- Optimiser les projections sur plusieurs années

#### 2. Optimisation Fiscale

- Suggérer des optimisations légales
- Calculer l'impact de changements de situation
- Proposer des stratégies d'investissement avantageuses

#### 3. Simulation de Scénarios

- "Et si je gagnais 10% de plus ?"
- "Impact d'un changement de statut professionnel"
- "Simulation d'une activité complémentaire"

---

## 🚧 Limitations et Améliorations Futures

### Limitations Actuelles

1. **API Impôt Particulier**
   - ⏳ Nécessite habilitation (en attente)
   - ⏳ Mode dégradé avec calculs simplifiés

2. **API Mon Entreprise**
   - 📝 Calculs approximatifs (basés sur taux moyens)
   - 📝 Pas d'accès à l'API officielle complète

3. **OpenFisca**
   - 📝 Mode fallback avec calculs simplifiés
   - 📝 Pas d'utilisation complète de toutes les prestations

### Améliorations Prévues

- [ ] Habilitation API Impôt Particulier obtenue
- [ ] Intégration complète OpenFisca avec toutes les prestations
- [ ] Interface de simulation de scénarios fiscaux
- [ ] Export des calculs pour déclaration d'impôts
- [ ] Alertes pour optimisations fiscales
- [ ] Comparaison multi-années avec historique fiscal

---

## 📚 Ressources

### Documentation Officielle

- [API Impôt Particulier](https://www.data.gouv.fr/dataservices/api-impot-particulier/)
- [API Mon Entreprise](https://www.data.gouv.fr/dataservices/api-mon-entreprise/)
- [OpenFisca Documentation](https://openfisca.org/doc/)
- [OpenFisca France](https://fr.openfisca.org/)

### Contact et Support

- **DGFiP** : dtnum.donnees.demande-acces@dgfip.finances.gouv.fr
- **URSSAF** : Via le formulaire de contact sur mon-entreprise.urssaf.fr
- **OpenFisca** : Via GitHub ou la communauté open-source

### Liens Utiles

- [FranceConnect](https://franceconnect.gouv.fr/) - Authentification sécurisée
- [data.gouv.fr](https://www.data.gouv.fr/) - Catalogue des API publiques
- [Legifrance](https://www.legifrance.gouv.fr/) - Textes de loi fiscaux

---

## ✅ Checklist d'Activation

- [x] Structure backend créée (`backend/api/government_apis/`)
- [x] Endpoints Flask créés (`backend/api/government_service.py`)
- [x] Calculs simplifiés implémentés (mode fallback)
- [x] Documentation complète (ce fichier)
- [ ] **À FAIRE** : Habilitation API Impôt Particulier (demande DGFiP)
- [ ] **À FAIRE** : Intégration complète OpenFisca (toutes prestations)
- [ ] **À FAIRE** : Interface frontend pour simulations
- [ ] **À FAIRE** : Tests d'intégration avec API réelles
- [ ] **À FAIRE** : Configuration FranceConnect (si nécessaire)

---

**Date de création** : 2024-12-01  
**Version** : 1.0.0  
**État** : ✅ Structure prête, ⏳ Habilitation en attente

