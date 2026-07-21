FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 \
            --gid appgroup \
            --shell /usr/sbin/nologin \
            --no-create-home \
            appuser

COPY requirements.txt .

RUN pip install \
    --no-cache-dir \
    --only-binary=:all: \
    -r requirements.txt

COPY --chown=appuser:appgroup app ./app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]