"""
Web Application Firewall (WAF) pour protection avancée
Détection et blocage des attaques communes (SQL Injection, XSS, CSRF, etc.)
"""
import re
import json
import time
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from collections import defaultdict, deque
from pathlib import Path
from flask import request, jsonify
from urllib.parse import unquote


class WebApplicationFirewall:
    """
    Web Application Firewall pour filtrer les requêtes malveillantes
    
    Détecte:
    - SQL Injection
    - XSS (Cross-Site Scripting)
    - Command Injection
    - Path Traversal
    - LDAP Injection
    - XML/XXE Injection
    - SSRF (Server-Side Request Forgery)
    - Des patterns suspects dans les headers
    """
    
    def __init__(self, block_mode: bool = True):
        """
        Args:
            block_mode: Si True, bloque les requêtes. Si False, log seulement.
        """
        self.block_mode = block_mode
        self.blocked_ips = {}  # IP -> blocked_until timestamp
        self.threat_log = deque(maxlen=1000)  # Derniers 1000 événements
        self.ip_threat_count = defaultdict(int)  # IP -> nombre de menaces détectées
        
        # Patterns de détection
        self.sql_injection_patterns = [
            r"(?i)(\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
            r"(?i)(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            r"(?i)(\b(OR|AND)\s+['\"]\w+['\"]\s*=\s*['\"]\w+['\"])",
            r"(?i)(/\*.*?\*/)",
            r"(?i)(--.*?$)",
            r"(?i)(;.*?(DROP|DELETE|UPDATE|INSERT))",
            r"(?i)(\b(CONCAT|CHAR|ASCII|SUBSTRING|CAST|CONVERT)\s*\()",
            r"(?i)(\b(SLEEP|WAITFOR|DELAY)\s*\()",
            r"(?i)(\b(XP_|SP_)\w+)",
            r"(?i)(\b(BENCHMARK|LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\s*\()",
        ]
        
        self.xss_patterns = [
            r"(?i)(<script[^>]*>.*?</script>)",
            r"(?i)(javascript:)",
            r"(?i)(on\w+\s*=)",  # onclick=, onload=, etc.
            r"(?i)(<iframe[^>]*>)",
            r"(?i)(<object[^>]*>)",
            r"(?i)(<embed[^>]*>)",
            r"(?i)(data:text/html)",
            r"(?i)(vbscript:)",
            r"(?i)(<svg[^>]*onload)",
            r"(?i)(expression\s*\()",
            r"(?i)(<img[^>]*src[^>]*javascript:)",
            r"(?i)(alert\s*\()",
            r"(?i)(confirm\s*\()",
            r"(?i)(prompt\s*\()",
            r"(?i)(eval\s*\()",
            r"(?i)(document\.cookie)",
            r"(?i)(window\.location)",
        ]
        
        self.command_injection_patterns = [
            r"[;&|`$\(\)\{\}\[\]<>]",
            r"(?i)(\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp|chmod|chown)\s)",
            r"(?i)(\b(nc|netcat|wget|curl|python|perl|ruby|php|bash|sh)\s)",
            r"(?i)(\||&&|;|\n|\r)",
            r"(?i)(\$\{|\$\(|`[^`]+`)",
        ]
        
        self.path_traversal_patterns = [
            r"\.\.[\\/]",
            r"[\\/]\.\.[\\/]",
            r"\.\.[\\/]\.\.[\\/]",
            r"(?i)(\.\.[\\/]+)+(etc|proc|sys|dev|boot|root|home|var|usr)",
            r"(?i)(\.\.[\\/]+)+[\w\-\.]+(\.(txt|log|conf|ini|xml|json|yaml|yml))",
            r"(?i)(/etc/passwd|/etc/shadow|/proc/|/sys/|/dev/)",
            r"(?i)(windows\s+system32|winnt|boot\.ini)",
        ]
        
        self.ldap_injection_patterns = [
            r"[\(\)&|!]",
            r"(?i)(\*\(|\|\(|&\(|!\([^)]*\))",
            r"(?i)(\([^)]*\)[\(\)&|!])",
        ]
        
        self.xxe_patterns = [
            r"(?i)(<!ENTITY)",
            r"(?i)(SYSTEM\s+['\"])",
            r"(?i)(PUBLIC\s+['\"])",
            r"(?i)(<!DOCTYPE[^>]*\[)",
        ]
        
        self.ssrf_patterns = [
            r"(?i)(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|0:0:0:0:0:0:0:1)",
            r"(?i)(file://|gopher://|dict://|ldap://|tftp://)",
            r"(?i)(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)",
            r"(?i)(metadata\.googleapis\.com|169\.254\.169\.254)",
        ]
        
        # Headers suspects
        self.suspicious_headers = [
            'x-forwarded-host',
            'x-original-url',
            'x-rewrite-url',
            'x-real-ip',
        ]
        
        # User-Agents suspects (bots, scanners)
        self.suspicious_user_agents = [
            r"(?i)(sqlmap|nikto|nmap|masscan|zap|burp|w3af|acunetix|nessus)",
            r"(?i)(bot|crawler|spider|scanner|hack|exploit)",
        ]
        
        # Seuil de blocage
        self.max_threats_per_ip = 5  # Bloque après 5 menaces
        self.block_duration = 3600  # Bloque pendant 1 heure
        self.cleanup_interval = 3600  # Nettoyage toutes les heures
    
    def _check_patterns(self, text: str, patterns: List[str]) -> Tuple[bool, Optional[str]]:
        """
        Vérifie si le texte correspond à un pattern suspect
        
        Returns:
            (is_threat, matched_pattern)
        """
        if not text:
            return False, None
            
        # Décoder les URLs encodées
        try:
            decoded_text = unquote(text)
        except Exception:
            decoded_text = text
        
        for pattern in patterns:
            if re.search(pattern, decoded_text):
                return True, pattern
        
        return False, None
    
    def _check_json_payload(self, data: Any, threat_type: str) -> Tuple[bool, Optional[str]]:
        """Vérifie récursivement un payload JSON"""
        if isinstance(data, dict):
            for key, value in data.items():
                # Vérifier la clé
                is_threat, pattern = self._check_patterns(str(key), self._get_patterns_for_threat(threat_type))
                if is_threat:
                    return True, f"Pattern suspect dans la clé JSON: {pattern}"
                
                # Vérifier la valeur
                is_threat, pattern = self._check_json_payload(value, threat_type)
                if is_threat:
                    return True, pattern
        elif isinstance(data, list):
            for item in data:
                is_threat, pattern = self._check_json_payload(item, threat_type)
                if is_threat:
                    return True, pattern
        elif isinstance(data, str):
            is_threat, pattern = self._check_patterns(data, self._get_patterns_for_threat(threat_type))
            if is_threat:
                return True, pattern
        
        return False, None
    
    def _get_patterns_for_threat(self, threat_type: str) -> List[str]:
        """Retourne les patterns pour un type de menace"""
        pattern_map = {
            'sql_injection': self.sql_injection_patterns,
            'xss': self.xss_patterns,
            'command_injection': self.command_injection_patterns,
            'path_traversal': self.path_traversal_patterns,
            'ldap_injection': self.ldap_injection_patterns,
            'xxe': self.xxe_patterns,
            'ssrf': self.ssrf_patterns,
        }
        return pattern_map.get(threat_type, [])
    
    def _get_client_ip(self) -> str:
        """Récupère l'IP du client en tenant compte des proxies"""
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr or 'unknown'
    
    def _is_ip_blocked(self, ip: str) -> bool:
        """Vérifie si l'IP est bloquée"""
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            else:
                # Le blocage a expiré
                del self.blocked_ips[ip]
                self.ip_threat_count[ip] = 0
        
        return False
    
    def _block_ip(self, ip: str, duration: int = None):
        """Bloque une IP"""
        duration = duration or self.block_duration
        self.blocked_ips[ip] = time.time() + duration
        
        # Log l'événement
        self._log_threat(ip, 'ip_blocked', {
            'blocked_until': datetime.fromtimestamp(self.blocked_ips[ip]).isoformat(),
            'duration': duration
        })
    
    def _log_threat(self, ip: str, threat_type: str, details: Dict[str, Any]):
        """Enregistre une menace détectée"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'ip': ip,
            'threat_type': threat_type,
            'method': request.method,
            'path': request.path,
            'user_agent': request.headers.get('User-Agent', ''),
            'details': details
        }
        
        self.threat_log.append(log_entry)
        self.ip_threat_count[ip] += 1
        
        # Si trop de menaces, bloquer l'IP
        if self.ip_threat_count[ip] >= self.max_threats_per_ip:
            self._block_ip(ip)
        
        # Logger dans un fichier
        try:
            log_file = Path(__file__).parent.parent / 'data' / 'waf.log'
            log_file.parent.mkdir(parents=True, exist_ok=True)
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
        except Exception:
            pass  # Fail silently
    
    def check_request(self) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Vérifie une requête HTTP pour détecter les menaces
        
        Returns:
            (is_safe, threat_info) - Si is_safe=False, la requête est dangereuse
        """
        client_ip = self._get_client_ip()
        
        # Vérifier si l'IP est bloquée
        if self._is_ip_blocked(client_ip):
            return False, {
                'threat_type': 'blocked_ip',
                'reason': 'IP bloquée temporairement',
                'ip': client_ip
            }
        
        threats = []
        
        # 1. Vérifier les headers suspects
        for header_name in self.suspicious_headers:
            if header_name in request.headers:
                header_value = request.headers[header_name]
                is_threat, pattern = self._check_patterns(header_value, self.sql_injection_patterns + self.xss_patterns)
                if is_threat:
                    threats.append({
                        'threat_type': 'suspicious_header',
                        'header': header_name,
                        'value': header_value[:100],  # Limiter la taille
                        'pattern': pattern
                    })
        
        # 2. Vérifier User-Agent suspect
        user_agent = request.headers.get('User-Agent', '')
        for pattern in self.suspicious_user_agents:
            if re.search(pattern, user_agent):
                threats.append({
                    'threat_type': 'suspicious_user_agent',
                    'user_agent': user_agent,
                    'pattern': pattern
                })
                break
        
        # 3. Vérifier les paramètres de l'URL
        for key, value in request.args.items():
            # SQL Injection
            is_threat, pattern = self._check_patterns(str(value), self.sql_injection_patterns)
            if is_threat:
                threats.append({
                    'threat_type': 'sql_injection',
                    'parameter': key,
                    'value': str(value)[:100],
                    'pattern': pattern
                })
                continue
            
            # XSS
            is_threat, pattern = self._check_patterns(str(value), self.xss_patterns)
            if is_threat:
                threats.append({
                    'threat_type': 'xss',
                    'parameter': key,
                    'value': str(value)[:100],
                    'pattern': pattern
                })
                continue
            
            # Command Injection
            is_threat, pattern = self._check_patterns(str(value), self.command_injection_patterns)
            if is_threat:
                threats.append({
                    'threat_type': 'command_injection',
                    'parameter': key,
                    'value': str(value)[:100],
                    'pattern': pattern
                })
                continue
            
            # Path Traversal
            is_threat, pattern = self._check_patterns(str(value), self.path_traversal_patterns)
            if is_threat:
                threats.append({
                    'threat_type': 'path_traversal',
                    'parameter': key,
                    'value': str(value)[:100],
                    'pattern': pattern
                })
        
        # 4. Vérifier le chemin de l'URL
        is_threat, pattern = self._check_patterns(request.path, self.path_traversal_patterns)
        if is_threat:
            threats.append({
                'threat_type': 'path_traversal',
                'path': request.path,
                'pattern': pattern
            })
        
        # 5. Vérifier le body JSON (si présent)
        if request.is_json:
            try:
                json_data = request.get_json(force=True, silent=True)
                if json_data:
                    # Vérifier SQL Injection dans JSON
                    is_threat, pattern = self._check_json_payload(json_data, 'sql_injection')
                    if is_threat:
                        threats.append({
                            'threat_type': 'sql_injection',
                            'location': 'json_body',
                            'pattern': pattern
                        })
                    
                    # Vérifier XSS dans JSON
                    is_threat, pattern = self._check_json_payload(json_data, 'xss')
                    if is_threat:
                        threats.append({
                            'threat_type': 'xss',
                            'location': 'json_body',
                            'pattern': pattern
                        })
            except Exception:
                pass  # Ignorer les erreurs de parsing JSON
        
        # 6. Vérifier les données de formulaire
        if request.form:
            for key, value in request.form.items():
                is_threat, pattern = self._check_patterns(str(value), 
                    self.sql_injection_patterns + self.xss_patterns + self.command_injection_patterns)
                if is_threat:
                    threats.append({
                        'threat_type': 'form_injection',
                        'field': key,
                        'value': str(value)[:100],
                        'pattern': pattern
                    })
        
        # Si des menaces sont détectées
        if threats:
            for threat in threats:
                self._log_threat(client_ip, threat['threat_type'], threat)
            
            return False, {
                'threats': threats,
                'ip': client_ip,
                'method': request.method,
                'path': request.path
            }
        
        return True, None
    
    def get_threat_stats(self) -> Dict[str, Any]:
        """Retourne des statistiques sur les menaces détectées"""
        total_threats = len(self.threat_log)
        blocked_ips_count = len([ip for ip, until in self.blocked_ips.items() if time.time() < until])
        
        # Compter par type de menace
        threat_counts = defaultdict(int)
        for entry in self.threat_log:
            threat_counts[entry['threat_type']] += 1
        
        return {
            'total_threats_detected': total_threats,
            'blocked_ips': blocked_ips_count,
            'threats_by_type': dict(threat_counts),
            'top_threatening_ips': dict(sorted(
                self.ip_threat_count.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10])
        }
    
    def cleanup(self):
        """Nettoie les anciennes entrées"""
        current_time = time.time()
        
        # Nettoyer les IPs bloquées expirées
        expired_ips = [
            ip for ip, until in self.blocked_ips.items()
            if current_time >= until
        ]
        for ip in expired_ips:
            del self.blocked_ips[ip]
            if ip in self.ip_threat_count:
                self.ip_threat_count[ip] = 0


# Instance globale du WAF
_waf_instance: Optional[WebApplicationFirewall] = None


def get_waf() -> WebApplicationFirewall:
    """Retourne l'instance globale du WAF"""
    global _waf_instance
    if _waf_instance is None:
        block_mode = os.environ.get('WAF_BLOCK_MODE', 'true').lower() == 'true'
        _waf_instance = WebApplicationFirewall(block_mode=block_mode)
    return _waf_instance


def waf_protection(f):
    """
    Décorateur pour protéger une route avec le WAF
    """
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        waf = get_waf()
        
        # Nettoyage périodique
        if len(waf.blocked_ips) > 100:
            waf.cleanup()
        
        # Vérifier la requête
        is_safe, threat_info = waf.check_request()
        
        if not is_safe:
            if waf.block_mode:
                # Mode blocage : retourner une erreur
                return jsonify({
                    'error': 'Requête bloquée par le WAF',
                    'reason': 'Menace de sécurité détectée',
                    'threat_type': threat_info.get('threat_type', 'unknown') if threat_info else 'unknown'
                }), 403
            else:
                # Mode log seulement : continuer mais logger
                pass
        
        return f(*args, **kwargs)
    
    return decorated_function



