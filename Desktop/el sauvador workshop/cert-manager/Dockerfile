# Stage 1: Build React frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image — Python + Node.js + Puppeteer
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    # Puppeteer dependencies
    && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 libatk-bridge2.0-0 libcups2 libdrm2 \
    libgbm1 libgtk-3-0 libnss3 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
