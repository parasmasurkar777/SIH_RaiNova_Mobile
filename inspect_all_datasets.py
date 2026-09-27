import os
import sqlite3
import pandas as pd
import json

PROJECT_ROOT = r"c:\01_PARAS\3rd Year\Hackathon\SIH Hackathon 2026\RaiNova-main\RaiNova-main"
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")
DB_PATH = os.path.join(DATASET_DIR, "09_digital_twin_unified_db", "mumbai_digital_twin.db")

print("=== ALL TABLES IN SQLITE DB ===")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in cursor.fetchall()]

for tbl in tables:
    df = pd.read_sql_query(f"SELECT * FROM {tbl}", conn)
    print(f"\nTable: {tbl} | Rows: {len(df)} | Columns: {list(df.columns)}")
    lat_cols = [c for c in df.columns if 'lat' in c.lower()]
    lon_cols = [c for c in df.columns if 'lon' in c.lower() or 'lng' in c.lower()]
    if lat_cols and lon_cols:
        lc, lnc = lat_cols[0], lon_cols[0]
        print(f"  Sample 3 rows:")
        for idx, row in df.head(3).iterrows():
            print(f"    - {row.to_dict()}")

conn.close()

print("\n=== ALL CSVs in DATASET DIR ===")
for root, dirs, files in os.walk(DATASET_DIR):
    for f in files:
        if f.endswith('.csv'):
            fpath = os.path.join(root, f)
            rel = os.path.relpath(fpath, DATASET_DIR)
            df = pd.read_csv(fpath)
            print(f"\nCSV: {rel} | Rows: {len(df)} | Columns: {list(df.columns)}")
            lat_cols = [c for c in df.columns if 'lat' in c.lower()]
            lon_cols = [c for c in df.columns if 'lon' in c.lower() or 'lng' in c.lower()]
            if lat_cols and lon_cols:
                lc, lnc = lat_cols[0], lon_cols[0]
                print(f"  Lat col: {lc} ({df[lc].min():.4f} to {df[lc].max():.4f}) | Lon col: {lnc} ({df[lnc].min():.4f} to {df[lnc].max():.4f})")
                print(f"  Sample:")
                for idx, row in df.head(2).iterrows():
                    print(f"    - {row.to_dict()}")
