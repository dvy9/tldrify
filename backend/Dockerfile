FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
  UV_LINK_MODE=copy \
  UV_PYTHON_DOWNLOADS=0

COPY uv.lock pyproject.toml /app/
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked --no-dev

COPY main.py /app

FROM python:3.12-slim-bookworm

ENV PATH="/app/.venv/bin:$PATH" \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1

ARG UID=1001
ARG GID=1001
RUN groupadd -g $GID appuser && \
  useradd -m -u $UID -g $GID appuser

COPY --from=builder --chown=appuser:appuser /app /app
WORKDIR /app
USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--workers", "4"]
