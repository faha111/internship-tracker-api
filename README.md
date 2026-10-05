# Internship Tracker API

A REST API for tracking internship applications. Built to practise secure backend basics: authentication, authorisation, validation and automated tests.

## Features
- Register / login with **bcrypt**-hashed passwords and **JWT** access tokens (2h expiry)
- CRUD for applications (`applied → interview → offer / rejected`)
- Filter by status, and a `/stats` summary
- **Per-user data isolation**: every query is scoped to the logged-in user
- Parameterised SQL everywhere (no string-built queries)
- Integration tests using Node's built-in test runner

## Tech
Node.js 22, Express, SQLite (`node:sqlite`), JSON Web Tokens, bcryptjs

## Run it
```bash
npm install
cp .env.example .env      # then set a long random JWT_SECRET
export JWT_SECRET=your-secret   # or load .env with your shell
npm start
npm test
```

## Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | no | Create account |
| POST | /auth/login | no | Get a JWT |
| GET | /applications?status= | yes | List (optionally filtered) |
| POST | /applications | yes | Create |
| PATCH | /applications/:id | yes | Update |
| DELETE | /applications/:id | yes | Delete |
| GET | /stats | yes | Count per status |

## Ideas to extend
Rate limiting, refresh tokens, a React frontend, Docker, deployment.
