"""
WSGI entry point for production deployment
"""
import os
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 6060))
    app.run(host="0.0.0.0", port=port, debug=False)

# Application instance for WSGI servers (gunicorn, uwsgi, etc.)
application = app

