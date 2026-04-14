# PrivaShield Platform

PrivaShield is a GDPR and compliance management platform for tenant-based privacy governance, documentation, audits, retention management, backups, and exportable reporting.

## Key features
- tenant-based GDPR management
- VVT, AVV, DSFA, incidents, DSR, TOM, audits
- retention concept with deletion classes and VVT linkage
- internal notes with explicit export approval
- automatic in-app backup scheduler
- optional password-based backup encryption
- print/export context for management reports
- German and English UI foundation

## Backup policy
The platform supports automatic retention slots:
- 24 hourly backups
- 7 daily backups
- 4 weekly backups
- 12 monthly backups
- 2 yearly backups

Encrypted backups use AES-256-GCM. For unattended encrypted scheduler runs, provide `PRIVASHIELD_BACKUP_PASSWORD`.
