import os
import sqlite3
import json
import pandas as pd

PROJECT_ROOT = r"c:\01_PARAS\3rd Year\Hackathon\SIH Hackathon 2026\RaiNova-main\RaiNova-main"
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")
DB_PATH = os.path.join(DATASET_DIR, "09_digital_twin_unified_db", "mumbai_digital_twin.db")

print("=== 1. CHECKING SQLITE DATABASE (mumbai_digital_twin.db) ===")
if os.path.exists(DB_PATH):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables:", tables)

    for table in tables:
        df = pd.read_sql_query(f"SELECT * FROM {table}", conn)
        print(f"\n--- Table: {table} (rows: {len(df)}) ---")
        lat_cols = [c for c in df.columns if 'lat' in c.lower()]
        lon_cols = [c for c in df.columns if 'lon' in c.lower() or 'lng' in c.lower()]
        print(f"Lat cols: {lat_cols}, Lon cols: {lon_cols}")
        for lc in lat_cols:
            for lnc in lon_cols:
                valid = df[[lc, lnc]].dropna()
                if len(valid) > 0:
                    print(f"  [{lc} range: {valid[lc].min():.4f} to {valid[lc].max():.4f}] [{lnc} range: {valid[lnc].min():.4f} to {valid[lnc].max():.4f}]")
                    # Check for outliers: e.g. lon < 72.80 (Arabian Sea) or lon > 73.05 (beyond Mumbra/Thane) or lat < 18.88 or lat > 19.30
                    outliers = df[(df[lnc] < 72.805) | (df[lnc] > 73.05) | (df[lc] < 18.89) | (df[lc] > 19.30)]
                    if len(outliers) > 0:
                        print(f"  WARNING: {len(outliers)} potential outliers/coastal points in {table}:")
                        for _, row in outliers.iterrows():
                            name = row.get('name') or row.get('location_name') or row.get('road_name') or row.get('spot_id') or row.get('id')
                            print(f"    - {name}: lat={row[lc]}, lon={row[lnc]}")
    conn.close()
else:
    print("DB not found at:", DB_PATH)

print("\n=== 2. CHECKING CSV FILES IN dataset/ ===")
for root, dirs, files in os.walk(DATASET_DIR):
    for f in files:
        if f.endswith('.csv'):
            fpath = os.path.join(root, f)
            try:
                df = pd.read_csv(fpath)
                lat_cols = [c for c in df.columns if 'lat' in c.lower()]
                lon_cols = [c for c in df.columns if 'lon' in c.lower() or 'lng' in c.lower()]
                if lat_cols and lon_cols:
                    lc = lat_cols[0]
                    lnc = lon_cols[0]
                    print(f"\nCSV: {f} (rows: {len(df)})")
                    print(f"  {lc}: {df[lc].min():.4f} to {df[lc].max():.4f} | {lnc}: {df[lnc].min():.4f} to {df[lnc].max():.4f}")
                    west_pts = df[df[lnc] < 72.815]
                    if len(west_pts) > 0:
                        print(f"  Far West / Coastal points (lon < 72.815): {len(west_pts)}")
                        for _, row in west_pts.iterrows():
                            name = row.get('name') or row.get('location_name') or row.get('road_name') or row.get('spot_id') or 'N/A'
                            print(f"    - {name}: lat={row[lc]}, lon={row[lnc]}")
            except Exception as e:
                print(f"Error reading {f}: {e}")
