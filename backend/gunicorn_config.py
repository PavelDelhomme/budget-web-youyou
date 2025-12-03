"""
Configuration Gunicorn pour la production
"""
import multiprocessing
import os

# Nombre de workers (formule recommandée : (2 × CPU) + 1)
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Binding
bind = f"0.0.0.0:{os.environ.get('PORT', 6060)}"

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('LOG_LEVEL', 'info')

# Process naming
proc_name = 'budget-web-backend'

# Worker timeout pour les requêtes longues (ML, etc.)
graceful_timeout = 30

# Preload app pour économiser la mémoire
preload_app = True

# Désactiver l'accès au debugger en production
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

