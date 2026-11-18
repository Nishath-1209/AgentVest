# AgentVest Backend - Production Container
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Hugging Face Spaces compatible UID 1000)
RUN useradd -m -u 1000 user
WORKDIR /app

# Upgrade pip and install lightweight CPU-only PyTorch first (fast layer caching)
RUN pip install --upgrade pip setuptools wheel && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application source code
COPY . .

# Ensure data directory exists and assign ownership to non-root user
RUN mkdir -p /app/data && chown -R user:user /app

# Switch to non-root user
USER user

# Expose default port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-7860}/health || exit 1

# Start FastAPI ASGI server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
