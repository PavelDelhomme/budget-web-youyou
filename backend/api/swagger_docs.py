"""
Documentation API avec Swagger/OpenAPI
"""
from flask import jsonify

# Schéma OpenAPI/Swagger pour la documentation API
OPENAPI_SPEC = {
    "openapi": "3.0.0",
    "info": {
        "title": "Budget Annuel API",
        "version": "1.0.0",
        "description": "API pour la gestion de budget annuel avec IA et sécurité avancée"
    },
    "servers": [
        {
            "url": "http://localhost:6060",
            "description": "Serveur de développement"
        }
    ],
    "paths": {
        "/api/health": {
            "get": {
                "summary": "Health check",
                "responses": {
                    "200": {
                        "description": "Service healthy"
                    }
                }
            }
        },
        "/api/login": {
            "post": {
                "summary": "Connexion utilisateur",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "email": {"type": "string"},
                                    "password": {"type": "string"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Connexion réussie"},
                    "401": {"description": "Identifiants incorrects"}
                }
            }
        }
        # Plus de routes peuvent être ajoutées ici
    },
    "components": {
        "securitySchemes": {
            "sessionAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": "budget_session"
            }
        }
    }
}


def register_swagger_routes(app):
    """Register Swagger/OpenAPI documentation routes"""
    
    @app.route('/api/docs/openapi.json', methods=['GET'])
    def openapi_spec():
        """Retourner la spécification OpenAPI"""
        return jsonify(OPENAPI_SPEC)
    
    @app.route('/api/docs', methods=['GET'])
    def api_docs():
        """Page de documentation API"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Budget API Documentation</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
            <script>
                SwaggerUIBundle({
                    url: '/api/docs/openapi.json',
                    dom_id: '#swagger-ui',
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.presets.standalone
                    ]
                });
            </script>
        </body>
        </html>
        """

