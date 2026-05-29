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

### Export Options & Log Filtering
During report export compilation (`print.html`), sections can be individually toggled via the Export UI (`config.sections`). Transmitted `logs` inside the export context can be filtered client-side by limit count, modules, users, and actions to allow custom reporting matching requirements.

### Security Hardening & Administrative Auditing
All critical administrative API endpoints are backed by strict server-side safeguards:
- **Password Complexity on Updates**: Password changes via `PUT /api/users/:id` enforce Zod-based password rules (min. 12 characters, upper/lowercase, numbers, special characters) defined in `updateUserSchema`.
- **Email Collision Prevention**: Ensures emails cannot be duplicated during user updates by verifying email uniqueness prior to database writes.
- **Strict Input Validation**: All administrative PUT/PATCH endpoints (for tenants, groups, templates) validate incoming request payloads using `.partial()` Zod schemas to protect against database injections and malformed payloads.
- **Global & Diff-based Audit Logs**:
  - Global events lacking tenant scope (e.g. system logins, administrative configuration, user management) are logged under a dedicated global tenant ID `0` (System).
  - Updates to users, tenants, groups, and templates record precise change diffs (`diffObjects`) stored as structured JSON in the log details (`detailsJson`).

