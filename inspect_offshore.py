import sys
import os
import sqlite3
import pandas as pd
import json

PROJECT_ROOT = r"c:\01_PARAS\3rd Year\Hackathon\SIH Hackathon 2026\RaiNova-main\RaiNova-main"
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

from app.data.mumbai_data_loader import load_master_infrastructure

infra = load_master_infrastructure()
all_nodes = infra["hotspots"] + infra["roads"] + infra["drains"] + infra["pumping_stations"]

print("=== CHECKING ALL SIMULATION COMPONENTS FOR OFFSHORE / ANOMALOUS COORDINATES ===")

# Approximate Mumbai Land Polygons/Bounds:
# West coast approximate boundary line:
# Lat 18.90 (Colaba): Lon min ~ 72.810
# Lat 18.95 (Marine Drive/Malabar Hill): Lon min ~ 72.795 (Malabar Hill tip is ~72.795, Walkeshwar)
# Lat 19.00 (Worli/Haji Ali): Lon min ~ 72.810
# Lat 19.05 (Bandra): Lon min ~ 72.818
# Lat 19.10 (Juhu): Lon min ~ 72.822
# Lat 19.15 (Versova): Lon min ~ 72.810
# Lat 19.20 (Madh/Malad West): Lon min ~ 72.785
# Lat 19.25 (Gorai/Manori): Lon min ~ 72.775

offshore_nodes = []
for n in all_nodes:
    lat = n.get("latitude")
    lon = n.get("longitude")
    nid = n.get("id")
    name = n.get("name")
    c_type = n.get("type")
    ward = n.get("ward")

    # Let's check various suspicious conditions:
    # 1. G/S Ward (Worli) has coordinates around lon=72.795 (Worli coast is at ~72.812) -> lon 72.795 is 1.8km out in the Arabian Sea!
    # 2. D Ward (Malabar Hill / Grant Road) has coordinates around lon=72.798 (Sea)
    # 3. C Ward (Marine Lines/Chira Bazaar) has coordinates at lon=72.804 - 72.814 (C Ward is inside land around 72.825; 72.805 is in the middle of Back Bay / Arabian Sea!)
    # 4. A Ward (Colaba/Fort) at lon=72.806 - 72.814 (West of Colaba in Arabian Sea)
    
    # Check Back Bay / Arabian Sea anomalies:
    # At Lat 18.92 - 18.96 (Back Bay area): Land is east of 72.818 (Marine Drive). Any point with lon < 72.815 is in Back Bay / Arabian Sea!
    # At Lat 18.97 - 19.04 (Worli Sea): Land is east of 72.810. Any point with lon < 72.808 is in Arabian Sea!
    # At Lat 19.05 - 19.12 (Bandra/Khar/Juhu Sea): Land is east of 72.820. Any point with lon < 72.818 is in Arabian Sea!

    is_offshore = False
    reason = ""

    if 18.91 <= lat <= 18.96 and lon < 72.818:
        is_offshore = True
        reason = f"Back Bay / Arabian Sea (West of Marine Drive / Colaba, shoreline ~72.820)"
    elif 18.97 <= lat <= 19.04 and lon < 72.808:
        is_offshore = True
        reason = f"Arabian Sea (West of Worli / Haji Ali, shoreline ~72.812)"
    elif 19.05 <= lat <= 19.12 and lon < 72.820:
        is_offshore = True
        reason = f"Arabian Sea (West of Bandra / Khar / Juhu, shoreline ~72.824)"
    elif 19.13 <= lat <= 19.16 and lon < 72.808:
        is_offshore = True
        reason = f"Arabian Sea (West of Versova beach, shoreline ~72.810)"

    if is_offshore:
        offshore_nodes.append((n, reason))

print(f"Found {len(offshore_nodes)} components with coordinates in the sea / offshore:")
for n, reason in offshore_nodes:
    print(f"  - [{n['type']}] ID={n['id']} | Name={n['name']} | Ward={n['ward']} | Lat={n['latitude']:.5f} | Lon={n['longitude']:.5f} | Reason: {reason}")

print("\n=== CHECKING GeoJSON FEATURES IN public/data/ ===")
for gfname in ["mumbai_flood_inundation_zones.geojson", "mumbai_road_network.geojson"]:
    gpath = os.path.join(PROJECT_ROOT, "frontend", "public", "data", gfname)
    if os.path.exists(gpath):
        with open(gpath, 'r', encoding='utf-8') as gf:
            gdata = json.load(gf)
            features = gdata.get("features", [])
            print(f"\nGeoJSON: {gfname} (features: {len(features)})")
            for feat in features[:5]:
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                print(f"  Feature: {props.get('name') or props.get('zone_name') or props.get('road_id')}, geom_type={geom.get('type')}")
