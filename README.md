# BAC Boutique ERP

## Environment variables

Set these variables for database connectivity:

- `DATABASE_PROVIDER=sqlite` and `DATABASE_URL=file:./dev.db` for local development.
- `DATABASE_PROVIDER=postgresql` and `DATABASE_URL=postgresql://...` for production (for example on Vercel + managed PostgreSQL).

## Build check

```bash
npm run build
```
