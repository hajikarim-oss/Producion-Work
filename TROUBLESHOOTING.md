# TBM CRM Operations & Troubleshooting Guide

| Symptom | Likely Cause | Resolution |
|---|---|---|
| **Login loop forever** | `SERVER_URL` mismatch | Verify `.env` matches the browser access URL exactly (e.g. `http://localhost:3000` or `https://crm.theboredmonkey.com`). Mismatches break cookie domain validation. |
| **Workflows never fire** | Worker container not running | Check `docker ps` to verify the `worker` service is running. Inspect logs via `docker compose logs -f worker`. |
| **Emails go to log only** | SMTP credentials missing or incorrect | In `docker/.env`, check `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, and `EMAIL_SMTP_PASSWORD`. For local testing, inspect emails via Mailpit at `http://localhost:8025`. |
| **Brand POC sees internal data** | Role field permissions not applied | Ensure the Brand POC user has been assigned the `Brand POC` role (`tbm-role-brand-poc`). Check `src/roles/brand-poc.role.ts` field permissions. |
| **Editor sees other members' projects** | Row-level permission inactive | Self-hosted row-level permissions require the Organization plan license key. In Pro/Community setups, ensure views default to filter `assignedTo = @currentUser`. |
| **Webhook delivery fails** | Receiver URL not reachable or port blocked | Ensure receiver endpoint (`http://localhost:4000/webhook/twenty`) is running. Check container networking if running inside Docker. |
| **HMAC validation fails** | `TWENTY_WEBHOOK_SECRET` mismatch or clock drift | Ensure identical secret in sender and receiver. Check NTP time sync (signatures reject drift > 300 seconds). |
| **Kanban board empty** | `currentStage` field configuration issue | Ensure Kanban layout groups by `currentStage` with select options registered in data model. |
| **Batch import errors (HTTP 413 / 400)** | Payload exceeds 60 records limit | Use `tbm-crm/src/scripts/migrate-sheets.ts` which chunks records into batches of 60 per call. |
