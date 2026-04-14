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


## Governance and maturity

The platform now calculates maturity more holistically, based on documented governance and compliance building blocks such as:

- policies and guidelines
- process and procedure documentation
- processing activities register
- linkage between VVT and retention concept
- DPIAs and visible privacy responsibility
- internal audits
- TOM catalog
- processor agreements
- open critical or necessary tasks
- web privacy documentation
- employee privacy documentation

The score is intentionally pragmatic and should be read as a management indicator, not as a formal legal certification.

## Multilingual UI

The app now includes a DE/EN language switch in the top bar. Navigation and key page titles are already connected to the translation layer, while form and detail texts are being migrated step by step.
