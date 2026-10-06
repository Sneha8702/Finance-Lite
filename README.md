# Finance Lite

Finance Lite is a full-stack personal finance tracker with account authentication, email verification, password reset, income and expense tracking, categories, summaries, analytics, and profile management.

## Project structure

```text
Finance-Management/
├── fm_backend/     Django REST API and database models
├── fm_frontend/    React + Vite user interface
└── docs/           Project documentation and supporting material
```

## Quick start

### Backend

```powershell
cd fm_backend
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

See [fm_backend/README.md](fm_backend/README.md) for PostgreSQL and email configuration.

### Frontend

```powershell
cd fm_frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

For access from another device on the same network, run:

```powershell
npm run dev -- --host
```

The backend must listen on the LAN interface:

```powershell
python manage.py runserver 0.0.0.0:8000
```

## Configuration

Never commit real passwords, API keys, SMTP keys, or production secrets. Use `fm_backend/.env` for local secrets and `.env.example` as a template.

The frontend accepts an optional `VITE_API_URL`. Without it, local development uses `127.0.0.1:8000`, while LAN access uses the frontend device hostname.

## Checks

Backend:

```powershell
cd fm_backend
python manage.py check
python manage.py test
```

Frontend:

```powershell
cd fm_frontend
npm run lint
npm run build
```

## Important behavior

- Passwords can be shown or hidden with the eye button.
- Password reset and verification emails are rate-limited and older resend links are invalidated when a new one is sent.
- Expense descriptions are optional.
- Expenses over the available balance require confirmation.
- Logout requires confirmation.
- Financial data is fetched fresh after section changes and transaction updates.
