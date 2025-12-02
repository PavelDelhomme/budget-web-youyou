"""
Middleware de compression des réponses API
Compression GZIP pour améliorer les performances
"""
from flask import request as flask_request, after_this_request
import gzip
import functools


def compress_response(f):
    """
    Decorator pour compresser les réponses API avec GZIP
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        @after_this_request
        def compress(response):
            # Vérifier si le client accepte GZIP
            if 'gzip' not in flask_request.headers.get('Accept-Encoding', '').lower():
                return response
            
            # Compresser uniquement les réponses JSON et texte
            if (response.content_type and 
                ('application/json' in response.content_type or 
                 'text/' in response.content_type)):
                
                # Seulement si la réponse fait plus de 1KB
                if len(response.get_data()) > 1024:
                    compressed_data = gzip.compress(response.get_data())
                    response.set_data(compressed_data)
                    response.headers['Content-Encoding'] = 'gzip'
                    response.headers['Content-Length'] = len(compressed_data)
            
            return response
        
        return f(*args, **kwargs)
    
    return decorated_function


def enable_compression(app):
    """
    Activer la compression pour toutes les réponses API
    """
    @app.after_request
    def after_request(response):
        # Vérifier si le client accepte GZIP
        if 'gzip' not in flask_request.headers.get('Accept-Encoding', '').lower():
            return response
        
        # Compresser uniquement les réponses JSON et texte
        if (response.content_type and 
            ('application/json' in response.content_type or 
             'text/' in response.content_type)):
            
            # Seulement si la réponse fait plus de 1KB
            if len(response.get_data()) > 1024:
                compressed_data = gzip.compress(response.get_data())
                response.set_data(compressed_data)
                response.headers['Content-Encoding'] = 'gzip'
                response.headers['Content-Length'] = len(compressed_data)
                response.headers['Vary'] = 'Accept-Encoding'
        
        return response

