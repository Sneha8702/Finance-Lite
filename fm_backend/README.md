# Finance Management Backend

The backend is a Django 6 REST API using Django REST Framework and JWT authentication.

## Requirements

- Python 3.13+
- PostgreSQL for shared/production use, or SQLite for quick local development
- SMTP credentials for real verification and password-reset email delivery

The project virtual environment is expected at `fm_backend/env`.

## Install

```powershell
cd fm_backend
.\env\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and configure the values needed for your environment.

PostgreSQL is enabled when `POSTGRES_DB` is set:

```env
POSTGRES_DB=finance_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_SSLMODE=prefer
POSTGRES_CONN_MAX_AGE=60
```

If `POSTGRES_DB` is omitted, the backend falls back to `db.sqlite3`.

For production, also set:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=example.com,api.example.com
CORS_ALLOWED_ORIGINS=https://example.com
```

## Database setup

Create the PostgreSQL database, then apply migrations:

```powershell
python manage.py migrate
```

Existing SQLite data is not copied automatically to PostgreSQL. Export/import it separately if it needs to be preserved.

## Run the API

Local machine only:

```powershell
python manage.py runserver 127.0.0.1:8000
```

LAN development:

```powershell
python manage.py runserver 0.0.0.0:8000
```

The computer firewall must allow TCP port `8000` on the private network for LAN access.

## Tests and checks

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

## Main API areas

- `/api/token/` and `/api/token/refresh/` — JWT authentication
- `/signup/`, `/verify-email/`, `/forgot-password/`, `/reset-password/` — account email flows
- `/add-income/`, `/add-expense/` — transactions
- `/categories/` — shared and user-owned categories
- `/expense-overview/`, `/analytics/`, `/show-expenses/` — financial summaries and listings
- `/logout/` and `/delete-account/` — account security actions
