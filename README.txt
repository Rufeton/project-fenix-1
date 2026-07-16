# Project Fenix

Este proyecto es la parte 1 de 4 donde voy a utilizar diferentes tecnologias como docker, kubernetes,terraform, Github actions,aws, para
poner en mi CV y demostrar que tengo experiencia y conocimientos como Devops.

## Arquitectura

```text
Frontend JavaScript → API FastAPI → PostgreSQL
```

## Componentes

- `frontend/`: HTML, CSS y JavaScript puro.
- `backend/`: API REST FastAPI.
- PostgreSQL: persistencia.

## Endpoints

- `GET /health`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{id}`
- `DELETE /tasks/{id}`

## Backend local

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='postgresql+psycopg://fenix:fenix@localhost:5432/fenix'
uvicorn app.main:app --reload
```

En PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
$env:DATABASE_URL='postgresql+psycopg://fenix:fenix@localhost:5432/fenix'
uvicorn app.main:app --reload
```

API: `http://localhost:8000`
Documentación: `http://localhost:8000/docs`

## Frontend local

```bash
cd frontend
python -m http.server 5500
```

Abre `http://localhost:5500`.

