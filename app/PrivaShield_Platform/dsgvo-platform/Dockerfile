# ─── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ─── Stage 2: Production ───────────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="PrivaShield" \
      org.opencontainers.image.description="Open-Source-Plattform für Datenschutzmanagement und DSGVO-Compliance" \
      org.opencontainers.image.url="https://github.com/Nehil1984/PrivaShild" \
      org.opencontainers.image.source="https://github.com/Nehil1984/PrivaShild" \
      org.opencontainers.image.documentation="https://github.com/Nehil1984/PrivaShild/tree/master/app/PrivaShield_Platform/dsgvo-platform" \
      org.opencontainers.image.licenses="Apache-2.0"

# su-exec + libc-utils für getent/stat-Verfügbarkeit im Entrypoint
RUN apk add --no-cache su-exec libc-utils

# Non-root User anlegen
# GID/UID 1099 (1000 ist auf Unraid oft bereits belegt)
RUN addgroup -g 1099 privashield && \
    adduser -u 1099 -G privashield -s /bin/sh -D privashield

WORKDIR /app

# Nur Produktions-Abhängigkeiten
COPY package*.json ./
RUN npm ci --omit=dev --frozen-lockfile

# Build-Artefakte kopieren
COPY --from=builder /app/dist ./dist

# Entrypoint-Skript kopieren
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# /data vorbereiten (wird zur Laufzeit vom Entrypoint korrekt gesetzt)
RUN mkdir -p /data

# Port freigeben
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

# Umgebungsvariablen
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/data/privashield.db

# Container startet als root, Entrypoint setzt Rechte und startet dann robust die App
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
