import os, datetime as dt, pandas as pd
from google.cloud import bigquery

def run(project=None):
    project = project or os.getenv("GOOGLE_CLOUD_PROJECT")
    today = dt.date.today()
    client = bigquery.Client(project=project)
    table = f"{project}.core.fomc_statements"
    rows = pd.DataFrame([{"publish_date": today, "section": "HealthCheck", "text": "ok"}])
    job = client.load_table_from_dataframe(rows, table)
    job.result()
    print("wrote 1 row ->", table)

if __name__ == "__main__":
    run()
