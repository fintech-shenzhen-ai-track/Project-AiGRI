FROM python:3.12-slim
ARG SERVICE
WORKDIR /app
COPY ${SERVICE}/ /app/
ENV PYTHONUNBUFFERED=1
CMD ["python", "app.py"]
