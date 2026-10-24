#!/usr/bin/env bash
# Download the unofficial BMTC GTFS-derived files (github.com/Vonter/bmtc-gtfs, sourced from the Namma BMTC app).
# Usage: ./00_fetch_data.sh <data_dir>    (~120 MB; keep it out of git)
set -euo pipefail
D="${1:-data}"; mkdir -p "$D"
for f in csv/routes.csv csv/stops.csv geojson/stops.geojson geojson/routes.geojson; do
  curl -sSL -o "$D/$(basename "$f")" "https://raw.githubusercontent.com/Vonter/bmtc-gtfs/main/$f"
done
echo "fetched into $D"
