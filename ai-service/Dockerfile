FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train the Random Forest model and serialize model.joblib in /app/ml
RUN python ml/train.py

# Create symlink /ml -> /app/ml for compatibility
RUN ln -s /app/ml /ml

EXPOSE 8000

CMD ["python", "main.py"]
