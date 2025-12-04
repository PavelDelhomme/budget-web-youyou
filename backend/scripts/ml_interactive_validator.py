#!/usr/bin/env python3
"""
Interface interactive en ligne de commande pour la validation des données ML
avec tests complets et benchmarks
"""
import sys
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import time

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.utils import load_user
from api.ml.data_validator import DataValidator
from api.ml_service import get_historical_data_for_ml
from api.ml.model import create_predictor
from api.ml.neural_network import create_neural_predictor


class Colors:
    """Codes ANSI pour les couleurs"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_colored(text: str, color: str = Colors.ENDC):
    """Afficher du texte coloré"""
    print(f"{color}{text}{Colors.ENDC}")


def print_header(text: str):
    """Afficher un en-tête"""
    print_colored(f"\n{'='*60}", Colors.HEADER)
    print_colored(f"  {text}", Colors.BOLD)
    print_colored(f"{'='*60}\n", Colors.HEADER)


def print_success(text: str):
    """Afficher un message de succès"""
    print_colored(f"✅ {text}", Colors.OKGREEN)


def print_error(text: str):
    """Afficher un message d'erreur"""
    print_colored(f"❌ {text}", Colors.FAIL)


def print_warning(text: str):
    """Afficher un avertissement"""
    print_colored(f"⚠️  {text}", Colors.WARNING)


def print_info(text: str):
    """Afficher une information"""
    print_colored(f"ℹ️  {text}", Colors.OKCYAN)


def format_currency(amount: float) -> str:
    """Formater un montant en devise"""
    return f"{amount:,.2f}€".replace(',', ' ')


def validate_user_email(email: str) -> bool:
    """Valider le format d'email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def get_user_email() -> str:
    """Demander l'email de l'utilisateur"""
    while True:
        email = input("📧 Email de l'utilisateur: ").strip()
        if validate_user_email(email):
            return email
        print_error("Format d'email invalide. Veuillez réessayer.")


def validate_data_interactive(user_email: str):
    """Valider les données de manière interactive"""
    print_header("VALIDATION DES DONNÉES")
    
    try:
        # Charger les données historiques
        print_info("Chargement des données historiques...")
        historical_data = get_historical_data_for_ml(user_email)
        
        if not historical_data:
            print_error("Aucune donnée historique trouvée pour cet utilisateur.")
            return
        
        print_success(f"{len(historical_data)} année(s) de données trouvée(s)")
        
        # Valider toutes les données
        validator = DataValidator(user_email)
        validation_results = validator.validate_all_historical_data(historical_data)
        
        # Afficher le résumé
        print_header("RÉSUMÉ DE LA VALIDATION")
        
        print(f"\n📊 Années validées: {validation_results['years_validated']}")
        print(f"✅ Années valides: {validation_results['valid_years']}")
        print(f"❌ Erreurs totales: {validation_results['total_errors']}")
        print(f"⚠️  Avertissements: {validation_results['total_warnings']}")
        print(f"📈 Score de complétude moyen: {validation_results['average_completeness']*100:.1f}%")
        
        # Statut de préparation pour l'entraînement
        if validation_results['is_ready_for_training']:
            print_success("✓ Données prêtes pour l'entraînement ML")
        else:
            print_error("✗ Données non prêtes pour l'entraînement ML")
        
        # Afficher les recommandations
        if validation_results.get('recommendations'):
            print_header("RECOMMANDATIONS")
            for rec in validation_results['recommendations']:
                print_warning(f"  • {rec}")
        
        # Afficher les détails par année
        if validation_results.get('year_results'):
            print_header("DÉTAILS PAR ANNÉE")
            
            for result in validation_results['year_results']:
                year = result['year']
                status = "✅ VALIDE" if result['is_valid'] else "❌ INVALIDE"
                completeness = result['completeness_score'] * 100
                
                print(f"\n📅 Année {year}: {status}")
                print(f"   Complétude: {completeness:.1f}%")
                print(f"   Erreurs: {len(result['errors'])}")
                print(f"   Avertissements: {len(result['warnings'])}")
                
                if result['errors']:
                    print_colored("   Erreurs:", Colors.FAIL)
                    for error in result['errors']:
                        print_colored(f"     • {error}", Colors.FAIL)
                
                if result['warnings']:
                    print_colored("   Avertissements:", Colors.WARNING)
                    for warning in result['warnings'][:5]:  # Limiter à 5
                        print_colored(f"     • {warning}", Colors.WARNING)
                    if len(result['warnings']) > 5:
                        print_colored(f"     ... et {len(result['warnings'])-5} autres", Colors.WARNING)
                
                # Afficher les statistiques
                stats = result.get('statistics', {})
                if stats:
                    print_info("   Statistiques:")
                    if stats.get('monthly_salary', 0) > 0:
                        print(f"     • Salaire mensuel: {format_currency(stats['monthly_salary'])}")
                    if stats.get('num_categories', 0) > 0:
                        print(f"     • Catégories: {stats['num_categories']}")
                    if stats.get('num_expenses', 0) > 0:
                        print(f"     • Dépenses: {stats['num_expenses']}")
        
        return validation_results
        
    except Exception as e:
        print_error(f"Erreur lors de la validation: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def run_ml_benchmarks(user_email: str):
    """Exécuter des benchmarks ML"""
    print_header("BENCHMARKS ML")
    
    try:
        # Charger les données
        print_info("Chargement des données...")
        historical_data = get_historical_data_for_ml(user_email)
        
        if len(historical_data) < 2:
            print_error(f"Pas assez de données (minimum 2 années requises, {len(historical_data)} disponibles)")
            return
        
        print_success(f"{len(historical_data)} années de données disponibles")
        
        # Test 1: Modèle traditionnel
        print_header("TEST 1: MODÈLE TRADITIONNEL (scikit-learn)")
        
        predictor_traditional = create_predictor(user_email)
        start_time = time.time()
        
        try:
            scores = predictor_traditional.train(historical_data)
            training_time = time.time() - start_time
            
            print_success(f"Entraînement réussi en {training_time:.2f}s")
            
            if 'error' not in scores:
                print_info(f"  Score R²: {scores.get('r2_score', 'N/A')}")
                print_info(f"  Score MAE: {scores.get('mae', 'N/A')}")
                print_info(f"  Score MSE: {scores.get('mse', 'N/A')}")
                
                # Test de prédiction
                if predictor_traditional.is_trained:
                    last_year = historical_data[-1]
                    future_years = [last_year['year'] + 1]
                    
                    predictions = predictor_traditional.predict(future_years, last_year['data'])
                    print_success(f"Prédiction générée pour l'année {future_years[0]}")
            else:
                print_error(f"Erreur: {scores.get('error')}")
                
        except Exception as e:
            print_error(f"Erreur lors de l'entraînement traditionnel: {str(e)}")
        
        # Test 2: Réseau neuronal
        print_header("TEST 2: RÉSEAU NEURONAL (TensorFlow/Keras)")
        
        predictor_neural = create_neural_predictor(user_email)
        
        if predictor_neural:
            start_time = time.time()
            
            try:
                scores = predictor_neural.train(historical_data, epochs=50)
                training_time = time.time() - start_time
                
                print_success(f"Entraînement réussi en {training_time:.2f}s")
                
                if 'error' not in scores:
                    print_info(f"  Score d'entraînement: {scores.get('train_score', 'N/A')}")
                    print_info(f"  Score de validation: {scores.get('val_score', 'N/A')}")
                    print_info(f"  Perte finale: {scores.get('final_loss', 'N/A')}")
                    
                    # Test de prédiction
                    if predictor_neural.is_trained:
                        last_year = historical_data[-1]
                        future_years = [last_year['year'] + 1]
                        
                        predictions = predictor_neural.predict(future_years, last_year['data'])
                        print_success(f"Prédiction générée pour l'année {future_years[0]}")
                else:
                    print_error(f"Erreur: {scores.get('error')}")
                    
            except Exception as e:
                print_warning(f"Réseau neuronal non disponible: {str(e)}")
                print_info("Utilisation du modèle traditionnel à la place")
        else:
            print_warning("Réseau neuronal non disponible")
            print_info("TensorFlow/Keras n'est pas installé")
        
        # Comparaison des performances
        print_header("COMPARAISON DES PERFORMANCES")
        
        print_info("Pour une comparaison complète, exécutez les deux modèles avec les mêmes données.")
        
    except Exception as e:
        print_error(f"Erreur lors des benchmarks: {str(e)}")
        import traceback
        traceback.print_exc()


def interactive_validation_menu(user_email: str):
    """Menu interactif pour la validation"""
    while True:
        print_header("MENU DE VALIDATION ML")
        
        print("1. Valider les données")
        print("2. Exécuter les benchmarks ML")
        print("3. Afficher les statistiques détaillées")
        print("4. Exporter les résultats de validation")
        print("5. Quitter")
        
        choice = input("\n👉 Votre choix: ").strip()
        
        if choice == '1':
            validate_data_interactive(user_email)
        elif choice == '2':
            run_ml_benchmarks(user_email)
        elif choice == '3':
            show_detailed_statistics(user_email)
        elif choice == '4':
            export_validation_results(user_email)
        elif choice == '5':
            print_success("Au revoir!")
            break
        else:
            print_error("Choix invalide. Veuillez réessayer.")


def show_detailed_statistics(user_email: str):
    """Afficher des statistiques détaillées"""
    print_header("STATISTIQUES DÉTAILLÉES")
    
    try:
        historical_data = get_historical_data_for_ml(user_email)
        validator = DataValidator(user_email)
        
        for year_data in historical_data:
            year = year_data['year']
            data = year_data['data']
            
            validation = validator.validate_year_data(year, data)
            stats = validation.get('statistics', {})
            
            print(f"\n📅 Année {year}:")
            print(f"   Complétude: {validation['completeness_score']*100:.1f}%")
            
            if stats:
                print(f"   Salaire annuel: {format_currency(stats.get('annual_salary', 0))}")
                print(f"   Dépenses totales: {format_currency(stats.get('expenses_total', 0))}")
                print(f"   Dépenses estimées: {format_currency(stats.get('total_expenses_estimated', 0))}")
                print(f"   Épargne estimée: {format_currency(stats.get('estimated_savings', 0))}")
                
    except Exception as e:
        print_error(f"Erreur: {str(e)}")


def export_validation_results(user_email: str):
    """Exporter les résultats de validation"""
    print_header("EXPORT DES RÉSULTATS")
    
    try:
        historical_data = get_historical_data_for_ml(user_email)
        validator = DataValidator(user_email)
        validation_results = validator.validate_all_historical_data(historical_data)
        
        # Générer un nom de fichier avec timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"validation_results_{user_email.replace('@', '_at_')}_{timestamp}.json"
        output_path = Path(__file__).parent.parent / 'data' / 'ml_validations' / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Exporter en JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(validation_results, f, indent=2, ensure_ascii=False, default=str)
        
        print_success(f"Résultats exportés vers: {output_path}")
        
        # Demander si l'utilisateur veut voir le résumé
        show = input("Voulez-vous voir le résumé? (o/n): ").strip().lower()
        if show == 'o':
            print(f"\n📊 Résumé:")
            print(f"   Années validées: {validation_results['years_validated']}")
            print(f"   Score de complétude: {validation_results['average_completeness']*100:.1f}%")
            print(f"   Prêt pour entraînement: {'Oui' if validation_results['is_ready_for_training'] else 'Non'}")
        
    except Exception as e:
        print_error(f"Erreur lors de l'export: {str(e)}")


def main():
    """Point d'entrée principal"""
    print_colored("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   Interface Interactive de Validation ML                  ║
    ║   Budget Annuel - Validation des Données                  ║
    ╚═══════════════════════════════════════════════════════════╝
    """, Colors.HEADER)
    
    # Demander l'email de l'utilisateur
    user_email = get_user_email()
    
    # Vérifier que l'utilisateur existe
    try:
        user_data = load_user(user_email)
        if not user_data:
            print_error(f"Aucune donnée trouvée pour {user_email}")
            return
        print_success(f"Données trouvées pour {user_email}")
    except Exception as e:
        print_error(f"Erreur lors du chargement des données: {str(e)}")
        return
    
    # Menu interactif
    interactive_validation_menu(user_email)


if __name__ == '__main__':
    main()

