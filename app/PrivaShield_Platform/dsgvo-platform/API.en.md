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
