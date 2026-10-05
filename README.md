[![Tests](https://github.com/faha111/internship-tracker-api/actions/workflows/test.yml/badge.svg)](https://github.com/faha111/internship-tracker-api/actions)

# Internship Tracker

A full-stack app for tracking internship applications. Log in, add applications, and move them between **Applied → Interview → Offer / Rejected** on a board.

## Features
- Register and log in with **bcrypt**-hashed passwords and **JWT** tokens (2-hour expiry)
- Add, update, delete and filter applications
- **Per-user data isolation**: every database query is scoped to the logged-in user
- Parameterised SQL, so there are no string-built queries
- Integration tests that run automatically on every push with **GitHub Actions**
- React frontend with a four-column board

## Tech stack
| Part | Technology |
|---|---|
| Backend | Node.js 22, Express |
| Database | SQLite (`node:sqlite`) |
| Auth | JSON Web Tokens, bcryptjs |
| Frontend | React 18, Vite |
| Testing / CI | Node test runner, GitHub Actions |

## Run it locally
You need **Node.js 22.13 or newer**.

**1. Backend** (from the project folder)
```bash
npm install
JWT_SECRET=choose-a-long-random-string npm start
```
On Windows PowerShell:
```powershell
$env:JWT_SECRET="choose-a-long-random-string"; npm start
```
The API runs on http://localhost:3000.

**2. Frontend** (in a second terminal)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173.

**3. Tests**
```bash
npm test
```

## API endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | no | Create an account |
| POST | /auth/login | no | Get a JWT |
| GET | /applications?status= | yes | List, optionally filtered |
| POST | /applications | yes | Create |
| PATCH | /applications/:id | yes | Update |
| DELETE | /applications/:id | yes | Delete |
| GET | /stats | yes | Count per status |

## What I learned
- Designing a REST API and protecting routes with JWT middleware
- Why every query must be filtered by user (and testing it)
- Connecting a React frontend to an API with a Vite proxy
- Setting up continuous integration

## Planned improvements
Docker setup, charts on the board, deployment, and rate limiting.
