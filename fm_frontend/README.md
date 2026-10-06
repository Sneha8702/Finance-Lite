# Finance Management Frontend

The frontend is a React 19 application built with Vite.

## Requirements

- Node.js with npm
- The Finance Management backend running on port `8000`

## Install and run

```powershell
cd fm_frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

For LAN access from a phone or another computer:

```powershell
npm run dev -- --host
```

The backend should run with:

```powershell
cd fm_backend
python manage.py runserver 0.0.0.0:8000
```

## API URL

Set `VITE_API_URL` when the API is hosted separately:

```env
VITE_API_URL=http://192.168.1.34:8000
```

Restart Vite after changing environment variables. When `VITE_API_URL` is not set, the app uses `127.0.0.1:8000` for localhost and the current frontend hostname for LAN development.

## Available commands

```powershell
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run preview   # Preview the production build
```

## Main areas

- Login, signup, email verification, and password reset
- Dashboard overview and current balance
- Income and expense entry
- User and shared categories
- Expense history with filters and pagination
- Daily, monthly, and yearly analytics
- Profile, theme switching, logout, and account deletion

The UI includes responsive layouts, password visibility controls, duplicate-submit protection, fresh section data loading, logout confirmation, and confirmation for expenses above the available balance.
