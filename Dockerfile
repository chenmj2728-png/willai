FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN if [ -s requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else echo "no requirements.txt, skip"; fi
ENTRYPOINT ["python","-m","ingestion"]
