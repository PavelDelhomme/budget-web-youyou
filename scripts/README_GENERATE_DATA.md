# 📊 Guide d'utilisation des données de test

## ✅ Données générées

Des données complètes et réalistes ont été générées pour tester toutes les fonctionnalités du projet Budget sur les années **2024** et **2025**.

### 📋 Contenu des données générées

- **Années**: 2024 et 2025
- **3 Comptes bancaires**:
  - Compte Courant Principal (3200,50 €)
  - Livret A (8500,00 €)
  - Revolut (450,75 €)

- **2 Investissements** avec contributions ponctuelles:
  - Portefeuille Actions (Revolut) - 2800 €
    - Contribution mensuelle: 100 €
    - 3 contributions ponctuelles enregistrées
  - Bitcoin & Ethereum (Binance) - 1200 €
    - Contribution mensuelle: 50 €
    - 2 contributions ponctuelles enregistrées

- **2 Objectifs d'épargne**:
  - Épargne de précaution (6000 €)
  - Épargne minimale (3000 €)

- **2 Projets d'épargne**:
  - Vacances été 2025 (2500 €)
  - Nouveau laptop (1500 €)

- **90 dépenses en 2024** réparties sur toutes les catégories:
  - Alimentation (mensuel variable)
  - Transport
  - Logement
  - Loisirs & Sorties
  - Santé
  - Vêtements
  - High-Tech

- **17 dépenses en 2025** (janvier à mars)

- **5 Abonnements**:
  - Netflix (15,99 €/mois)
  - Spotify (9,99 €/mois)
  - Assurance voiture (65 €/mois)
  - Abonnement téléphone (25,99 €/mois)
  - Salle de sport (35 €/mois)

- **3 Dépenses fixes annuelles**:
  - Assurance habitation (mars)
  - Contrôle technique (juin)
  - Carte grise (août)

- **Revenus**:
  - Salaire mensuel: 2500 € (2024) → 2600 € (2025)
  - Prime de Noël en décembre 2024 (500 €)
  - Transactions d'épargne mensuelles

## 🚀 Installation des données

### Option 1: Via Docker (Recommandé)

1. Trouvez le nom de votre conteneur backend:
```bash
docker ps --format "{{.Names}}" | grep backend
```

2. Copiez le fichier dans le conteneur:
```bash
docker cp scripts/generated_data_dev_delhomme.ovh.json NOM_DU_CONTENEUR:/app/data/dev_delhomme.ovh.json
```

### Option 2: Copie manuelle

1. Vérifiez les permissions du dossier de données:
```bash
ls -la backend/data/
```

2. Si vous avez les permissions, copiez directement:
```bash
cp scripts/generated_data_dev_delhomme.ovh.json backend/data/dev_delhomme.ovh.json
```

3. Si vous n'avez pas les permissions (fichier appartenant à root), utilisez sudo:
```bash
sudo cp scripts/generated_data_dev_delhomme.ovh.json backend/data/dev_delhomme.ovh.json
sudo chown pactivisme:pactivisme backend/data/dev_delhomme.ovh.json
```

### Option 3: Via Makefile (si configuré)

Ajoutez cette commande dans votre Makefile:
```makefile
load-test-data:
	docker cp scripts/generated_data_dev_delhomme.ovh.json budget-web-backend:/app/data/dev_delhomme.ovh.json
```

Puis exécutez:
```bash
make load-test-data
```

## 📝 Utilisation

1. **Connectez-vous** avec l'email: `dev@delhomme.ovh`
2. **Explorez les données**:
   - Dashboard pour voir les statistiques globales
   - Année 2024 pour voir toutes les dépenses de l'année complète
   - Année 2025 pour voir les dépenses en cours
   - "Mes données" pour voir comptes, investissements, objectifs, projets

3. **Testez les fonctionnalités**:
   - Graphiques de dépenses par catégorie
   - Graphiques mensuels dépenses/revenus
   - Prédictions IA pour les années futures
   - Gestion des investissements avec contributions ponctuelles
   - Édition des dépenses, abonnements, etc.

## 🔄 Régénérer les données

Pour régénérer les données avec le script:

```bash
python3 scripts/generate_test_data.py
```

Le fichier sera créé dans `scripts/generated_data_dev_delhomme.ovh.json`

## ⚠️ Important

- Les données sont **réalistes mais fictives**
- Elles sont conçues pour tester **toutes les fonctionnalités** du projet
- Les montants et dates sont cohérents avec un budget mensuel de ~2500 €
- Les contributions ponctuelles d'investissement sont incluses pour tester cette nouvelle fonctionnalité

## 🎯 Catégories de test incluses

- **Alimentation**: Budget mensuel variable (190-265 €)
- **Transport**: 100 €/mois (essence, etc.)
- **Logement**: 600 €/mois (loyer, charges)
- **Loisirs**: Variable selon les mois (50-300 €)
- **Santé**: 50 €/mois
- **Vêtements**: Variable (30-150 € selon les saisons)
- **High-Tech**: Achat ponctuels (50-250 €)

Toutes les données sont prêtes à être utilisées ! 🎉

