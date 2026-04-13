#!/bin/sh
# Entrypoint: Stellt sicher dass /data dem Container-User gehört,
# auch wenn Unraid das Volume als root mounted.
set -e

# /data-Verzeichnis anlegen falls nicht vorhanden
mkdir -p /data

# Berechtigungen setzen (läuft noch als root)
chown -R privashield:privashield /data
chmod 755 /data

echo "[entrypoint] /data bereit (owner: $(stat -c '%U' /data))"

# Zu privashield-User wechseln und Server starten
exec su-exec privashield node dist/index.cjs
