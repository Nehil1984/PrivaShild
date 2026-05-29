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


## Internal notes and export approval

PrivaShield also provides a dedicated internal notes area. Notes are only included in export output when they were explicitly marked for export.

## Governance-aware reporting

The export and dashboard views increasingly reflect governance completeness, including retention mapping, audits, TOM coverage and critical task status.

## Client Export & Import (Data-Transfer)

As of version **v1.24.4**, the platform provides a dedicated Data-Transfer area for selective client data export and import:

- **Selective Export:** Choose any combination of the 13 modules, optional AES-256-GCM encryption with password strength validation, and download as a `.privashield` JSON file.
- **Secure Import:** Import `.privashield` files, auto-detect and decrypt password-protected files, target any existing client, and choose from two strategies:
  - *Add:* Appends the imported data to existing modules.
  - *Replace:* Completely wipes target modules before importing the new data.
- **Relationship ID Mapping:** Built-in ID mapping ensures all internal associations (such as VVT ↔ TOM, DSFA ↔ VVT, Tasks ↔ PDCA) are fully restored and linked even when importing data into a different client.

## Container Architecture, Security & Permissions

As of version **v1.23.0**, the PrivaShield container features comprehensive hardening:

### 1. Init System (tini)
The container integrates `tini` as the system init process (PID 1). This ensures that system signals (such as `SIGTERM` when stopping the container via the Unraid WebUI) are gracefully and instantly propagated to the Node.js application, preventing sudden process terminations and ensuring consistent data flushing. `tini` also reaps orphan zombie processes.

### 2. Intelligent Non-Root Runtime (Resilience)
By default, the container starts as `root` to dynamically fix permissions of persistent host volume bind mounts (e.g. `/mnt/user/appdata/privashield/data`) on startup (`chown`/`chmod`), dropping privileges afterwards to the non-root user `privashield` (UID/GID 1099, customizable via `PUID` and `PGID`).
- **Kubernetes & Enterprise Compatibility**: If run in restricted multi-tenant or enterprise container environments prohibiting root startup (e.g., Kubernetes/OpenShift with `runAsNonRoot: true` or Docker `--user`), the entrypoint automatically detects the non-root context. It bypasses the privileged permissions setup and boots the application directly as the active non-root user, preventing startup failures.

### 3. Password Complexity on Updates & Admin Audits
- Serverseide Zod validation is now strictly enforced for all user password updates (min. 12 characters, numbers, uppercase/lowercase, special characters).
- Administrative actions (creating, updating, deleting users, tenants, groups, templates) generate a complete audit trail with exact change diffing (`diffObjects`) stored as JSON.

