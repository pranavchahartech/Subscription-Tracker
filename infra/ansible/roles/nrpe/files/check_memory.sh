#!/usr/bin/env bash
# Nagios NRPE plugin: checks memory usage percentage using /proc/meminfo (MemAvailable).
set -euo pipefail

WARN=80
CRIT=90

while getopts "w:c:" opt; do
  case "$opt" in
    w) WARN="$OPTARG" ;;
    c) CRIT="$OPTARG" ;;
    *) echo "UNKNOWN - Invalid arguments"; exit 3 ;;
  esac
done

MEM_TOTAL_KB=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
MEM_AVAIL_KB=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)

if [[ -z "$MEM_TOTAL_KB" || -z "$MEM_AVAIL_KB" || "$MEM_TOTAL_KB" -eq 0 ]]; then
  echo "UNKNOWN - Could not read /proc/meminfo"
  exit 3
fi

MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))
MEM_USED_PCT=$((MEM_USED_KB * 100 / MEM_TOTAL_KB))
MEM_USED_MB=$((MEM_USED_KB / 1024))
MEM_TOTAL_MB=$((MEM_TOTAL_KB / 1024))

PERF="mem_used_pct=${MEM_USED_PCT}%;${WARN};${CRIT};0;100"

if (( MEM_USED_PCT >= CRIT )); then
  echo "CRITICAL - Memory usage ${MEM_USED_PCT}% (${MEM_USED_MB}MB/${MEM_TOTAL_MB}MB)|${PERF}"
  exit 2
elif (( MEM_USED_PCT >= WARN )); then
  echo "WARNING - Memory usage ${MEM_USED_PCT}% (${MEM_USED_MB}MB/${MEM_TOTAL_MB}MB)|${PERF}"
  exit 1
else
  echo "OK - Memory usage ${MEM_USED_PCT}% (${MEM_USED_MB}MB/${MEM_TOTAL_MB}MB)|${PERF}"
  exit 0
fi
