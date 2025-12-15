#!/usr/bin/env python3
"""
Script pour exécuter tous les tests et générer un rapport complet
"""
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

# Couleurs pour l'affichage
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def run_command(cmd, description):
    """Exécute une commande et retourne le résultat"""
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}{description}{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        
        print(result.stdout)
        if result.stderr:
            print(f"{YELLOW}STDERR:{RESET}")
            print(result.stderr)
        
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        print(f"{RED}Erreur lors de l'exécution: {e}{RESET}")
        return False, "", str(e)


def parse_pytest_output(output):
    """Parse la sortie de pytest pour extraire les statistiques"""
    stats = {
        'passed': 0,
        'failed': 0,
        'skipped': 0,
        'errors': 0,
        'total': 0
    }
    
    lines = output.split('\n')
    for line in lines:
        if 'passed' in line.lower() and ('failed' in line.lower() or 'error' in line.lower() or 'skipped' in line.lower()):
            # Format: "X passed, Y failed, Z skipped"
            parts = line.split(',')
            for part in parts:
                part = part.strip()
                if 'passed' in part.lower():
                    try:
                        stats['passed'] = int(part.split()[0])
                    except:
                        pass
                elif 'failed' in part.lower():
                    try:
                        stats['failed'] = int(part.split()[0])
                    except:
                        pass
                elif 'skipped' in part.lower():
                    try:
                        stats['skipped'] = int(part.split()[0])
                    except:
                        pass
                elif 'error' in part.lower():
                    try:
                        stats['errors'] = int(part.split()[0])
                    except:
                        pass
    
    stats['total'] = stats['passed'] + stats['failed'] + stats['skipped'] + stats['errors']
    return stats


def main():
    """Fonction principale"""
    print(f"\n{BOLD}{BLUE}{'='*60}")
    print(f"{'SCRIPT DE TEST COMPLET - Budget Web Youyou'}")
    print(f"{'='*60}{RESET}\n")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {}
    
    # 1. Tests de scoring bancaire
    success, output, error = run_command(
        "python -m pytest tests/test_bank_scoring.py -v --tb=short",
        "1. Tests de Scoring Bancaire"
    )
    results['bank_scoring'] = {
        'success': success,
        'stats': parse_pytest_output(output),
        'output': output,
        'error': error
    }
    
    # 2. Tests ML
    success, output, error = run_command(
        "python -m pytest tests/backend/test_ml_complete.py tests/backend/test_ml_service_endpoints.py tests/backend/test_ml_performance.py -v --tb=short",
        "2. Tests ML/IA"
    )
    results['ml'] = {
        'success': success,
        'stats': parse_pytest_output(output),
        'output': output,
        'error': error
    }
    
    # 3. Tests de sécurité
    success, output, error = run_command(
        "python -m pytest tests/backend/test_security.py -v --tb=short",
        "3. Tests de Cybersécurité"
    )
    results['security'] = {
        'success': success,
        'stats': parse_pytest_output(output),
        'output': output,
        'error': error
    }
    
    # 4. Tests d'authentification
    success, output, error = run_command(
        "python -m pytest tests/backend/test_auth.py -v --tb=short",
        "4. Tests d'Authentification"
    )
    results['auth'] = {
        'success': success,
        'stats': parse_pytest_output(output),
        'output': output,
        'error': error
    }
    
    # 5. Tests des endpoints
    success, output, error = run_command(
        "python -m pytest tests/backend/test_data_endpoints.py tests/backend/test_years_endpoints.py -v --tb=short",
        "5. Tests des Endpoints API"
    )
    results['endpoints'] = {
        'success': success,
        'stats': parse_pytest_output(output),
        'output': output,
        'error': error
    }
    
    # Résumé
    print(f"\n{BOLD}{BLUE}{'='*60}")
    print(f"{'RÉSUMÉ DES TESTS'}")
    print(f"{'='*60}{RESET}\n")
    
    total_passed = 0
    total_failed = 0
    total_skipped = 0
    total_errors = 0
    total_tests = 0
    
    for category, result in results.items():
        stats = result['stats']
        total_passed += stats['passed']
        total_failed += stats['failed']
        total_skipped += stats['skipped']
        total_errors += stats['errors']
        total_tests += stats['total']
        
        status = f"{GREEN}✓ PASSÉ{RESET}" if result['success'] and stats['failed'] == 0 and stats['errors'] == 0 else f"{RED}✗ ÉCHOUÉ{RESET}"
        
        print(f"{BOLD}{category.upper()}:{RESET} {status}")
        print(f"  Passés: {GREEN}{stats['passed']}{RESET}, Échoués: {RED}{stats['failed']}{RESET}, Ignorés: {YELLOW}{stats['skipped']}{RESET}, Erreurs: {RED}{stats['errors']}{RESET}")
        if stats['total'] > 0:
            success_rate = (stats['passed'] / stats['total']) * 100
            print(f"  Taux de réussite: {success_rate:.1f}%\n")
    
    print(f"\n{BOLD}Total:{RESET}")
    print(f"  Passés: {GREEN}{total_passed}{RESET}")
    print(f"  Échoués: {RED}{total_failed}{RESET}")
    print(f"  Ignorés: {YELLOW}{total_skipped}{RESET}")
    print(f"  Erreurs: {RED}{total_errors}{RESET}")
    print(f"  Total: {total_tests}")
    
    if total_tests > 0:
        overall_success_rate = (total_passed / total_tests) * 100
        print(f"\n{BOLD}Taux de réussite global: {overall_success_rate:.1f}%{RESET}")
        
        if overall_success_rate >= 80:
            print(f"{GREEN}{BOLD}✓ Système en bon état !{RESET}")
        elif overall_success_rate >= 60:
            print(f"{YELLOW}{BOLD}⚠ Système nécessite des améliorations{RESET}")
        else:
            print(f"{RED}{BOLD}✗ Système nécessite des corrections importantes{RESET}")
    
    # Sauvegarder le rapport JSON
    report_file = Path(__file__).parent.parent / 'data' / 'test_report.json'
    report_file.parent.mkdir(exist_ok=True)
    
    report_data = {
        'date': datetime.now().isoformat(),
        'summary': {
            'total_passed': total_passed,
            'total_failed': total_failed,
            'total_skipped': total_skipped,
            'total_errors': total_errors,
            'total_tests': total_tests,
            'success_rate': overall_success_rate if total_tests > 0 else 0
        },
        'results': {
            k: {
                'success': v['success'],
                'stats': v['stats']
            } for k, v in results.items()
        }
    }
    
    with open(report_file, 'w') as f:
        json.dump(report_data, f, indent=2)
    
    print(f"\n{BLUE}Rapport sauvegardé dans: {report_file}{RESET}\n")
    
    return 0 if total_failed == 0 and total_errors == 0 else 1


if __name__ == '__main__':
    sys.exit(main())

