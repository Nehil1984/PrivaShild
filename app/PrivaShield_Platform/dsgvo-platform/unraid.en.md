# Running PrivaShield on Unraid

This guide explains how to run **PrivaShield** as a Docker container on **Unraid**.

## Goal
You will get:
- a running PrivaShield container on Unraid
- persistent data storage
- an initial admin account
- a clean baseline for updates and backups

## Automatic backups
PrivaShield now supports an in-app scheduled backup routine with hourly scheduler execution.

Retention:
- 24 hourly
- 7 daily
- 4 weekly
- 12 monthly
- 2 yearly

For unattended encrypted backups, set:

```env
PRIVASHIELD_BACKUP_PASSWORD=your-secure-backup-password
```
