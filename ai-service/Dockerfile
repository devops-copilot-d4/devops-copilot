FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai-service/ .
COPY ml/ /ml/
ENV MODEL_PATH=/ml/model.joblib

EXPOSE 8000

CMD ["python", "main.py"]
