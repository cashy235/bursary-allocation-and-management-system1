# Bursary Allocation Management System

A full-stack web application for managing bursary applications, reviews, and fund allocations.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL
- **DevOps**: Docker + docker-compose

---

## Quick Start (Docker)

```bash
docker-compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL first, then:
DATABASE_URL=postgresql://bursary:bursary@localhost:5432/bursary_db uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

---

## Seed Sample Data

After the app is running, visit:

```
POST http://localhost:8000/seed
```

Or click **"Seed sample data"** on the login page.

This creates:
- Users: `admin`, `alice`, `bob`
- 3 sample applications (approved, under_review, submitted)
- Budget set to KES 500,000

---

## Login

| Username | Role    | Password     |
|----------|---------|--------------|
| admin    | Admin   | anything     |
| alice    | Student | anything     |
| bob      | Student | anything     |

> Any username other than `admin` gets the student role.

---

## Features

### Students
- Submit bursary applications with financial info
- Upload supporting documents
- Track application status

### Admins
- View all applications with status filters
- Approve / reject / update application status
- Add reviewer notes
- Allocate bursary funds (with budget guard)
- View dashboard stats (total, by status, budget)

---

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /login                      | Mock login               |
| GET    | /applications               | List applications        |
| POST   | /applications               | Submit application       |
| GET    | /applications/{id}          | Get single application   |
| PATCH  | /applications/{id}          | Update status/notes      |
| POST   | /documents/{application_id} | Upload document          |
| POST   | /allocations                | Allocate funds           |
| GET    | /budget                     | Get budget               |
| PUT    | /budget                     | Set total budget         |
| GET    | /admin/stats                | Dashboard statistics     |
| POST   | /seed                       | Seed sample data         |

Full interactive docs at: http://localhost:8000/docs
