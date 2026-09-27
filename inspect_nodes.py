import sys
import os
sys.path.insert(0, r"c:\01_PARAS\3rd Year\Hackathon\SIH Hackathon 2026\RaiNova-main\RaiNova-main\backend")

from app.data.mumbai_data_loader import load_master_infrastructure

infra = load_master_infrastructure()
all_nodes = infra["hotspots"] + infra["roads"] + infra["drains"] + infra["pumping_stations"]

print(f"Total nodes loaded by backend: {len(all_nodes)}")
print(f" - Hotspots: {len(infra['hotspots'])}")
print(f" - Roads: {len(infra['roads'])}")
print(f" - Drains: {len(infra['drains'])}")
print(f" - Pumps: {len(infra['pumping_stations'])}")

print("\n--- ALL NODES COORDINATES SUMMARY ---")
coords_by_type = {}
for n in all_nodes:
    t = n.get("type", "UNKNOWN")
    coords_by_type.setdefault(t, []).append(n)

# Check Mumbai geography:
# Longitude of Mumbai coast:
# Colaba/Nariman Point: 18.90 - 18.94 -> Coast is ~72.815 to 72.83
# Marine Lines / Girgaon: 18.94 - 18.96 -> Coast is ~72.810 to 72.82
# Malabar Hill / Walkeshwar: 18.94 - 18.97 -> Coast extends west to ~72.795 to 72.805
# Worli: 18.99 - 19.02 -> Coast is ~72.810 to 72.820
# Mahim / Dadar: 19.01 - 19.04 -> Coast is ~72.830
# Bandra: 19.05 - 19.07 -> Land is ~72.820 to 72.850
# Juhu / Khar: 19.08 - 19.11 -> Coast is ~72.825
# Versova / Andheri West: 19.12 - 19.15 -> Coast is ~72.810 (Versova beach)
# Madh Island / Marve / Malad West: 19.16 - 19.20 -> Coast is ~72.785 to 72.810
# Gorai / Manori: 19.20 - 19.25 -> Coast is ~72.775 to 72.800

for t, nodes in coords_by_type.items():
    print(f"\nType: {t} (count: {len(nodes)})")
    for n in nodes:
        lat = n.get("latitude")
        lon = n.get("longitude")
        nid = n.get("id")
        name = n.get("name")
        ward = n.get("ward")
        print(f"  [{t}] ID={nid} | Name={name} | Ward={ward} | Lat={lat} | Lon={lon}")
