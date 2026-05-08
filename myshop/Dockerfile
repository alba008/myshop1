FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# System deps + WeasyPrint runtime libs + Node (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    # WeasyPrint runtime deps
    libgobject-2.0-0 libpango-1.0-0 libpangocairo-1.0-0 \
    libcairo2 libffi-dev shared-mime-info \
    fonts-dejavu-core \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# App code
COPY . /app

# Optional frontend deps
RUN if [ -f package.json ]; then npm ci || npm install; fi

EXPOSE 8000
