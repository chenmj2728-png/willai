FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# 讓 Cloud Run Jobs 以 python -m ingestion 當入口
ENTRYPOINT ["python","-m","ingestion"]
