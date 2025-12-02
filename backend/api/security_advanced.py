"""
Advanced Security Features
- Anomaly detection
- Enhanced logging
- Security monitoring
- Data encryption for sensitive fields
"""
import hashlib
import hmac
import time
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, deque
from pathlib import Path

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    import base64
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("⚠️  Cryptography n'est pas disponible. Chiffrement désactivé.")


class AnomalyDetector:
    """
    Détection d'anomalies pour la sécurité
    - Détection de tentatives de connexion suspectes
    - Détection d'activité anormale
    - Détection de patterns suspects dans les données
    """
    
    def __init__(self):
        self.failed_attempts = defaultdict(deque)  # IP -> list of timestamps
        self.request_patterns = defaultdict(deque)  # IP -> list of request timestamps
        self.alert_threshold = 5  # Nombre d'alertes avant blocage
        self.time_window = 300  # 5 minutes en secondes
    
    def detect_suspicious_login(self, ip: str, success: bool) -> Dict[str, Any]:
        """
        Détecte les tentatives de connexion suspectes
        
        Returns:
            Dict with 'suspicious': bool, 'reason': str, 'action': str
        """
        now = time.time()
        
        if not success:
            # Enregistrer la tentative échouée
            self.failed_attempts[ip].append(now)
            
            # Garder seulement les tentatives dans la fenêtre de temps
            self.failed_attempts[ip] = deque(
                [t for t in self.failed_attempts[ip] if now - t < self.time_window],
                maxlen=100
            )
            
            # Vérifier si trop de tentatives
            if len(self.failed_attempts[ip]) >= 5:
                return {
                    'suspicious': True,
                    'reason': f'{len(self.failed_attempts[ip])} tentatives échouées en 5 minutes',
                    'action': 'block_ip',
                    'severity': 'high'
                }
        else:
            # Connexion réussie, nettoyer les tentatives échouées
            if ip in self.failed_attempts:
                del self.failed_attempts[ip]
        
        return {'suspicious': False}
    
    def detect_rate_limit_abuse(self, ip: str) -> Dict[str, Any]:
        """
        Détecte les abus de rate limiting
        """
        now = time.time()
        
        # Enregistrer la requête
        self.request_patterns[ip].append(now)
        
        # Garder seulement les requêtes dans la fenêtre de temps
        self.request_patterns[ip] = deque(
            [t for t in self.request_patterns[ip] if now - t < 60],  # 1 minute
            maxlen=200
        )
        
        # Vérifier le taux de requêtes
        request_count = len(self.request_patterns[ip])
        
        if request_count > 100:  # Plus de 100 requêtes par minute
            return {
                'suspicious': True,
                'reason': f'{request_count} requêtes par minute (normal: <50)',
                'action': 'rate_limit',
                'severity': 'medium'
            }
        
        return {'suspicious': False}
    
    def detect_data_anomaly(self, data: Dict[str, Any], user_email: str) -> Dict[str, Any]:
        """
        Détecte des anomalies dans les données (valeurs extrêmes, patterns suspects)
        """
        anomalies = []
        
        # Vérifier les montants extrêmes
        if 'data' in data:
            year_data = data.get('data', {})
            
            # Vérifier le salaire mensuel
            monthly_salary = year_data.get('monthlySalary', 0)
            if monthly_salary > 100000:  # Plus de 100k€ par mois
                anomalies.append({
                    'field': 'monthlySalary',
                    'value': monthly_salary,
                    'reason': 'Salaire mensuel anormalement élevé (>100k€)',
                    'severity': 'medium'
                })
            
            # Vérifier les dépenses
            categories = year_data.get('categories', [])
            total_expenses = sum(cat.get('target', 0) for cat in categories)
            
            if total_expenses > 500000:  # Plus de 500k€ de dépenses annuelles
                anomalies.append({
                    'field': 'total_expenses',
                    'value': total_expenses,
                    'reason': 'Dépenses annuelles anormalement élevées (>500k€)',
                    'severity': 'low'
                })
            
            # Vérifier le nombre de catégories
            if len(categories) > 200:
                anomalies.append({
                    'field': 'categories_count',
                    'value': len(categories),
                    'reason': 'Nombre de catégories anormalement élevé (>200)',
                    'severity': 'low'
                })
        
        if anomalies:
            return {
                'suspicious': True,
                'anomalies': anomalies,
                'action': 'log_only',
                'severity': max(a['severity'] for a in anomalies)
            }
        
        return {'suspicious': False}


class DataEncryption:
    """
    Chiffrement des données sensibles
    """
    
    def __init__(self, secret_key: Optional[bytes] = None):
        if not CRYPTO_AVAILABLE:
            self.fernet = None
            return
        
        if secret_key is None:
            # Générer une clé par défaut (à remplacer par une clé sécurisée en production)
            password = b"default_secret_key_change_in_production"
            salt = b"budget_app_salt"
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            self.fernet = Fernet(key)
        else:
            self.fernet = Fernet(secret_key)
    
    def encrypt(self, data: str) -> Optional[str]:
        """Chiffrer une chaîne de caractères"""
        if not CRYPTO_AVAILABLE or self.fernet is None:
            return data  # Retourner en clair si crypto n'est pas disponible
        
        try:
            return self.fernet.encrypt(data.encode()).decode()
        except Exception:
            return data
    
    def decrypt(self, encrypted_data: str) -> Optional[str]:
        """Déchiffrer une chaîne de caractères"""
        if not CRYPTO_AVAILABLE or self.fernet is None:
            return encrypted_data
        
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception:
            return encrypted_data


class SecurityLogger:
    """
    Logger de sécurité avancé avec rotation et alertes
    """
    
    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.security_log = self.log_dir / 'security.log'
        self.anomaly_log = self.log_dir / 'anomalies.log'
    
    def log_security_event(self, event_type: str, ip: str, details: Dict[str, Any], severity: str = 'INFO'):
        """
        Logger un événement de sécurité
        
        Args:
            event_type: Type d'événement (LOGIN_SUCCESS, LOGIN_FAILED, ANOMALY_DETECTED, etc.)
            ip: Adresse IP
            details: Détails de l'événement
            severity: Niveau de sévérité (INFO, WARNING, ERROR, CRITICAL)
        """
        timestamp = datetime.now().isoformat()
        
        log_entry = {
            'timestamp': timestamp,
            'event_type': event_type,
            'ip': ip,
            'severity': severity,
            'details': details
        }
        
        # Écrire dans le log de sécurité
        with open(self.security_log, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        # Si anomalie, écrire aussi dans le log d'anomalies
        if event_type in ['ANOMALY_DETECTED', 'SUSPICIOUS_ACTIVITY']:
            with open(self.anomaly_log, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
        
        # Afficher dans la console si critique
        if severity == 'CRITICAL':
            print(f"🚨 CRITICAL: {event_type} from {ip}: {details}")
    
    def get_recent_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupérer les événements récents"""
        events = []
        
        if not self.security_log.exists():
            return events
        
        try:
            with open(self.security_log, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        event = json.loads(line)
                        if event_type is None or event.get('event_type') == event_type:
                            events.append(event)
                    except json.JSONDecodeError:
                        continue
            
            # Retourner les plus récents
            return sorted(events, key=lambda x: x.get('timestamp', ''), reverse=True)[:limit]
        except Exception:
            return events


def generate_csrf_token_advanced(session_id: str, secret: str) -> str:
    """
    Génère un token CSRF plus sécurisé avec timestamp
    """
    timestamp = str(int(time.time()))
    message = f"{session_id}:{timestamp}"
    
    token = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return f"{timestamp}:{token}"


def verify_csrf_token_advanced(token: str, session_id: str, secret: str, max_age: int = 3600) -> bool:
    """
    Vérifie un token CSRF avec vérification de l'âge
    """
    try:
        parts = token.split(':')
        if len(parts) != 2:
            return False
        
        timestamp_str, token_hash = parts
        timestamp = int(timestamp_str)
        
        # Vérifier l'âge du token
        age = time.time() - timestamp
        if age > max_age or age < 0:
            return False
        
        # Vérifier le hash
        message = f"{session_id}:{timestamp_str}"
        expected_hash = hmac.new(
            secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(token_hash, expected_hash)
    except Exception:
        return False

