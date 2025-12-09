# 📊 Guide : Interface de Test des Graphiques

## 🚀 Comment accéder à l'interface de test

1. **Lancer l'application** :
   ```bash
   cd client
   npm run dev
   ```

2. **Dans la barre latérale** (Sidebar), cliquez sur le bouton **"🧪 Test Graphiques"**

3. **Ou directement dans le code** :
   - Le bouton est dans : `client/src/components/layout/Sidebar.tsx` (ligne ~188-194)
   - L'interface est rendue dans : `client/src/App.tsx` (ligne ~1447-1454)

---

## 📁 Fichiers à modifier pour personnaliser

### 🎯 **Fichier principal de l'interface de test**

**`client/src/components/test/ChartsTestInterface.tsx`**
- **C'est LE fichier principal** à modifier
- Contient toutes les 10 variantes de graphiques
- Contient le graphique de tendances SVG
- Contient les autres graphiques de test

**Sections importantes** :
- Lignes 236-245 : En-tête "10 Variantes"
- Lignes 247-494 : Les 10 variantes du graphique MonthlyExpensesIncomeChart
- Lignes 495-546 : Graphique Évolution par catégorie
- Lignes 547-560 : Graphique Répartition (Pie Chart)
- Lignes 620-684 : **Graphique de tendances SVG** (celui que vous mentionnez)

---

### 📊 **Composants de graphiques**

#### 1. **Graphique principal (Chart.js)**
**`client/src/components/charts/MonthlyExpensesIncomeChartChartJS.tsx`**
- Composant utilisé pour les 10 variantes
- Configuration Chart.js : `beginAtZero`, `min: 0`, `grace: 0`, `afterDataLimits`
- Options personnalisables : couleurs, hauteur, etc.

**Modifications courantes** :
- Lignes 240-286 : Options Chart.js (`scales.y` pour l'axe Y)
- Lignes 215-237 : Données du graphique (labels, datasets)

#### 2. **Graphique simple pour test**
**`client/src/components/test/SimpleChartJSTest.tsx`**
- Graphiques simples pour comparaison
- Barres et ligne avec données hardcodées
- Utile pour tester si Chart.js fonctionne correctement

#### 3. **Graphique évolution par catégorie** (qui fonctionne bien)
**`client/src/components/charts/CategoryEvolutionChart.tsx`**
- Référence : celui qui part correctement de 0€
- Lignes 94-111 : Configuration de l'axe Y (à copier si besoin)

---

### 🎨 **Graphique SVG de tendances** (celui qui ne partait pas de 0€)

**Fichier** : `client/src/components/test/ChartsTestInterface.tsx`

**Section à modifier** : Lignes **620-684**

**Calculs importants** :
```typescript
// AVANT (ne partait pas de 0€) :
const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
const y = 250 - (m.total / maxExpense) * 200;

// APRÈS (part de 0€) :
const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
const minExpense = 0; // Toujours partir de 0€
const range = maxExpense - minExpense || 1;
const y = 250 - ((m.total - minExpense) / range) * 200;
```

**Pour modifier** :
- Ligne 638 : Calcul de `maxExpense`
- Lignes 635-641 : Polyline (ligne de tendance)
- Lignes 649-656 : Polygon (zone remplie)
- Lignes 659-671 : Points sur la ligne
- Lignes 634-648 : Axe Y et labels (nouvellement ajouté)

---

## 🔧 Modifications courantes

### Modifier les couleurs d'un graphique

**Dans `ChartsTestInterface.tsx`** (exemple variante 4) :
```typescript
<MonthlyExpensesIncomeChartChartJS
  // ... autres props
  incomeColor="#3B82F6"  // ← Couleur des revenus
  expenseColor="#8B5CF6" // ← Couleur des dépenses
/>
```

### Modifier la hauteur d'un graphique

**Dans `ChartsTestInterface.tsx`** :
```typescript
<MonthlyExpensesIncomeChartChartJS
  // ... autres props
  height={400} // ← Hauteur en pixels
/>
```

### Ajouter une nouvelle variante

**Dans `ChartsTestInterface.tsx`**, après la variante 10 (ligne ~494) :
```typescript
{/* Variante 11 : Votre nouvelle variante */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
  <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
    1️⃣1️⃣ Votre Variante
  </h3>
  <div className="w-full min-w-0">
    <MonthlyExpensesIncomeChartChartJS
      expenses={testYearData.expenses || []}
      monthlySalary={monthlySalary}
      // ... autres props
      height={400}
      variant="Votre Variante"
    />
  </div>
</div>
```

### Modifier l'axe Y pour forcer à partir de 0€

**Dans `MonthlyExpensesIncomeChartChartJS.tsx`** (lignes 272-284) :
```typescript
y: {
  beginAtZero: true,  // ✅ Déjà présent
  min: 0,              // ✅ Déjà présent
  grace: 0,            // ✅ Déjà présent
  afterDataLimits: (scale: any) => {
    scale.min = 0;     // ✅ Force min à 0
    scale.max = maxValue;
  },
  // ...
}
```

---

## 🗂️ Structure des fichiers

```
client/src/
├── App.tsx                                    ← Rendu conditionnel (ligne 1447)
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                        ← Bouton "Test Graphiques" (ligne 188)
│   ├── test/
│   │   ├── ChartsTestInterface.tsx            ← ⭐ FICHIER PRINCIPAL
│   │   └── SimpleChartJSTest.tsx              ← Graphiques simples pour test
│   └── charts/
│       ├── MonthlyExpensesIncomeChartChartJS.tsx  ← Graphique principal Chart.js
│       ├── CategoryEvolutionChart.tsx             ← Graphique référence (fonctionne)
│       └── ExpensesPieChart.tsx                   ← Graphique camembert
```

---

## 🎯 Checklist pour modifier

1. ✅ **Ouvrir** `client/src/components/test/ChartsTestInterface.tsx`
2. ✅ **Localiser** la section à modifier (variante X, tendances SVG, etc.)
3. ✅ **Modifier** les props, styles, ou calculs
4. ✅ **Sauvegarder** et voir les changements en temps réel (Hot Reload)
5. ✅ **Vérifier** dans le navigateur sur `http://localhost:6061`

---

## 💡 Conseils

- **Hot Reload** : Les modifications sont visibles automatiquement (pas besoin de recharger)
- **Mode sombre** : Testez avec le toggle dark/light mode
- **Responsive** : Vérifiez sur mobile/tablette (réduire la fenêtre)
- **Console** : Ouvrez la console du navigateur (F12) pour voir les erreurs

---

## 📝 Notes importantes

- Le graphique **CategoryEvolutionChart** fonctionne bien → utilisez-le comme référence
- Le graphique SVG de tendances est dans **ChartsTestInterface.tsx** (lignes 620-684)
- Tous les graphiques Chart.js utilisent maintenant `beginAtZero: true` + `min: 0` + `grace: 0`

---

**Besoin d'aide ?** Regardez `CategoryEvolutionChart.tsx` (lignes 94-111) pour voir la configuration qui fonctionne !

