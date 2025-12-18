FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 6060

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:6060/api/health || exit 1

# Run application with optimized settings for memory and CPU
# -w 2: 2 workers instead of 4 (reduces memory by ~50%)
# --preload: Load app before forking workers (saves memory)
# --max-requests 1000: Restart workers after 1000 requests (prevents memory leaks)
# --max-requests-jitter 100: Randomize restart to avoid thundering herd
# --worker-class sync: Use sync workers (lighter than async for this app)
# --worker-connections 1000: Max connections per worker
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:6060", "--timeout", "60", "--keep-alive", "5", "--max-requests", "1000", "--max-requests-jitter", "100", "--preload", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
