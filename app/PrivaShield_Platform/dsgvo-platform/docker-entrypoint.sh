#!/bin/sh
# Entrypoint: Stellt sicher, dass /data nutzbar ist und startet die App robust.
set -eu

APP_USER="privashield"
APP_GROUP="privashield"
APP_UID="${PUID:-1099}"
APP_GID="${PGID:-1099}"

mkdir -p /data

if ! getent group "$APP_GROUP" >/dev/null 2>&1; then
  addgroup -g "$APP_GID" "$APP_GROUP" >/dev/null 2>&1 || true
fi

if ! id -u "$APP_USER" >/dev/null 2>&1; then
  adduser -u "$APP_UID" -G "$APP_GROUP" -s /bin/sh -D "$APP_USER" >/dev/null 2>&1 || true
fi

chown -R "$APP_USER:$APP_GROUP" /data || true
chmod 755 /data || true

echo "[entrypoint] /data bereit (owner: $(stat -c '%U' /data 2>/dev/null || echo unknown))"
echo "[entrypoint] starte app mit node /app/dist/index.cjs"

exec su-exec "$APP_USER:$APP_GROUP" node /app/dist/index.cjs
