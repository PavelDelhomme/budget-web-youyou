#!/usr/bin/env python3
"""
Analyseur de données de consommation mémoire
Analyse les fichiers CSV générés par monitor_memory.sh et génère un rapport détaillé
"""
import sys
import csv
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

try:
    import numpy as np
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("⚠️  pandas/numpy non disponible. Analyse basique uniquement.")


def parse_memory_value(value: str) -> float:
    """Parse une valeur de mémoire (peut contenir MiB, GiB, etc.)"""
    if not value or value == '' or value == '0':
        return 0.0
    value = str(value).strip()
    # Si c'est déjà un nombre
    try:
        return float(value)
    except ValueError:
        # Essayer de parser les unités
        if 'MiB' in value:
            return float(value.replace('MiB', '').strip())
        elif 'GiB' in value:
            return float(value.replace('GiB', '').strip()) * 1024
        elif 'MB' in value:
            return float(value.replace('MB', '').strip())
        elif 'GB' in value:
            return float(value.replace('GB', '').strip()) * 1024
        else:
            return 0.0


def calculate_monitoring_duration(data: List[Dict]) -> Dict:
    """Calcule la durée totale du monitoring basée sur les timestamps"""
    if not data:
        return {'start': None, 'end': None, 'duration': None, 'duration_formatted': 'N/A'}
    
    timestamps = []
    for row in data:
        if isinstance(row.get('timestamp'), datetime):
            timestamps.append(row['timestamp'])
        else:
            try:
                ts = datetime.strptime(str(row.get('timestamp', '')), '%Y-%m-%d %H:%M:%S')
                timestamps.append(ts)
            except:
                continue
    
    if not timestamps:
        return {'start': None, 'end': None, 'duration': None, 'duration_formatted': 'N/A'}
    
    timestamps.sort()
    start_time = timestamps[0]
    end_time = timestamps[-1]
    duration = end_time - start_time
    
    # Formater la durée
    total_seconds = int(duration.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    if hours > 0:
        duration_formatted = f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        duration_formatted = f"{minutes}m {seconds}s"
    else:
        duration_formatted = f"{seconds}s"
    
    return {
        'start': start_time,
        'end': end_time,
        'duration': duration,
        'duration_formatted': duration_formatted,
        'total_seconds': total_seconds
    }


def read_csv_data(filepath: str) -> List[Dict]:
    """Lit les données CSV et les retourne sous forme de liste de dictionnaires"""
    data = []
    
    if not os.path.exists(filepath):
        print(f"❌ Erreur: Le fichier {filepath} n'existe pas")
        return data
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Nettoyer et convertir les valeurs
                try:
                    row['memory_used_mb'] = parse_memory_value(row.get('memory_used_mb', '0'))
                    row['memory_limit_mb'] = parse_memory_value(row.get('memory_limit_mb', '0'))
                    row['memory_percent'] = float(row.get('memory_percent', '0') or '0')
                    row['cpu_percent'] = float(row.get('cpu_percent', '0') or '0')
                    
                    # Convertir le timestamp
                    try:
                        row['timestamp'] = datetime.strptime(row['timestamp'], '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        row['timestamp'] = datetime.now()
                    
                    data.append(row)
                except (ValueError, KeyError) as e:
                    continue  # Ignorer les lignes invalides
    except Exception as e:
        print(f"❌ Erreur lors de la lecture du fichier: {e}")
        return []
    
    return data


def analyze_with_pandas(data: List[Dict]) -> Dict:
    """Analyse avancée avec pandas"""
    if not HAS_PANDAS or not data:
        return {}
    
    df = pd.DataFrame(data)
    
    # Convertir timestamp en datetime si ce n'est pas déjà fait
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
    
    results = {}
    
    # Grouper par conteneur
    for container in df['container'].unique():
        container_df = df[df['container'] == container]
        
        results[container] = {
            'count': len(container_df),
            'memory_used': {
                'mean': container_df['memory_used_mb'].mean(),
                'median': container_df['memory_used_mb'].median(),
                'std': container_df['memory_used_mb'].std(),
                'min': container_df['memory_used_mb'].min(),
                'max': container_df['memory_used_mb'].max(),
                'first': container_df['memory_used_mb'].iloc[0],
                'last': container_df['memory_used_mb'].iloc[-1],
                'trend': container_df['memory_used_mb'].iloc[-1] - container_df['memory_used_mb'].iloc[0],
            },
            'memory_percent': {
                'mean': container_df['memory_percent'].mean(),
                'median': container_df['memory_percent'].median(),
                'max': container_df['memory_percent'].max(),
            },
            'cpu_percent': {
                'mean': container_df['cpu_percent'].mean(),
                'median': container_df['cpu_percent'].median(),
                'max': container_df['cpu_percent'].max(),
            },
            'memory_leak_detected': False,
        }
        
        # Détection de fuite mémoire (augmentation linéaire)
        memory_values = container_df['memory_used_mb'].values
        if len(memory_values) > 10:
            # Calculer la pente (tendance)
            x = np.arange(len(memory_values))
            slope = np.polyfit(x, memory_values, 1)[0]
            
            # Si la pente est positive et significative (> 1 MB par itération)
            if slope > 1.0:
                results[container]['memory_leak_detected'] = True
                results[container]['memory_leak_slope'] = slope
        
        # Détection de pics mémoire
        threshold = container_df['memory_used_mb'].mean() + 2 * container_df['memory_used_mb'].std()
        peaks = container_df[container_df['memory_used_mb'] > threshold]
        results[container]['memory_peaks'] = len(peaks)
        if len(peaks) > 0:
            results[container]['peak_times'] = peaks['timestamp'].tolist()
    
    return results


def analyze_basic(data: List[Dict]) -> Dict:
    """Analyse basique sans pandas"""
    if not data:
        return {}
    
    results = {}
    
    # Grouper par conteneur
    containers = defaultdict(list)
    for row in data:
        containers[row['container']].append(row)
    
    for container, rows in containers.items():
        # Trier par timestamp
        rows.sort(key=lambda x: x.get('timestamp', datetime.now()))
        
        memory_values = [r['memory_used_mb'] for r in rows]
        cpu_values = [r['cpu_percent'] for r in rows]
        memory_percent_values = [r['memory_percent'] for r in rows]
        
        results[container] = {
            'count': len(rows),
            'memory_used': {
                'mean': sum(memory_values) / len(memory_values) if memory_values else 0,
                'min': min(memory_values) if memory_values else 0,
                'max': max(memory_values) if memory_values else 0,
                'first': memory_values[0] if memory_values else 0,
                'last': memory_values[-1] if memory_values else 0,
                'trend': (memory_values[-1] - memory_values[0]) if len(memory_values) > 1 else 0,
            },
            'memory_percent': {
                'mean': sum(memory_percent_values) / len(memory_percent_values) if memory_percent_values else 0,
                'max': max(memory_percent_values) if memory_percent_values else 0,
            },
            'cpu_percent': {
                'mean': sum(cpu_values) / len(cpu_values) if cpu_values else 0,
                'max': max(cpu_values) if cpu_values else 0,
            },
            'memory_leak_detected': False,
        }
        
        # Détection basique de fuite mémoire
        if len(memory_values) > 10:
            trend = results[container]['memory_used']['trend']
            if trend > 10:  # Augmentation de plus de 10 MB
                results[container]['memory_leak_detected'] = True
    
    return results


def print_report(results: Dict, filepath: str, monitoring_duration: Dict, analysis_duration: float):
    """Affiche un rapport détaillé des résultats"""
    print("=" * 80)
    print("📊 RAPPORT D'ANALYSE MÉMOIRE")
    print("=" * 80)
    print(f"📁 Fichier analysé: {filepath}")
    print(f"🕐 Date d'analyse: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Informations sur la période de monitoring
    if monitoring_duration.get('start') and monitoring_duration.get('end'):
        print(f"\n⏱️  PÉRIODE DE MONITORING:")
        print(f"   • Début:       {monitoring_duration['start'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   • Fin:         {monitoring_duration['end'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   • Durée totale: {monitoring_duration['duration_formatted']}")
    
    # Durée d'analyse
    if analysis_duration:
        if analysis_duration < 1:
            analysis_time = f"{analysis_duration * 1000:.0f} ms"
        elif analysis_duration < 60:
            analysis_time = f"{analysis_duration:.2f} s"
        else:
            minutes = int(analysis_duration // 60)
            seconds = analysis_duration % 60
            analysis_time = f"{minutes}m {seconds:.2f}s"
        print(f"   • Temps d'analyse: {analysis_time}")
    
    print()
    
    if not results:
        print("❌ Aucune donnée à analyser")
        return
    
    for container, stats in results.items():
        print("=" * 80)
        print(f"🐳 CONTENEUR: {container}")
        print("=" * 80)
        
        mem_stats = stats['memory_used']
        mem_percent_stats = stats['memory_percent']
        cpu_stats = stats['cpu_percent']
        
        print(f"\n📊 Statistiques générales:")
        print(f"   • Nombre de mesures: {stats['count']}")
        
        print(f"\n💾 Consommation mémoire (MB):")
        print(f"   • Minimum:     {mem_stats['min']:>10.2f} MB")
        print(f"   • Maximum:     {mem_stats['max']:>10.2f} MB")
        print(f"   • Moyenne:     {mem_stats['mean']:>10.2f} MB")
        if 'median' in mem_stats:
            print(f"   • Médiane:     {mem_stats['median']:>10.2f} MB")
        if 'std' in mem_stats:
            print(f"   • Écart-type:  {mem_stats['std']:>10.2f} MB")
        print(f"   • Début:       {mem_stats['first']:>10.2f} MB")
        print(f"   • Fin:         {mem_stats['last']:>10.2f} MB")
        
        trend = mem_stats['trend']
        trend_icon = "📈" if trend > 0 else "📉" if trend < 0 else "➡️"
        trend_text = "augmentation" if trend > 0 else "diminution" if trend < 0 else "stabilité"
        print(f"   • Évolution:   {trend_icon} {trend:>10.2f} MB ({trend_text})")
        
        print(f"\n📈 Pourcentage mémoire:")
        print(f"   • Moyenne:     {mem_percent_stats['mean']:>10.2f}%")
        print(f"   • Maximum:     {mem_percent_stats['max']:>10.2f}%")
        
        print(f"\n⚡ CPU:")
        print(f"   • Moyenne:     {cpu_stats['mean']:>10.2f}%")
        print(f"   • Maximum:     {cpu_stats['max']:>10.2f}%")
        
        # Alertes
        print(f"\n⚠️  Alertes:")
        
        # Fuite mémoire
        if stats.get('memory_leak_detected', False):
            print(f"   🔴 FUITE MÉMOIRE DÉTECTÉE!")
            if 'memory_leak_slope' in stats:
                print(f"      Taux d'augmentation: {stats['memory_leak_slope']:.2f} MB par itération")
        else:
            print(f"   ✅ Aucune fuite mémoire détectée")
        
        # Consommation élevée
        if mem_stats['mean'] > 500:
            print(f"   🟡 Consommation mémoire élevée (moyenne > 500 MB)")
        
        # Pics mémoire
        if 'memory_peaks' in stats and stats['memory_peaks'] > 0:
            print(f"   🟡 {stats['memory_peaks']} pics mémoire détectés")
        
        # Variation importante
        if 'std' in mem_stats and mem_stats['std'] > 50:
            print(f"   🟡 Variation importante de la mémoire (écart-type > 50 MB)")
        
        print()
    
    # Résumé global
    print("=" * 80)
    print("📋 RÉSUMÉ GLOBAL")
    print("=" * 80)
    
    total_memory = sum(stats['memory_used']['mean'] for stats in results.values())
    total_max = sum(stats['memory_used']['max'] for stats in results.values())
    leaks_count = sum(1 for stats in results.values() if stats.get('memory_leak_detected', False))
    
    print(f"💾 Consommation moyenne totale: {total_memory:.2f} MB")
    print(f"💾 Consommation maximale totale: {total_max:.2f} MB")
    print(f"🔴 Conteneurs avec fuite mémoire: {leaks_count}/{len(results)}")
    print()
    
    # Recommandations
    print("=" * 80)
    print("💡 RECOMMANDATIONS")
    print("=" * 80)
    
    recommendations = []
    
    for container, stats in results.items():
        mem_mean = stats['memory_used']['mean']
        trend = stats['memory_used']['trend']
        
        if stats.get('memory_leak_detected', False):
            recommendations.append(f"• {container}: Implémenter un nettoyage mémoire périodique")
        
        if mem_mean > 500:
            recommendations.append(f"• {container}: Optimiser la consommation mémoire (actuellement {mem_mean:.0f} MB)")
        
        if trend > 20:
            recommendations.append(f"• {container}: Investiguer l'augmentation de {trend:.0f} MB")
        
        if 'std' in stats['memory_used'] and stats['memory_used']['std'] > 50:
            recommendations.append(f"• {container}: Stabiliser la consommation mémoire (variation importante)")
    
    if recommendations:
        for rec in recommendations:
            print(rec)
    else:
        print("✅ Aucune recommandation critique. La consommation mémoire est stable.")
    
    print()


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_memory.py <fichier_csv>")
        print("Exemple: python3 analyze_memory.py memory_logs/memory_20241204_143022.csv")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not os.path.exists(filepath):
        print(f"❌ Erreur: Le fichier {filepath} n'existe pas")
        sys.exit(1)
    
    # Mesurer le temps d'analyse
    analysis_start_time = time.time()
    
    print("🔍 Analyse des données mémoire en cours...")
    print()
    
    # Lire les données
    data = read_csv_data(filepath)
    
    if not data:
        print("❌ Aucune donnée valide trouvée dans le fichier")
        sys.exit(1)
    
    print(f"✅ {len(data)} lignes de données chargées")
    print()
    
    # Calculer la durée du monitoring
    monitoring_duration = calculate_monitoring_duration(data)
    
    # Analyser les données
    if HAS_PANDAS:
        print("📊 Analyse avancée avec pandas...")
        results = analyze_with_pandas(data)
    else:
        print("📊 Analyse basique...")
        results = analyze_basic(data)
    
    # Calculer le temps d'analyse
    analysis_duration = time.time() - analysis_start_time
    
    # Afficher le rapport
    print_report(results, filepath, monitoring_duration, analysis_duration)
    
    # Sauvegarder le rapport dans un fichier
    report_file = filepath.replace('.csv', '_report.txt')
    with open(report_file, 'w', encoding='utf-8') as f:
        import io
        from contextlib import redirect_stdout
        
        output = io.StringIO()
        with redirect_stdout(output):
            print_report(results, filepath, monitoring_duration, analysis_duration)
        f.write(output.getvalue())
    
    print(f"💾 Rapport sauvegardé dans: {report_file}")


if __name__ == '__main__':
    main()
