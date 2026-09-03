# Project Fenix

Proyecto personal para practicar y aplicar diferentes tecnologías DevOps sobre una aplicación sencilla formada por frontend, backend y base de datos.

La idea del proyecto es ir mejorando la infraestructura poco a poco, trabajando con Docker, Kubernetes, GitHub Actions, Terraform y AWS.

## Tecnologías utilizadas

- Docker y Docker Compose
- Kubernetes
- GitHub Actions
- Terraform
- AWS
- Floci
- FastAPI
- PostgreSQL
- Nginx

## Aplicación

El proyecto está formado por tres componentes principales:

- Frontend: frontend en HTML, CSS y JavaScript servido con Nginx.
- Backend: API REST desarrollada con FastAPI.
- PostgreSQL: base de datos utilizada para la persistencia de las tareas.

## Endpoints

La API dispone actualmente de los siguientes endpoints:

- GET /health
- GET /tasks
- POST /tasks
- PATCH /tasks/{id}
- DELETE /tasks/{id}

## Docker

La aplicación está dockerizada utilizando Docker Compose.

Actualmente se levantan tres servicios:

- Frontend
- Backend
- PostgreSQL

El frontend es el único servicio expuesto directamente al host mediante el puerto `8080`. Nginx se encarga de redirigir las peticiones `/api/` hacia el backend.

El backend y PostgreSQL se comunican mediante la red interna de Docker Compose.

Para levantar el proyecto:

```bash
docker compose up -d --build
```

Para comprobar el estado de los contenedores:

```bash
docker compose ps
```

La aplicación queda disponible en:

```text
http://localhost:8080
```

## Kubernetes

También se ha desplegado la aplicación utilizando Kubernetes.

Frontend y backend utilizan Deployments, mientras que PostgreSQL utiliza un StatefulSet para mantener una identidad estable y gestionar el almacenamiento persistente.

Para PostgreSQL se utiliza además un Headless Service y `volumeClaimTemplates` para la creación de su volumen persistente.

Los contenedores tienen configurados:

- Readiness probes
- Liveness probes
- Requests y limits de CPU y memoria

## CI/CD

El proyecto utiliza GitHub Actions para automatizar parte del proceso de integración.

En cada push o pull request a `main` se valida la configuración de Docker Compose, se construye la aplicación y se comprueba que la API responde correctamente.

Cuando los cambios llegan a `main`, también se generan las imágenes Docker de frontend y backend y se publican en GHCR.

## Backend local

Para ejecutar únicamente el backend:

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

API:

```text
http://localhost:8000
```

Documentación de FastAPI:

```text
http://localhost:8000/docs
```

## Frontend local

Para ejecutar únicamente el frontend:

```bash
cd frontend
python -m http.server 5500
```

Disponible en:

```text
http://localhost:5500
```

## Terraform y AWS

Estoy utilizando Terraform para ir creando la infraestructura AWS del proyecto.

Al tratarse de un proyecto personal y de aprendizaje, utilizo Floci para emular los servicios de AWS en local y poder practicar el aprovisionamiento de infraestructura sin generar gastos en una cuenta real de AWS.