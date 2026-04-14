# PrivaShield API Reference (English)

## Admin backup endpoints
- `GET /api/admin/backups/config`
- `POST /api/admin/backups/config`
- `GET /api/admin/backups`
- `POST /api/admin/backups/run`

## Internal notes
- `GET /api/mandanten/:mid/interne-notizen`
- `POST /api/mandanten/:mid/interne-notizen`
- `PUT /api/interne-notizen/:id`
- `DELETE /api/interne-notizen/:id`

## Export context
- `GET /api/mandanten/:mid/export-context`

The export context now also includes explicitly export-approved internal notes.


## Functional notes

### Export and internal notes
Export context only includes internal notes that were explicitly approved for export (`exportieren = true`).

### Backup scheduler
Backup management supports manual runs and an internal application scheduler. For unattended encrypted runs, set `PRIVASHIELD_BACKUP_PASSWORD`.

### Governance / maturity
The dashboard maturity score is derived from multiple compliance signals, including policies, VVT coverage, retention mapping, DPIA/privacy responsibility, audits, TOMs, DPAs and task situation.
